import { db } from "./index";
import { eq, and, desc, gte } from "drizzle-orm";
import {
  diningHalls,
  menuItems,
  dailyMenus,
  menuEntries,
  nutritionInfo,
  userProfiles,
  mealLogs,
  mealLogItems,
  type NewMenuItem,
  type NewDailyMenu,
  type NewMenuEntry,
  type NewNutritionInfo,
  type NewUserProfile,
  type NewMealLog,
  type NewMealLogItem,
} from "./schema";

// Dining Halls
export async function getDiningHalls() {
  return db.select().from(diningHalls);
}

export async function getDiningHallBySlug(slug: string) {
  const results = await db
    .select()
    .from(diningHalls)
    .where(eq(diningHalls.slug, slug))
    .limit(1);
  return results[0] || null;
}

export async function getOrCreateDiningHall(name: string, slug: string) {
  const existing = await getDiningHallBySlug(slug);
  if (existing) return existing;

  const result = await db
    .insert(diningHalls)
    .values({ name, slug })
    .returning();
  return result[0];
}

// Menu Items
export async function getMenuItemByName(name: string) {
  const results = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.name, name))
    .limit(1);
  return results[0] || null;
}

export async function getOrCreateMenuItem(item: NewMenuItem) {
  const existing = await getMenuItemByName(item.name);
  if (existing) return existing;

  const result = await db.insert(menuItems).values(item).returning();
  return result[0];
}

export async function getMenuItemsWithoutNutrition() {
  const results = await db
    .select({
      id: menuItems.id,
      name: menuItems.name,
      category: menuItems.category,
    })
    .from(menuItems)
    .leftJoin(nutritionInfo, eq(menuItems.id, nutritionInfo.menuItemId))
    .where(eq(nutritionInfo.id, null as unknown as number));
  return results;
}

// Daily Menus
export async function getDailyMenu(
  diningHallId: number,
  date: string,
  mealPeriod: string
) {
  const results = await db
    .select()
    .from(dailyMenus)
    .where(
      and(
        eq(dailyMenus.diningHallId, diningHallId),
        eq(dailyMenus.date, date),
        eq(dailyMenus.mealPeriod, mealPeriod)
      )
    )
    .limit(1);
  return results[0] || null;
}

export async function createDailyMenu(menu: NewDailyMenu) {
  const result = await db.insert(dailyMenus).values(menu).returning();
  return result[0];
}

export async function getOrCreateDailyMenu(menu: NewDailyMenu) {
  const existing = await getDailyMenu(
    menu.diningHallId,
    menu.date,
    menu.mealPeriod
  );
  if (existing) return existing;
  return createDailyMenu(menu);
}

// Menu Entries
export async function addMenuEntry(entry: NewMenuEntry) {
  try {
    await db.insert(menuEntries).values(entry).onConflictDoNothing();
  } catch {
    // Entry already exists, ignore
  }
}

// Nutrition Info
export async function getNutritionForMenuItem(menuItemId: number) {
  const results = await db
    .select()
    .from(nutritionInfo)
    .where(eq(nutritionInfo.menuItemId, menuItemId))
    .limit(1);
  return results[0] || null;
}

export async function upsertNutritionInfo(info: NewNutritionInfo) {
  const result = await db
    .insert(nutritionInfo)
    .values(info)
    .onConflictDoUpdate({
      target: nutritionInfo.menuItemId,
      set: {
        calories: info.calories,
        protein: info.protein,
        carbs: info.carbs,
        fat: info.fat,
        fiber: info.fiber,
        sugar: info.sugar,
        sodium: info.sodium,
        servingSize: info.servingSize,
        vitamins: info.vitamins,
        minerals: info.minerals,
        allergens: info.allergens,
        dietaryFlags: info.dietaryFlags,
        llmGeneratedAt: info.llmGeneratedAt,
        updatedAt: new Date(),
      },
    })
    .returning();
  return result[0];
}

// Combined Queries
export async function getMenuWithNutrition(
  diningHallSlug: string,
  date: string
) {
  const diningHall = await getDiningHallBySlug(diningHallSlug);
  if (!diningHall) return null;

  const menus = await db
    .select({
      menuId: dailyMenus.id,
      mealPeriod: dailyMenus.mealPeriod,
      itemId: menuItems.id,
      itemName: menuItems.name,
      itemCategory: menuItems.category,
      course: menuEntries.course,
      calories: nutritionInfo.calories,
      protein: nutritionInfo.protein,
      carbs: nutritionInfo.carbs,
      fat: nutritionInfo.fat,
      fiber: nutritionInfo.fiber,
      sugar: nutritionInfo.sugar,
      sodium: nutritionInfo.sodium,
      servingSize: nutritionInfo.servingSize,
      vitamins: nutritionInfo.vitamins,
      minerals: nutritionInfo.minerals,
      allergens: nutritionInfo.allergens,
      dietaryFlags: nutritionInfo.dietaryFlags,
    })
    .from(dailyMenus)
    .innerJoin(menuEntries, eq(dailyMenus.id, menuEntries.dailyMenuId))
    .innerJoin(menuItems, eq(menuEntries.menuItemId, menuItems.id))
    .leftJoin(nutritionInfo, eq(menuItems.id, nutritionInfo.menuItemId))
    .where(
      and(
        eq(dailyMenus.diningHallId, diningHall.id),
        eq(dailyMenus.date, date)
      )
    )
    .orderBy(dailyMenus.mealPeriod, menuItems.name);

  // Group by meal period
  const grouped: Record<string, typeof menus> = {};
  for (const item of menus) {
    if (!grouped[item.mealPeriod]) {
      grouped[item.mealPeriod] = [];
    }
    grouped[item.mealPeriod].push(item);
  }

  return {
    diningHall,
    date,
    meals: grouped,
  };
}

export async function getAvailableDates(diningHallSlug: string, limit = 14) {
  const diningHall = await getDiningHallBySlug(diningHallSlug);
  if (!diningHall) return [];

  const results = await db
    .selectDistinct({ date: dailyMenus.date })
    .from(dailyMenus)
    .where(eq(dailyMenus.diningHallId, diningHall.id))
    .orderBy(desc(dailyMenus.date))
    .limit(limit);

  return results.map((r) => r.date);
}

// User Profile
export async function getUserProfile(userId: string) {
  const results = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return results[0] || null;
}

export async function upsertUserProfile(userId: string, profile: NewUserProfile) {
  const payload = {
    ...profile,
    userId,
    updatedAt: new Date(),
  };

  const result = await db
    .insert(userProfiles)
    .values(payload)
    .onConflictDoUpdate({
      target: userProfiles.userId,
      set: payload,
    })
    .returning();

  return result[0];
}

// Meal History
export async function createMealLog(
  log: NewMealLog,
  items: Omit<NewMealLogItem, "mealLogId">[]
) {
  const result = await db.insert(mealLogs).values(log).returning();
  const created = result[0];

  if (items.length > 0) {
    const withLogId = items.map((item) => ({
      ...item,
      mealLogId: created.id,
    }));
    await db.insert(mealLogItems).values(withLogId);
  }

  return created;
}

export async function getRecentMealItems(userId: string, days = 14) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const results = await db
    .select({
      menuItemId: mealLogItems.menuItemId,
      itemName: mealLogItems.itemName,
      quantity: mealLogItems.quantity,
    })
    .from(mealLogItems)
    .innerJoin(mealLogs, eq(mealLogItems.mealLogId, mealLogs.id))
    .where(and(eq(mealLogs.userId, userId), gte(mealLogs.createdAt, cutoff)));

  return results;
}
