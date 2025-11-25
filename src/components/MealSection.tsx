"use client";

import { NutritionCard } from "./NutritionCard";
import { mealPeriodLabels } from "@/lib/utils";

interface MenuItem {
  id: number;
  name: string;
  category: string | null;
  course: string | null;
  nutrition: {
    calories: number | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    fiber: string | null;
    sugar: string | null;
    sodium: number | null;
    servingSize: string | null;
    vitamins: Record<string, number> | null;
    minerals: Record<string, number> | null;
    allergens: string[] | null;
    dietaryFlags: string[] | null;
  } | null;
}

interface MealSectionProps {
  mealPeriod: string;
  items: MenuItem[];
  onAddToMealPlan?: (item: MenuItem, quantity: number) => void;
  mealPlanItems?: number[];
}

export function MealSection({
  mealPeriod,
  items,
  onAddToMealPlan,
  mealPlanItems = [],
}: MealSectionProps) {
  // Group items by category
  const itemsByCategory = items.reduce<Record<string, MenuItem[]>>(
    (acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {}
  );

  const categories = Object.keys(itemsByCategory).sort();

  return (
    <section className="meal-section">
      <h2 className="meal-section-title">
        {mealPeriodLabels[mealPeriod] || mealPeriod}
        <span className="meal-section-count">{items.length} items</span>
      </h2>

      <div className="meal-section-content">
        {categories.map((category) => (
          <div key={category} className="category-group">
            <h3 className="category-title">{category}</h3>
            <div className="items-grid">
              {itemsByCategory[category].map((item) => (
                <NutritionCard
                  key={item.id}
                  item={item}
                  onAddToMealPlan={onAddToMealPlan}
                  isInMealPlan={mealPlanItems.includes(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

