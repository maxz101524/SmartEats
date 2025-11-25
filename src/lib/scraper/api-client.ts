import {
  DINING_API_BASE,
  DINING_HALLS,
  type DiningHallSlug,
  type DiningMenuApiItem,
  type DiningScheduleItem,
} from "./config";
import type { ScrapedDayMenu, ScrapedMealPeriod, ScrapedMenuItem } from "../types";

/**
 * Fetch menu data from UIUC Dining API
 */
export async function fetchMenuFromApi(
  diningHallSlug: DiningHallSlug,
  date: string
): Promise<ScrapedDayMenu | null> {
  const diningHall = DINING_HALLS[diningHallSlug];
  if (!diningHall) {
    throw new Error(`Unknown dining hall: ${diningHallSlug}`);
  }

  try {
    // Fetch menu items using the dining hall's option ID
    const menuItems = await fetchDiningOption(diningHall.optionId, date);

    if (menuItems.length === 0) {
      console.log(`No menu items found for ${diningHall.name} on ${date}`);
      return null;
    }

    // Group items by meal period
    const mealGroups = groupByMealPeriod(menuItems);

    const meals: ScrapedMealPeriod[] = Object.entries(mealGroups).map(
      ([mealPeriod, items]) => ({
        mealPeriod: mealPeriod.toLowerCase(),
        items: items.map(transformMenuItem),
      })
    );

    return {
      date,
      diningHall: diningHall.name,
      meals,
    };
  } catch (error) {
    console.error(`Error fetching menu for ${diningHall.name}:`, error);
    throw error;
  }
}

/**
 * Fetch dining option data from the API
 * Uses JSON body with DiningOptionID and mealDate parameters
 */
async function fetchDiningOption(
  optionId: number,
  date: string
): Promise<DiningMenuApiItem[]> {
  const url = `${DINING_API_BASE}/GetOption/`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      DiningOptionID: optionId.toString(),
      mealDate: date,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  // The API returns an array of menu items directly
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Fetch available schedule for a dining option
 */
export async function fetchSchedule(
  optionId: number,
  date: string
): Promise<DiningScheduleItem[]> {
  const url = `${DINING_API_BASE}/GetOption/`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      DiningOptionID: optionId.toString(),
      mealDate: date,
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.Schedule || [];
}

/**
 * Group menu items by meal period
 */
function groupByMealPeriod(
  items: DiningMenuApiItem[]
): Record<string, DiningMenuApiItem[]> {
  const groups: Record<string, DiningMenuApiItem[]> = {};

  for (const item of items) {
    const meal = item.Meal || "Other";
    if (!groups[meal]) {
      groups[meal] = [];
    }
    groups[meal].push(item);
  }

  return groups;
}

/**
 * Transform API item to our internal format
 */
function transformMenuItem(item: DiningMenuApiItem): ScrapedMenuItem {
  const traits = item.Traits
    ? item.Traits.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    name: item.FormalName,
    category: item.Category || undefined,
    course: item.Course || undefined,
    servingUnit: item.ServingUnit || undefined,
    traits,
  };
}

/**
 * Get all available dining hall slugs
 */
export function getAvailableDiningHalls(): DiningHallSlug[] {
  return Object.keys(DINING_HALLS) as DiningHallSlug[];
}

/**
 * Get dining hall info by slug
 */
export function getDiningHallInfo(slug: DiningHallSlug) {
  return DINING_HALLS[slug];
}

