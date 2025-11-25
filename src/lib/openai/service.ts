import { generateNutritionForDish, generateNutritionBatch } from "./nutrition";
import {
  getMenuItemsWithoutNutrition,
  getNutritionForMenuItem,
  upsertNutritionInfo,
} from "../db/queries";
import { db, menuItems, nutritionInfo } from "../db";
import { eq, isNull } from "drizzle-orm";

/**
 * Generate and store nutrition info for a single menu item by ID
 */
export async function generateNutritionForItem(
  menuItemId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if nutrition already exists
    const existing = await getNutritionForMenuItem(menuItemId);
    if (existing) {
      return { success: true }; // Already has nutrition data
    }

    // Get menu item details
    const items = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, menuItemId))
      .limit(1);

    const item = items[0];
    if (!item) {
      return { success: false, error: "Menu item not found" };
    }

    // Generate nutrition estimate
    const nutrition = await generateNutritionForDish(
      item.name,
      item.category || undefined
    );

    // Store in database
    await upsertNutritionInfo({
      menuItemId: item.id,
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

    return { success: true };
  } catch (error) {
    console.error(`Error generating nutrition for item ${menuItemId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate nutrition for all items that don't have it yet
 */
export async function generateMissingNutrition(): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    // Get items without nutrition data using a proper join query
    const itemsWithoutNutrition = await db
      .select({
        id: menuItems.id,
        name: menuItems.name,
        category: menuItems.category,
      })
      .from(menuItems)
      .leftJoin(nutritionInfo, eq(menuItems.id, nutritionInfo.menuItemId))
      .where(isNull(nutritionInfo.id));

    if (itemsWithoutNutrition.length === 0) {
      return results;
    }

    console.log(`Found ${itemsWithoutNutrition.length} items without nutrition data`);

    // Process in batches of 10
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < itemsWithoutNutrition.length; i += BATCH_SIZE) {
      const batch = itemsWithoutNutrition.slice(i, i + BATCH_SIZE);
      
      try {
        // Generate nutrition for batch
        const batchItems = batch.map((item) => ({
          name: item.name,
          category: item.category || undefined,
        }));

        const nutritionResults = await generateNutritionBatch(batchItems);

        // Store results
        for (let j = 0; j < batch.length; j++) {
          const item = batch[j];
          const nutritionResult = nutritionResults.items.find(
            (n) => n.name.toLowerCase() === item.name.toLowerCase()
          ) || nutritionResults.items[j];

          if (nutritionResult) {
            try {
              await upsertNutritionInfo({
                menuItemId: item.id,
                calories: nutritionResult.nutrition.calories,
                protein: String(nutritionResult.nutrition.protein),
                carbs: String(nutritionResult.nutrition.carbs),
                fat: String(nutritionResult.nutrition.fat),
                fiber: String(nutritionResult.nutrition.fiber),
                sugar: String(nutritionResult.nutrition.sugar),
                sodium: nutritionResult.nutrition.sodium,
                servingSize: nutritionResult.nutrition.servingSize,
                vitamins: nutritionResult.nutrition.vitamins as Record<string, number>,
                minerals: nutritionResult.nutrition.minerals as Record<string, number>,
                allergens: nutritionResult.nutrition.allergens,
                dietaryFlags: nutritionResult.nutrition.dietaryFlags,
                llmGeneratedAt: new Date(),
              });
              results.successful++;
            } catch (dbError) {
              results.failed++;
              results.errors.push(`DB error for "${item.name}": ${dbError}`);
            }
          } else {
            results.failed++;
            results.errors.push(`No nutrition result for "${item.name}"`);
          }
          results.processed++;
        }
      } catch (batchError) {
        // If batch fails, try items individually
        console.error("Batch failed, trying individually:", batchError);
        
        for (const item of batch) {
          results.processed++;
          const result = await generateNutritionForItem(item.id);
          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
            if (result.error) {
              results.errors.push(`"${item.name}": ${result.error}`);
            }
          }
        }
      }

      // Rate limiting - small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error("Error in generateMissingNutrition:", error);
    results.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return results;
}

