import { scrapeDiningMenu, getDiningHallInfo, type DiningHallSlug } from "./index";
import {
  getOrCreateDiningHall,
  getOrCreateDailyMenu,
  addMenuEntry,
  getMenuItemByName,
  getNutritionForMenuItem,
  upsertNutritionInfo,
} from "../db/queries";
import { db, menuItems } from "../db";
import { generateNutritionForDish } from "../openai/nutrition";
import type { ScrapedDayMenu } from "../types";

/**
 * Scrape and persist menu data for a dining hall and date
 * Now includes automatic nutrition generation for new items
 */
export async function scrapeAndPersistMenu(
  diningHallSlug: DiningHallSlug,
  date: string
): Promise<{ success: boolean; itemCount: number; newItems: number; error?: string }> {
  try {
    // Get dining hall info
    const hallInfo = getDiningHallInfo(diningHallSlug);
    if (!hallInfo) {
      return { success: false, itemCount: 0, newItems: 0, error: `Unknown dining hall: ${diningHallSlug}` };
    }

    // Scrape menu data
    const menuData = await scrapeDiningMenu(diningHallSlug, date);
    if (!menuData || menuData.meals.length === 0) {
      return { success: true, itemCount: 0, newItems: 0, error: "No menu data available" };
    }

    // Persist the data (includes nutrition generation for new items)
    const { totalItems, newItems } = await persistMenuData(menuData, diningHallSlug);

    return { success: true, itemCount: totalItems, newItems };
  } catch (error) {
    console.error(`Error scraping ${diningHallSlug}:`, error);
    return {
      success: false,
      itemCount: 0,
      newItems: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get or create a menu item, generating nutrition if it's new
 */
async function getOrCreateMenuItemWithNutrition(
  name: string,
  category: string | null,
  servingUnit: string | null
): Promise<{ id: number; isNew: boolean }> {
  // Check if item already exists
  const existing = await getMenuItemByName(name);
  
  if (existing) {
    // Item exists - check if it has nutrition
    const hasNutrition = await getNutritionForMenuItem(existing.id);
    if (!hasNutrition) {
      // Existing item without nutrition - generate it
      await generateAndStoreNutrition(existing.id, name, category);
    }
    return { id: existing.id, isNew: false };
  }

  // Create new menu item
  const result = await db
    .insert(menuItems)
    .values({ name, category, servingUnit })
    .returning();
  const newItem = result[0];

  // Generate nutrition for the new item
  await generateAndStoreNutrition(newItem.id, name, category);

  return { id: newItem.id, isNew: true };
}

/**
 * Generate nutrition using LLM and store in database
 */
async function generateAndStoreNutrition(
  menuItemId: number,
  name: string,
  category: string | null
): Promise<void> {
  try {
    console.log(`Generating nutrition for: ${name}`);
    const nutrition = await generateNutritionForDish(name, category || undefined);

    await upsertNutritionInfo({
      menuItemId,
      calories: nutrition.calories,
      protein: String(nutrition.protein),
      carbs: String(nutrition.carbs),
      fat: String(nutrition.fat),
      fiber: String(nutrition.fiber),
      sugar: String(nutrition.sugar),
      sodium: nutrition.sodium,
      servingSize: nutrition.servingSize,
      vitamins: nutrition.vitamins as Record<string, number>,
      minerals: nutrition.minerals as Record<string, number>,
      allergens: nutrition.allergens,
      dietaryFlags: nutrition.dietaryFlags,
      llmGeneratedAt: new Date(),
    });
    console.log(`✓ Nutrition generated for: ${name}`);
  } catch (error) {
    console.error(`Failed to generate nutrition for "${name}":`, error);
    // Don't throw - we still want to save the menu item even if nutrition fails
  }
}

/**
 * Persist scraped menu data to the database
 */
async function persistMenuData(
  menuData: ScrapedDayMenu,
  slug: DiningHallSlug
): Promise<{ totalItems: number; newItems: number }> {
  const hallInfo = getDiningHallInfo(slug);
  
  // Get or create dining hall
  const diningHall = await getOrCreateDiningHall(hallInfo.name, slug);
  
  let totalItems = 0;
  let newItems = 0;

  for (const meal of menuData.meals) {
    // Get or create daily menu for this meal period
    const dailyMenu = await getOrCreateDailyMenu({
      diningHallId: diningHall.id,
      date: menuData.date,
      mealPeriod: meal.mealPeriod,
    });

    for (const item of meal.items) {
      // Get or create menu item WITH nutrition generation for new items
      const menuItem = await getOrCreateMenuItemWithNutrition(
        item.name,
        item.category || null,
        item.servingUnit || null
      );

      // Add menu entry (junction)
      await addMenuEntry({
        dailyMenuId: dailyMenu.id,
        menuItemId: menuItem.id,
        course: item.course || null,
      });

      totalItems++;
      if (menuItem.isNew) newItems++;
    }
  }

  return { totalItems, newItems };
}

/**
 * Scrape menus for multiple dates
 */
export async function scrapeMenuRange(
  diningHallSlug: DiningHallSlug,
  startDate: Date,
  days: number = 7
): Promise<{ date: string; success: boolean; itemCount: number; newItems: number }[]> {
  const results: { date: string; success: boolean; itemCount: number; newItems: number }[] = [];

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    const result = await scrapeAndPersistMenu(diningHallSlug, dateStr);
    results.push({
      date: dateStr,
      success: result.success,
      itemCount: result.itemCount,
      newItems: result.newItems,
    });

    // Small delay to be nice to the API
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return results;
}

