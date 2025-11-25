"use client";

import { mealPeriodLabels } from "@/lib/utils";

interface MealTabsProps {
  meals: string[];
  selected: string;
  onChange: (meal: string) => void;
}

export function MealTabs({ meals, selected, onChange }: MealTabsProps) {
  if (meals.length === 0) return null;

  return (
    <div className="meal-tabs">
      {meals.map((meal) => (
        <button
          key={meal}
          onClick={() => onChange(meal)}
          className={`meal-tab ${selected === meal ? "selected" : ""}`}
        >
          {mealPeriodLabels[meal] || meal}
        </button>
      ))}
    </div>
  );
}

