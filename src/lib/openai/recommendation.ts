import getOpenAIClient from "./client";
import type { RecommendationConstraints } from "../types";

const SYSTEM_PROMPT = `You extract nutrition constraints from a user's request.
If the user uses relative phrases like "high protein" or "low calorie" without numbers,
infer a reasonable numeric target based on a single meal (protein 25-60g, calories 400-800).
Return ONLY valid JSON with the exact keys specified. Use null when not specified.`;

const USER_PROMPT = `Extract constraints from this request:
"{prompt}"

Return JSON:
{
  "minProtein": number|null,
  "maxCalories": number|null,
  "minCalories": number|null,
  "maxCarbs": number|null,
  "maxFat": number|null,
  "dietaryFlags": string[],
  "excludeAllergens": string[],
  "avoidIngredients": string[],
  "preferIngredients": string[],
  "maxItems": number|null,
  "mealPeriod": string|null
}`;

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim().toLowerCase() : ""))
    .filter(Boolean);
}

export async function parseRecommendationPrompt(
  prompt: string
): Promise<RecommendationConstraints> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT.replace("{prompt}", prompt) },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 300,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  const parsed = JSON.parse(content) as Partial<RecommendationConstraints>;

  return {
    minProtein: normalizeNumber(parsed.minProtein),
    maxCalories: normalizeNumber(parsed.maxCalories),
    minCalories: normalizeNumber(parsed.minCalories),
    maxCarbs: normalizeNumber(parsed.maxCarbs),
    maxFat: normalizeNumber(parsed.maxFat),
    dietaryFlags: normalizeArray(parsed.dietaryFlags),
    excludeAllergens: normalizeArray(parsed.excludeAllergens),
    avoidIngredients: normalizeArray(parsed.avoidIngredients),
    preferIngredients: normalizeArray(parsed.preferIngredients),
    maxItems: normalizeNumber(parsed.maxItems),
    mealPeriod:
      typeof parsed.mealPeriod === "string" ? parsed.mealPeriod.toLowerCase() : null,
  };
}
