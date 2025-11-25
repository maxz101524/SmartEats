import { scrapeDiningMenu, getDiningHallInfo, type DiningHallSlug } from "./index";
import {
  getOrCreateDiningHall,
  getOrCreateMenuItem,
  getOrCreateDailyMenu,
  addMenuEntry,
} from "../db/queries";
import type { ScrapedDayMenu } from "../types";

/**
 * Scrape and persist menu data for a dining hall and date
 */
export async function scrapeAndPersistMenu(
  diningHallSlug: DiningHallSlug,
  date: string
): Promise<{ success: boolean; itemCount: number; error?: string }> {
  try {
    // Get dining hall info
    const hallInfo = getDiningHallInfo(diningHallSlug);
    if (!hallInfo) {
      return { success: false, itemCount: 0, error: `Unknown dining hall: ${diningHallSlug}` };
    }

    // Scrape menu data
    const menuData = await scrapeDiningMenu(diningHallSlug, date);
    if (!menuData || menuData.meals.length === 0) {
      return { success: true, itemCount: 0, error: "No menu data available" };
    }

    // Persist the data
    const itemCount = await persistMenuData(menuData, diningHallSlug);

    return { success: true, itemCount };
  } catch (error) {
    console.error(`Error scraping ${diningHallSlug}:`, error);
    return {
      success: false,
      itemCount: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Persist scraped menu data to the database
 */
async function persistMenuData(
  menuData: ScrapedDayMenu,
  slug: DiningHallSlug
): Promise<number> {
  const hallInfo = getDiningHallInfo(slug);
  
  // Get or create dining hall
  const diningHall = await getOrCreateDiningHall(hallInfo.name, slug);
  
  let totalItems = 0;

  for (const meal of menuData.meals) {
    // Get or create daily menu for this meal period
    const dailyMenu = await getOrCreateDailyMenu({
      diningHallId: diningHall.id,
      date: menuData.date,
      mealPeriod: meal.mealPeriod,
    });

    for (const item of meal.items) {
      // Get or create menu item
      const menuItem = await getOrCreateMenuItem({
        name: item.name,
        category: item.category || null,
        servingUnit: item.servingUnit || null,
      });

      // Add menu entry (junction)
      await addMenuEntry({
        dailyMenuId: dailyMenu.id,
        menuItemId: menuItem.id,
        course: item.course || null,
      });

      totalItems++;
    }
  }

  return totalItems;
}

/**
 * Scrape menus for multiple dates
 */
export async function scrapeMenuRange(
  diningHallSlug: DiningHallSlug,
  startDate: Date,
  days: number = 7
): Promise<{ date: string; success: boolean; itemCount: number }[]> {
  const results: { date: string; success: boolean; itemCount: number }[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const result = await scrapeAndPersistMenu(diningHallSlug, dateStr);
    results.push({
      date: dateStr,
      success: result.success,
      itemCount: result.itemCount,
    });

    // Small delay to be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

