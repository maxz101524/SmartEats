import { NextRequest, NextResponse } from "next/server";
import { fetchMenuFromApi, getAvailableDiningHalls, getDiningHallInfo, type DiningHallSlug } from "@/lib/scraper";
import { formatDateISO } from "@/lib/utils";

// Test endpoint to verify scraping works without database
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const date = searchParams.get("date") || formatDateISO(new Date());
  const hall = searchParams.get("hall") as DiningHallSlug | null;

  try {
    const results: Record<string, unknown> = {};
    
    if (hall) {
      const hallInfo = getDiningHallInfo(hall);
      if (!hallInfo) {
        return NextResponse.json({ error: `Unknown dining hall: ${hall}` }, { status: 400 });
      }
      
      const menu = await fetchMenuFromApi(hall, date);
      results[hall] = {
        success: !!menu,
        diningHall: hallInfo.name,
        itemCount: menu?.meals.reduce((sum, m) => sum + m.items.length, 0) || 0,
        meals: menu?.meals.map(m => ({
          mealPeriod: m.mealPeriod,
          itemCount: m.items.length,
          items: m.items.slice(0, 5), // Show first 5 items as sample
        })),
      };
    } else {
      // Test all dining halls
      const halls = getAvailableDiningHalls();
      
      for (const hallSlug of halls) {
        const hallInfo = getDiningHallInfo(hallSlug);
        try {
          const menu = await fetchMenuFromApi(hallSlug, date);
          results[hallSlug] = {
            success: !!menu,
            diningHall: hallInfo.name,
            itemCount: menu?.meals.reduce((sum, m) => sum + m.items.length, 0) || 0,
            meals: menu?.meals.map(m => ({
              mealPeriod: m.mealPeriod,
              itemCount: m.items.length,
              sampleItems: m.items.slice(0, 3).map(i => i.name),
            })),
          };
        } catch (error) {
          results[hallSlug] = {
            success: false,
            diningHall: hallInfo.name,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      }
    }

    const totalItems = Object.values(results).reduce(
      (sum, r) => sum + (typeof r === 'object' && r && 'itemCount' in r ? (r.itemCount as number) : 0),
      0
    );

    return NextResponse.json({
      success: true,
      date,
      totalItems,
      results,
      timestamp: new Date().toISOString(),
      note: "This is a test endpoint. Data is NOT persisted to database.",
    });
  } catch (error) {
    console.error("Scraper test error:", error);
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

