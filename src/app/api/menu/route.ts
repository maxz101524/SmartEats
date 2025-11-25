import { NextRequest, NextResponse } from "next/server";
import { formatDateISO } from "@/lib/utils";
import { fetchMenuFromApi, getDiningHallInfo, type DiningHallSlug } from "@/lib/scraper";

export const runtime = "nodejs";

// Check if database is available
const isDatabaseConfigured = !!process.env.POSTGRES_URL;

/**
 * GET /api/menu?hall=ikenberry&date=2024-01-15
 * Fetch menu with nutrition info for a specific dining hall and date
 * Falls back to live UIUC API if database is not configured
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const hall = searchParams.get("hall") || "ikenberry";
  const date = searchParams.get("date") || formatDateISO(new Date());

  try {
    // If database is configured, use it
    if (isDatabaseConfigured) {
      const { getMenuWithNutrition } = await import("@/lib/db/queries");
      const menuData = await getMenuWithNutrition(hall, date);

      if (menuData) {
        return NextResponse.json({
          success: true,
          data: transformDatabaseData(menuData),
          source: "database",
        });
      }
    }

    // Fallback to live API (demo mode)
    const hallInfo = getDiningHallInfo(hall as DiningHallSlug);
    if (!hallInfo) {
      return NextResponse.json(
        { success: false, error: `Unknown dining hall: ${hall}` },
        { status: 400 }
      );
    }

    const liveData = await fetchMenuFromApi(hall as DiningHallSlug, date);
    
    if (!liveData || liveData.meals.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No menu data available for this date. The dining hall may be closed (e.g., during breaks).",
          hall,
          date,
        },
        { status: 404 }
      );
    }

    // Transform live data for frontend
    const transformedMeals: Record<string, Array<{
      id: number;
      name: string;
      category: string | null;
      course: string | null;
      traits: string[];
      nutrition: null;
    }>> = {};

    let itemId = 1;
    for (const meal of liveData.meals) {
      const mealPeriod = meal.mealPeriod;
      transformedMeals[mealPeriod] = meal.items.map((item) => ({
        id: itemId++,
        name: item.name,
        category: item.category || null,
        course: item.course || null,
        traits: item.traits || [],
        nutrition: null, // No nutrition data in demo mode
      }));
    }

    return NextResponse.json({
      success: true,
      data: {
        diningHall: {
          id: 0,
          name: hallInfo.name,
          slug: hallInfo.slug,
        },
        date,
        meals: transformedMeals,
      },
      source: "live_api",
      note: "Database not configured. Showing live menu data without nutrition info.",
    });
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper to transform database data
function transformDatabaseData(menuData: {
  diningHall: {
    id: number;
    name: string;
    slug: string;
    createdAt: Date;
  };
  date: string;
  meals: Record<string, Array<{
    menuId: number;
    mealPeriod: string;
    itemId: number;
    itemName: string;
    itemCategory: string | null;
    course: string | null;
    calories: number | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    fiber: string | null;
    sugar: string | null;
    sodium: number | null;
    servingSize: string | null;
    vitamins: unknown;
    minerals: unknown;
    allergens: string[] | null;
    dietaryFlags: string[] | null;
  }>>;
}) {
  const transformedMeals: Record<string, Array<{
    id: number;
    name: string;
    category: string | null;
    course: string | null;
    nutrition: {
      calories: number | null;
      protein: string | null;
      carbs: string | null;
      fat: string | null;
      fiber: string | null;
      sugar: string | null;
      sodium: number | null;
      servingSize: string | null;
      vitamins: Record<string, number> | null;
      minerals: Record<string, number> | null;
      allergens: string[] | null;
      dietaryFlags: string[] | null;
    } | null;
  }>> = {};

  for (const [mealPeriod, items] of Object.entries(menuData.meals)) {
    transformedMeals[mealPeriod] = items.map((item) => ({
      id: item.itemId,
      name: item.itemName,
      category: item.itemCategory,
      course: item.course,
      nutrition: item.calories !== null ? {
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        sugar: item.sugar,
        sodium: item.sodium,
        servingSize: item.servingSize,
        vitamins: item.vitamins as Record<string, number> | null,
        minerals: item.minerals as Record<string, number> | null,
        allergens: item.allergens as string[] | null,
        dietaryFlags: item.dietaryFlags as string[] | null,
      } : null,
    }));
  }

  return {
    diningHall: {
      id: menuData.diningHall.id,
      name: menuData.diningHall.name,
      slug: menuData.diningHall.slug,
    },
    date: menuData.date,
    meals: transformedMeals,
  };
}

