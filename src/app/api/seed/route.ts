import { NextRequest, NextResponse } from "next/server";
import { scrapeAndPersistMenu } from "@/lib/scraper/service";
import { generateMissingNutrition } from "@/lib/openai";
import { getAvailableDiningHalls, type DiningHallSlug } from "@/lib/scraper";
import { formatDateISO } from "@/lib/utils";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for seeding

/**
 * Seed endpoint - scrapes menus for the past week and generates nutrition
 * POST /api/seed
 * 
 * This is useful for initial setup or recovering from data issues.
 * Requires CRON_SECRET authorization.
 */
export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const daysBack = parseInt(searchParams.get("days") || "7");
  const daysForward = parseInt(searchParams.get("forward") || "3");
  const skipNutrition = searchParams.get("skipNutrition") === "true";

  const results = {
    scraping: {
      success: 0,
      failed: 0,
      totalItems: 0,
      details: [] as { hall: string; date: string; items: number; error?: string }[],
    },
    nutrition: {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: skipNutrition,
    },
    duration: 0,
  };

  const startTime = Date.now();

  try {
    const halls = getAvailableDiningHalls();
    const today = new Date();

    // Generate date range
    const dates: string[] = [];
    for (let i = -daysBack; i <= daysForward; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push(formatDateISO(date));
    }

    // Scrape each hall for each date
    for (const hall of halls) {
      for (const date of dates) {
        try {
          const result = await scrapeAndPersistMenu(hall, date);
          
          if (result.success) {
            results.scraping.success++;
            results.scraping.totalItems += result.itemCount;
            results.scraping.details.push({
              hall,
              date,
              items: result.itemCount,
            });
          } else {
            results.scraping.failed++;
            results.scraping.details.push({
              hall,
              date,
              items: 0,
              error: result.error,
            });
          }
        } catch (error) {
          results.scraping.failed++;
          results.scraping.details.push({
            hall,
            date,
            items: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }

        // Small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Generate nutrition for all items
    if (!skipNutrition && process.env.OPENAI_API_KEY) {
      try {
        const nutritionResults = await generateMissingNutrition();
        results.nutrition = {
          ...nutritionResults,
          skipped: false,
        };
      } catch (error) {
        console.error("Nutrition generation error:", error);
        results.nutrition = {
          processed: 0,
          successful: 0,
          failed: 1,
          skipped: false,
        };
      }
    }

    results.duration = Math.round((Date.now() - startTime) / 1000);

    return NextResponse.json({
      success: true,
      message: "Seeding completed",
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    results.duration = Math.round((Date.now() - startTime) / 1000);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        ...results,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

