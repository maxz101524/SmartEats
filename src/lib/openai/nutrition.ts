import getOpenAIClient from "./client";
import type { NutritionEstimate, NutritionBatchResponse } from "../types";

const NUTRITION_SYSTEM_PROMPT = `You are a nutritional information expert. Given a dish name from a university dining hall, provide accurate nutritional estimates.

Important guidelines:
1. Base estimates on typical university dining hall portion sizes (usually generous)
2. Consider common preparation methods in institutional food service
3. If the dish name is ambiguous, assume the most common version
4. Provide conservative estimates when uncertain
5. Include common allergens based on typical ingredients

Return ONLY valid JSON in the exact format specified. Do not include any text outside the JSON object.`;

const SINGLE_ITEM_PROMPT = `Estimate nutritional information for this dining hall dish: "{dishName}"

Category/context: {category}

Return a JSON object with this exact structure:
{
  "calories": <number>,
  "protein": <grams as number>,
  "carbs": <grams as number>,
  "fat": <grams as number>,
  "fiber": <grams as number>,
  "sugar": <grams as number>,
  "sodium": <mg as number>,
  "servingSize": "<description like '1 cup' or '1 serving (6 oz)'>",
  "vitamins": {
    "vitamin_a": <daily value % as number or null>,
    "vitamin_c": <daily value % as number or null>,
    "vitamin_d": <daily value % as number or null>
  },
  "minerals": {
    "calcium": <daily value % as number or null>,
    "iron": <daily value % as number or null>,
    "potassium": <daily value % as number or null>
  },
  "allergens": [<array of strings like "gluten", "dairy", "eggs", "soy", "nuts", "shellfish", "fish">],
  "dietaryFlags": [<array of strings like "vegetarian", "vegan", "halal", "gluten-free">],
  "confidence": "<'high', 'medium', or 'low'>"
}`;

const BATCH_PROMPT = `Estimate nutritional information for these dining hall dishes:

{dishes}

Return a JSON object with this exact structure:
{
  "items": [
    {
      "name": "<exact dish name>",
      "nutrition": {
        "calories": <number>,
        "protein": <grams>,
        "carbs": <grams>,
        "fat": <grams>,
        "fiber": <grams>,
        "sugar": <grams>,
        "sodium": <mg>,
        "servingSize": "<description>",
        "vitamins": { "vitamin_a": <% or null>, "vitamin_c": <% or null>, "vitamin_d": <% or null> },
        "minerals": { "calcium": <% or null>, "iron": <% or null>, "potassium": <% or null> },
        "allergens": [<strings>],
        "dietaryFlags": [<strings>],
        "confidence": "<high/medium/low>"
      }
    }
  ]
}`;

/**
 * Generate nutritional estimate for a single dish
 */
export async function generateNutritionForDish(
  dishName: string,
  category?: string
): Promise<NutritionEstimate> {
  const prompt = SINGLE_ITEM_PROMPT
    .replace("{dishName}", dishName)
    .replace("{category}", category || "General");

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: NUTRITION_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent results
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content) as NutritionEstimate;
    return validateAndNormalizeNutrition(parsed);
  } catch (error) {
    console.error(`Error generating nutrition for "${dishName}":`, error);
    throw error;
  }
}

/**
 * Generate nutritional estimates for multiple dishes in batch (more cost-effective)
 */
export async function generateNutritionBatch(
  dishes: { name: string; category?: string }[]
): Promise<NutritionBatchResponse> {
  if (dishes.length === 0) {
    return { items: [] };
  }

  // Batch up to 10 items at a time
  const MAX_BATCH_SIZE = 10;
  
  if (dishes.length > MAX_BATCH_SIZE) {
    // Process in chunks
    const results: NutritionBatchResponse["items"] = [];
    
    for (let i = 0; i < dishes.length; i += MAX_BATCH_SIZE) {
      const chunk = dishes.slice(i, i + MAX_BATCH_SIZE);
      const chunkResult = await generateNutritionBatch(chunk);
      results.push(...chunkResult.items);
    }
    
    return { items: results };
  }

  const dishList = dishes
    .map((d, i) => `${i + 1}. ${d.name}${d.category ? ` (${d.category})` : ""}`)
    .join("\n");

  const prompt = BATCH_PROMPT.replace("{dishes}", dishList);

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: NUTRITION_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content) as NutritionBatchResponse;
    
    // Validate and normalize each item
    return {
      items: parsed.items.map((item) => ({
        name: item.name,
        nutrition: validateAndNormalizeNutrition(item.nutrition),
      })),
    };
  } catch (error) {
    console.error("Error generating batch nutrition:", error);
    throw error;
  }
}

/**
 * Validate and normalize nutrition data
 */
function validateAndNormalizeNutrition(data: NutritionEstimate): NutritionEstimate {
  // Ensure reasonable ranges
  return {
    calories: clamp(data.calories || 0, 0, 3000),
    protein: clamp(data.protein || 0, 0, 200),
    carbs: clamp(data.carbs || 0, 0, 500),
    fat: clamp(data.fat || 0, 0, 200),
    fiber: clamp(data.fiber || 0, 0, 100),
    sugar: clamp(data.sugar || 0, 0, 200),
    sodium: clamp(data.sodium || 0, 0, 5000),
    servingSize: data.servingSize || "1 serving",
    vitamins: {
      vitamin_a: data.vitamins?.vitamin_a ?? undefined,
      vitamin_c: data.vitamins?.vitamin_c ?? undefined,
      vitamin_d: data.vitamins?.vitamin_d ?? undefined,
      vitamin_b12: data.vitamins?.vitamin_b12 ?? undefined,
      vitamin_e: data.vitamins?.vitamin_e ?? undefined,
    },
    minerals: {
      calcium: data.minerals?.calcium ?? undefined,
      iron: data.minerals?.iron ?? undefined,
      potassium: data.minerals?.potassium ?? undefined,
      zinc: data.minerals?.zinc ?? undefined,
      magnesium: data.minerals?.magnesium ?? undefined,
    },
    allergens: Array.isArray(data.allergens) ? data.allergens : [],
    dietaryFlags: Array.isArray(data.dietaryFlags) ? data.dietaryFlags : [],
    confidence: data.confidence || "medium",
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

