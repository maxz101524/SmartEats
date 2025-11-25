import {
  fetchMenuFromApi,
  getAvailableDiningHalls,
  getDiningHallInfo,
} from "./api-client";
import { type DiningHallSlug } from "./config";
import type { ScrapedDayMenu } from "../types";

// Re-export API client functions
export {
  fetchMenuFromApi,
  getAvailableDiningHalls,
  getDiningHallInfo,
} from "./api-client";
export { DINING_HALLS, type DiningHallSlug } from "./config";

/**
 * Primary scraping function - uses UIUC Dining API
 */
export async function scrapeDiningMenu(
  diningHallSlug: DiningHallSlug,
  date: string
): Promise<ScrapedDayMenu | null> {
  return fetchMenuFromApi(diningHallSlug, date);
}

/**
 * Scrape menus for all dining halls for a given date
 */
export async function scrapeAllDiningHalls(
  date: string
): Promise<ScrapedDayMenu[]> {
  const results: ScrapedDayMenu[] = [];
  const slugs = getAvailableDiningHalls();

  for (const slug of slugs) {
    try {
      const menu = await scrapeDiningMenu(slug, date);
      if (menu) {
        results.push(menu);
      }
    } catch (error) {
      console.error(`Error scraping ${slug}:`, error);
    }
  }

  return results;
}
