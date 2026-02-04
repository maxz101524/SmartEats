import type {
  MenuItemWithNutrition,
  RecommendationConstraints,
  RecommendationResult,
  RecommendationItem,
} from "@/lib/types";

const HARD_MAX_ITEMS = 6;
const CANDIDATE_LIMIT = 18;

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeConstraints(
  constraints: RecommendationConstraints
): RecommendationConstraints {
  const maxItems = Math.max(
    1,
    Math.min(constraints.maxItems ?? 4, HARD_MAX_ITEMS)
  );

  return {
    ...constraints,
    maxItems,
    dietaryFlags: constraints.dietaryFlags || [],
    excludeAllergens: constraints.excludeAllergens || [],
    avoidIngredients: constraints.avoidIngredients || [],
    preferIngredients: constraints.preferIngredients || [],
  };
}

function matchesDietaryFlags(
  item: MenuItemWithNutrition,
  flags: string[]
): boolean {
  if (flags.length === 0) return true;
  const itemFlags = item.nutrition?.dietaryFlags?.map((f) => f.toLowerCase()) || [];
  return flags.every((flag) => itemFlags.includes(flag.toLowerCase()));
}

function hasExcludedAllergen(
  item: MenuItemWithNutrition,
  allergens: string[]
): boolean {
  if (allergens.length === 0) return false;
  const itemAllergens = item.nutrition?.allergens?.map((a) => a.toLowerCase()) || [];
  return allergens.some((allergen) => itemAllergens.includes(allergen.toLowerCase()));
}

function matchesIngredientPreference(
  item: MenuItemWithNutrition,
  avoid: string[],
  prefer: string[]
): { avoidHit: boolean; preferHit: boolean } {
  const name = item.name.toLowerCase();
  const avoidHit = avoid.some((term) => name.includes(term.toLowerCase()));
  const preferHit = prefer.some((term) => name.includes(term.toLowerCase()));
  return { avoidHit, preferHit };
}

function buildCandidates(
  items: MenuItemWithNutrition[],
  constraints: RecommendationConstraints
) {
  return items
    .filter((item) => item.nutrition && item.nutrition.calories !== null)
    .filter((item) => matchesDietaryFlags(item, constraints.dietaryFlags))
    .filter((item) => !hasExcludedAllergen(item, constraints.excludeAllergens))
    .filter((item) => {
      const { avoidHit } = matchesIngredientPreference(
        item,
        constraints.avoidIngredients,
        []
      );
      return !avoidHit;
    })
    .map((item) => {
      const calories = item.nutrition?.calories ?? 0;
      const protein = toNumber(item.nutrition?.protein) ?? 0;
      const carbs = toNumber(item.nutrition?.carbs) ?? 0;
      const fat = toNumber(item.nutrition?.fat) ?? 0;
      const density = calories > 0 ? protein / calories : 0;
      return {
        item,
        calories,
        protein,
        carbs,
        fat,
        density,
      };
    })
    .sort((a, b) => b.density - a.density || b.protein - a.protein)
    .slice(0, CANDIDATE_LIMIT);
}

function scoreCombo(
  combo: RecommendationItem[],
  constraints: RecommendationConstraints,
  targets: { calories: number; protein: number; carbs: number; fat: number } | null,
  recentItemIds: Set<number>
) {
  const totals = combo.reduce(
    (acc, item) => {
      const nutrition = item.nutrition;
      return {
        calories: acc.calories + (nutrition?.calories ?? 0) * item.quantity,
        protein:
          acc.protein + (toNumber(nutrition?.protein) ?? 0) * item.quantity,
        carbs: acc.carbs + (toNumber(nutrition?.carbs) ?? 0) * item.quantity,
        fat: acc.fat + (toNumber(nutrition?.fat) ?? 0) * item.quantity,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  let penalty = 0;
  if (constraints.maxCalories !== null && totals.calories > constraints.maxCalories) {
    penalty += (totals.calories - constraints.maxCalories) * 2;
  }
  if (constraints.minCalories !== null && totals.calories < constraints.minCalories) {
    penalty += (constraints.minCalories - totals.calories) * 1.5;
  }
  if (constraints.minProtein !== null && totals.protein < constraints.minProtein) {
    penalty += (constraints.minProtein - totals.protein) * 4;
  }
  if (constraints.maxCarbs !== null && totals.carbs > constraints.maxCarbs) {
    penalty += (totals.carbs - constraints.maxCarbs) * 1.2;
  }
  if (constraints.maxFat !== null && totals.fat > constraints.maxFat) {
    penalty += (totals.fat - constraints.maxFat) * 1.2;
  }

  let preferenceBoost = 0;
  const preferTerms = constraints.preferIngredients || [];
  for (const item of combo) {
    if (recentItemIds.has(item.id)) preferenceBoost -= 20;
    if (preferTerms.length > 0) {
      const name = item.name.toLowerCase();
      if (preferTerms.some((term) => name.includes(term.toLowerCase()))) {
        preferenceBoost += 8;
      }
    }
  }

  let targetBoost = 0;
  if (targets) {
    targetBoost -= Math.abs(totals.calories - targets.calories) * 0.1;
    targetBoost -= Math.abs(totals.protein - targets.protein) * 0.2;
  }

  const baseScore = totals.protein * 2 - totals.calories * 0.05;
  return {
    totals,
    score: baseScore + targetBoost + preferenceBoost - penalty,
  };
}

function buildTargets(
  dailyGoals: { calories?: number | null; protein?: number | null; carbs?: number | null; fat?: number | null } | null
) {
  if (!dailyGoals) return null;
  const calories = dailyGoals.calories ?? null;
  const protein = dailyGoals.protein ?? null;
  const carbs = dailyGoals.carbs ?? null;
  const fat = dailyGoals.fat ?? null;
  if (calories === null && protein === null && carbs === null && fat === null) {
    return null;
  }
  return {
    calories: (calories ?? 0) / 3,
    protein: (protein ?? 0) / 3,
    carbs: (carbs ?? 0) / 3,
    fat: (fat ?? 0) / 3,
  };
}

export function recommendFromMenu(
  items: MenuItemWithNutrition[],
  rawConstraints: RecommendationConstraints,
  dailyGoals: { calories?: number | null; protein?: number | null; carbs?: number | null; fat?: number | null } | null,
  recentItemIds: Set<number>
): RecommendationResult {
  const constraints = normalizeConstraints(rawConstraints);
  const candidates = buildCandidates(items, constraints);
  const warnings: string[] = [];

  if (candidates.length === 0) {
    return {
      items: [],
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      constraints,
      explanation: "No matching items found for the given filters.",
      warnings: ["No menu items with nutrition data matched the constraints."],
    };
  }

  const maxItems = constraints.maxItems ?? 4;
  const targets = buildTargets(dailyGoals);

  let bestCombo: RecommendationItem[] = [];
  let bestScore = -Infinity;
  let bestTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const combos: RecommendationItem[][] = [];

  function buildCombos(startIndex: number, current: RecommendationItem[]) {
    if (current.length > 0) {
      combos.push([...current]);
    }
    if (current.length === maxItems) return;
    for (let i = startIndex; i < candidates.length; i++) {
      const candidate = candidates[i].item;
      buildCombos(i + 1, [
        ...current,
        {
          id: candidate.id,
          name: candidate.name,
          quantity: 1,
          nutrition: candidate.nutrition,
          score: candidates[i].density,
        },
      ]);
      if (combos.length > 2000) return;
    }
  }

  buildCombos(0, []);

  for (const combo of combos) {
    const { score, totals } = scoreCombo(
      combo,
      constraints,
      targets,
      recentItemIds
    );
    if (score > bestScore) {
      bestScore = score;
      bestCombo = combo;
      bestTotals = totals;
    }
  }

  if (constraints.maxCalories !== null && bestTotals.calories > constraints.maxCalories) {
    warnings.push("Best match exceeds your calorie cap.");
  }
  if (constraints.minProtein !== null && bestTotals.protein < constraints.minProtein) {
    warnings.push("Best match is below your protein target.");
  }

  const explanation =
    "Built a recommendation by optimizing protein density and fit to your constraints.";

  return {
    items: bestCombo,
    totals: bestTotals,
    constraints,
    explanation,
    warnings,
  };
}
