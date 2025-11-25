import { NextRequest, NextResponse } from "next/server";
import { db, diningHalls, dailyMenus, menuEntries, menuItems } from "@/lib/db";
import { and, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // 1. Create a dining hall if not exists
    const hallResult = await db
      .insert(diningHalls)
      .values({
        name: "Ikenberry Dining Hall",
        slug: "ikenberry",
      })
      .onConflictDoNothing()
      .returning();
    
    // Get the ID
    const halls = await db.select().from(diningHalls).where(eq(diningHalls.slug, "ikenberry"));
    const hallId = halls[0].id;

    // 2. Create menus for Lunch and Dinner
    const today = new Date().toISOString().split("T")[0];
    
    // Lunch Menu
    await db
      .insert(dailyMenus)
      .values({
        diningHallId: hallId,
        date: today,
        mealPeriod: "lunch",
      })
      .onConflictDoNothing();

    // Dinner Menu
    await db
      .insert(dailyMenus)
      .values({
        diningHallId: hallId,
        date: today,
        mealPeriod: "dinner",
      })
      .onConflictDoNothing();

    // Get menu IDs
    const menus = await db.select().from(dailyMenus).where(
      and(
        eq(dailyMenus.diningHallId, hallId),
        eq(dailyMenus.date, today)
      )
    );
    
    const lunchMenu = menus.find(m => m.mealPeriod === "lunch");
    const dinnerMenu = menus.find(m => m.mealPeriod === "dinner");

    if (!lunchMenu || !dinnerMenu) throw new Error("Failed to create/find daily menus");

    // 3. Insert items
    const sampleItems = [
      { name: "Grilled Chicken Breast", category: "Entree", course: "Entrees", menuId: lunchMenu.id },
      { name: "Roasted Potatoes", category: "Side", course: "Sides", menuId: lunchMenu.id },
      { name: "Steamed Broccoli", category: "Vegetable", course: "Vegetables", menuId: lunchMenu.id },
      { name: "Vegetable Lasagna", category: "Entree", course: "Entrees", menuId: dinnerMenu.id },
      { name: "Garlic Bread", category: "Side", course: "Sides", menuId: dinnerMenu.id },
      { name: "Chocolate Chip Cookie", category: "Dessert", course: "Desserts", menuId: dinnerMenu.id },
      { name: "Caesar Salad", category: "Salad", course: "Salad Bar", menuId: lunchMenu.id },
    ];

    let count = 0;
    
    for (const item of sampleItems) {
        // Insert item or get existing
        let itemId;
        const itemResult = await db
            .insert(menuItems)
            .values({
                name: item.name,
                category: item.category,
            })
            .onConflictDoNothing()
            .returning();
        
        if (itemResult.length > 0) {
            itemId = itemResult[0].id;
        } else {
            const existing = await db.select().from(menuItems).where(eq(menuItems.name, item.name));
            itemId = existing[0]?.id;
        }

        if (itemId) {
            // Link to menu
            await db.insert(menuEntries).values({
                dailyMenuId: item.menuId,
                menuItemId: itemId,
                course: item.course,
            }).onConflictDoNothing();
            count++;
        }
    }

    return NextResponse.json({
      success: true,
      message: `Manually seeded ${count} items for ${today}`,
    });
  } catch (error) {
    console.error("Manual seed error:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
