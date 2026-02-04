import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { createMealLog, getDiningHallBySlug } from "@/lib/db/queries";

type MealHistoryItemPayload = {
  menuItemId?: number | null;
  name: string;
  quantity?: number;
  nutrition?: {
    calories?: number | null;
    protein?: string | number | null;
    carbs?: string | number | null;
    fat?: string | number | null;
    fiber?: string | number | null;
    sugar?: string | number | null;
    sodium?: number | null;
  } | null;
};

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const diningHallSlug =
    typeof body.diningHallSlug === "string" ? body.diningHallSlug : null;
  const date = typeof body.date === "string" ? body.date : null;
  const mealPeriod = typeof body.mealPeriod === "string" ? body.mealPeriod : null;
  const source = typeof body.source === "string" ? body.source : "manual";
  const notes = typeof body.notes === "string" ? body.notes : null;
  const items = Array.isArray(body.items) ? (body.items as MealHistoryItemPayload[]) : [];

  if (!date || !mealPeriod || items.length === 0) {
    return NextResponse.json(
      { error: "date, mealPeriod, and items are required" },
      { status: 400 }
    );
  }

  const diningHall = diningHallSlug
    ? await getDiningHallBySlug(diningHallSlug)
    : null;

  const log = await createMealLog(
    {
      userId: session.user.id,
      diningHallId: diningHall?.id ?? null,
      date,
      mealPeriod,
      source,
      notes,
    },
    items.map((item) => ({
      menuItemId: item.menuItemId ?? null,
      itemName: item.name,
      quantity: Math.max(1, item.quantity ?? 1),
      calories: item.nutrition?.calories ?? null,
      protein: toNumber(item.nutrition?.protein ?? null),
      carbs: toNumber(item.nutrition?.carbs ?? null),
      fat: toNumber(item.nutrition?.fat ?? null),
      fiber: toNumber(item.nutrition?.fiber ?? null),
      sugar: toNumber(item.nutrition?.sugar ?? null),
      sodium: item.nutrition?.sodium ?? null,
    }))
  );

  return NextResponse.json({ success: true, logId: log.id });
}
