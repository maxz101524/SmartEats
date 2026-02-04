import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getUserProfile, upsertUserProfile } from "@/lib/db/queries";

function normalizeStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(session.user.id);
  return NextResponse.json({ success: true, profile });
}

export async function PUT(request: Request) {
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

  const payload = {
    dailyCalories: normalizeNumber(body.dailyCalories),
    dailyProtein: normalizeNumber(body.dailyProtein),
    dailyCarbs: normalizeNumber(body.dailyCarbs),
    dailyFat: normalizeNumber(body.dailyFat),
    dietaryFlags: normalizeStringArray(body.dietaryFlags),
    allergens: normalizeStringArray(body.allergens),
    excludedIngredients: normalizeStringArray(body.excludedIngredients),
    preferredIngredients: normalizeStringArray(body.preferredIngredients),
    preferredCuisines: normalizeStringArray(body.preferredCuisines),
    notes: typeof body.notes === "string" ? body.notes.trim() : null,
  };

  const profile = await upsertUserProfile(session.user.id, payload);
  return NextResponse.json({ success: true, profile });
}
