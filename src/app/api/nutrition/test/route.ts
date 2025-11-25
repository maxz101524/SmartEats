import { NextRequest, NextResponse } from "next/server";
import { generateNutritionForDish } from "@/lib/openai";

export const runtime = "nodejs";

/**
 * POST /api/nutrition/test - Test nutrition generation without database
 * Body: { "dishName": "Grilled Chicken Breast", "category": "Entree" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dishName, category } = body;

    if (!dishName || typeof dishName !== "string") {
      return NextResponse.json(
        { error: "dishName is required and must be a string" },
        { status: 400 }
      );
    }

    console.log(`Testing nutrition generation for: ${dishName}`);
    
    const startTime = Date.now();
    const nutrition = await generateNutritionForDish(dishName, category);
    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      dishName,
      category: category || "General",
      nutrition,
      timing: {
        durationMs: duration,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Nutrition test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/nutrition/test - Simple health check for the OpenAI integration
 */
export async function GET() {
  const hasApiKey = !!process.env.OPENAI_API_KEY;
  
  return NextResponse.json({
    status: "ok",
    openaiConfigured: hasApiKey,
    message: hasApiKey 
      ? "OpenAI API key is configured. POST a dishName to test nutrition generation."
      : "OPENAI_API_KEY is not set. Please configure it in .env.local",
  });
}

