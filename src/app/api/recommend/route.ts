import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { parseRecommendationPrompt } from "@/lib/openai";
import {
  getMenuWithNutrition,
  getUserProfile,
  getRecentMealItems,
} from "@/lib/db/queries";
import { recommendFromMenu } from "@/lib/recommendations/engine";
import type { RecommendationConstraints } from "@/lib/types";

const HARD_MAX_ITEMS = 6;

function uniqueStrings(values: (string | null | undefined)[]) {
  return Array.from(
    new Set(
      values
        .map((v) => (typeof v === "string" ? v.trim().toLowerCase() : ""))
        .filter(Boolean)
    )
  );
}

function clampMaxItems(value: number | null | undefined) {
  if (!value || !Number.isFinite(value)) return null;
  return Math.min(Math.max(1, Math.round(value)), HARD_MAX_ITEMS);
}

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: Request) {
  if (!process.env.POSTGRES_URL) {
    return NextResponse.json(
      { error: "Database not configured for recommendations." },
      { status: 400 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt : "";
  const diningHall = typeof body.diningHall === "string" ? body.diningHall : null;
  const date = typeof body.date === "string" ? body.date : null;
  const mealPeriod =
    typeof body.mealPeriod === "string" ? body.mealPeriod.toLowerCase() : null;
  const maxItems = clampMaxItems(
    typeof body.maxItems === "number" ? body.maxItems : null
  );

  if (!prompt || !diningHall || !date || !mealPeriod) {
    return NextResponse.json(
      { error: "prompt, diningHall, date, and mealPeriod are required" },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const profile = userId ? await getUserProfile(userId) : null;
  const recentItems = userId ? await getRecentMealItems(userId, 14) : [];
  const recentItemIds = new Set(
    recentItems.map((item) => item.menuItemId).filter(Boolean) as number[]
  );

  let parsed: RecommendationConstraints;
  try {
    parsed = await parseRecommendationPrompt(prompt);
  } catch {
    parsed = {
      minProtein: null,
      maxCalories: null,
      minCalories: null,
      maxCarbs: null,
      maxFat: null,
      dietaryFlags: [],
      excludeAllergens: [],
      avoidIngredients: [],
      preferIngredients: [],
      maxItems: null,
      mealPeriod: null,
    };
  }

  const mergedConstraints: RecommendationConstraints = {
    ...parsed,
    mealPeriod,
    maxItems: clampMaxItems(maxItems ?? parsed.maxItems),
    dietaryFlags: uniqueStrings([
      ...parsed.dietaryFlags,
      ...(Array.isArray(body.dietaryFlags) ? body.dietaryFlags : []),
      ...(profile?.dietaryFlags ?? []),
    ]),
    excludeAllergens: uniqueStrings([
      ...parsed.excludeAllergens,
      ...(Array.isArray(body.excludeAllergens) ? body.excludeAllergens : []),
      ...(profile?.allergens ?? []),
    ]),
    avoidIngredients: uniqueStrings([
      ...parsed.avoidIngredients,
      ...(Array.isArray(body.avoidIngredients) ? body.avoidIngredients : []),
      ...(profile?.excludedIngredients ?? []),
    ]),
    preferIngredients: uniqueStrings([
      ...parsed.preferIngredients,
      ...(Array.isArray(body.preferIngredients) ? body.preferIngredients : []),
      ...(profile?.preferredIngredients ?? []),
    ]),
  };

  const menu = await getMenuWithNutrition(diningHall, date);
  if (!menu || !menu.meals[mealPeriod]) {
    return NextResponse.json(
      { error: "No menu data for this meal period." },
      { status: 404 }
    );
  }

  const dailyGoals = {
    calories: profile?.dailyCalories ?? (body.dailyCalories as number | null | undefined),
    protein: profile?.dailyProtein ?? (body.dailyProtein as number | null | undefined),
    carbs: profile?.dailyCarbs ?? (body.dailyCarbs as number | null | undefined),
    fat: profile?.dailyFat ?? (body.dailyFat as number | null | undefined),
  };

  const itemsForRecommendations = menu.meals[mealPeriod].map((item) => {
    const nutrition = {
      calories: item.calories ?? null,
      protein: toNumber(item.protein),
      carbs: toNumber(item.carbs),
      fat: toNumber(item.fat),
      fiber: toNumber(item.fiber),
      sugar: toNumber(item.sugar),
      sodium: item.sodium ?? null,
      servingSize: item.servingSize ?? null,
      vitamins: item.vitamins ?? null,
      minerals: item.minerals ?? null,
      allergens: item.allergens ?? null,
      dietaryFlags: item.dietaryFlags ?? null,
    };
    const hasNutrition =
      nutrition.calories !== null ||
      nutrition.protein !== null ||
      nutrition.carbs !== null ||
      nutrition.fat !== null ||
      nutrition.fiber !== null ||
      nutrition.sugar !== null ||
      nutrition.sodium !== null ||
      nutrition.servingSize !== null ||
      (nutrition.vitamins && Object.keys(nutrition.vitamins).length > 0) ||
      (nutrition.minerals && Object.keys(nutrition.minerals).length > 0) ||
      (nutrition.allergens && nutrition.allergens.length > 0) ||
      (nutrition.dietaryFlags && nutrition.dietaryFlags.length > 0);

    return {
      id: item.itemId,
      name: item.itemName,
      category: item.itemCategory,
      course: item.course,
      nutrition: hasNutrition ? nutrition : null,
    };
  });

  const result = recommendFromMenu(
    itemsForRecommendations,
    mergedConstraints,
    dailyGoals,
    recentItemIds
  );

  return NextResponse.json({
    success: true,
    recommendation: result,
    source: "database",
  });
}
