import { NextRequest, NextResponse } from "next/server";
import { generateNutritionForItem, generateMissingNutrition } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/nutrition - Generate nutrition for specific item(s)
 * GET /api/nutrition - Generate nutrition for all items missing it
 */

export async function GET(request: NextRequest) {
  // Verify authorization for batch operations
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const results = await generateMissingNutrition();

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Nutrition generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { menuItemId } = body;

    if (!menuItemId || typeof menuItemId !== "number") {
      return NextResponse.json(
        { error: "menuItemId is required and must be a number" },
        { status: 400 }
      );
    }

    const result = await generateNutritionForItem(menuItemId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        menuItemId,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Nutrition generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

