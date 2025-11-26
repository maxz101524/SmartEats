import { NextRequest, NextResponse } from "next/server";
import { scrapeAndPersistMenu } from "@/lib/scraper/service";
import { getAvailableDiningHalls, type DiningHallSlug } from "@/lib/scraper";
import { formatDateISO } from "@/lib/utils";

// Vercel Cron will call this endpoint daily
// Now includes nutrition generation, so needs longer timeout
export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes - allows time for nutrition generation

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Allow requests without auth in development, but require it in production
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return runScraper(request);
}

export async function POST(request: NextRequest) {
  // POST endpoint for manual triggers (with auth)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runScraper(request);
}

async function runScraper(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get parameters
  const date = searchParams.get("date") || formatDateISO(new Date());
  const hall = searchParams.get("hall") as DiningHallSlug | null;

  const startTime = Date.now();

  try {
    const results: Record<string, { success: boolean; itemCount: number; newItems: number; error?: string }> = {};
    
    // If specific hall requested, scrape only that one
    if (hall) {
      const result = await scrapeAndPersistMenu(hall, date);
      results[hall] = result;
    } else {
      // Scrape all dining halls
      const halls = getAvailableDiningHalls();
      
      for (const hallSlug of halls) {
        const result = await scrapeAndPersistMenu(hallSlug, date);
        results[hallSlug] = result;
        
        // Small delay between halls
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    const totalItems = Object.values(results).reduce(
      (sum, r) => sum + r.itemCount,
      0
    );
    const totalNewItems = Object.values(results).reduce(
      (sum, r) => sum + r.newItems,
      0
    );
    const allSuccess = Object.values(results).every((r) => r.success);
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    return NextResponse.json({
      success: allSuccess,
      date,
      totalItems,
      newItemsWithNutrition: totalNewItems,
      durationSeconds,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scraper error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

