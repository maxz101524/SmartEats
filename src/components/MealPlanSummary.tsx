"use client";

import { formatNutrient, dailyValues, calculateDV } from "@/lib/utils";

interface MealPlanItem {
  id: number;
  name: string;
  quantity: number;
  nutrition: {
    calories: number | null;
    protein: string | null;
    carbs: string | null;
    fat: string | null;
    fiber: string | null;
  } | null;
}

interface MealPlanSummaryProps {
  items: MealPlanItem[];
  onRemoveItem: (id: number) => void;
  onClear: () => void;
}

export function MealPlanSummary({
  items,
  onRemoveItem,
  onClear,
}: MealPlanSummaryProps) {
  // Calculate totals
  const totals = items.reduce(
    (acc, item) => {
      if (!item.nutrition) return acc;
      const q = item.quantity;
      return {
        calories: acc.calories + (item.nutrition.calories || 0) * q,
        protein: acc.protein + parseFloat(item.nutrition.protein || "0") * q,
        carbs: acc.carbs + parseFloat(item.nutrition.carbs || "0") * q,
        fat: acc.fat + parseFloat(item.nutrition.fat || "0") * q,
        fiber: acc.fiber + parseFloat(item.nutrition.fiber || "0") * q,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  if (items.length === 0) {
    return (
      <div className="meal-plan-empty">
        <p>Your meal plan is empty</p>
        <p className="text-sm text-slate-400">
          Tap items to add them to your daily plan
        </p>
      </div>
    );
  }

  return (
    <div className="meal-plan-summary">
      <div className="meal-plan-header">
        <h3>Meal Plan</h3>
        <button onClick={onClear} className="clear-btn">
          Clear All
        </button>
      </div>

      {/* Items list */}
      <div className="meal-plan-items">
        {items.map((item) => (
          <div key={item.id} className="meal-plan-item">
            <span className="item-name">
              {item.quantity > 1 && `${item.quantity}x `}
              {item.name}
            </span>
            <div className="item-actions">
              <span className="item-calories">
                {formatNutrient(
                  (item.nutrition?.calories || 0) * item.quantity,
                  ""
                )} cal
              </span>
              <button
                onClick={() => onRemoveItem(item.id)}
                className="remove-btn"
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="meal-plan-totals">
        <div className="totals-grid">
          <div className="total-item">
            <span className="total-value total-calories">
              {Math.round(totals.calories)}
            </span>
            <span className="total-label">Calories</span>
            <div className="dv-bar">
              <div
                className="dv-fill bg-amber-500"
                style={{
                  width: `${Math.min(100, calculateDV(totals.calories, dailyValues.calories))}%`,
                }}
              />
            </div>
            <span className="dv-text">
              {calculateDV(totals.calories, dailyValues.calories)}% DV
            </span>
          </div>

          <div className="total-item">
            <span className="total-value total-protein">
              {Math.round(totals.protein)}g
            </span>
            <span className="total-label">Protein</span>
            <div className="dv-bar">
              <div
                className="dv-fill bg-emerald-500"
                style={{
                  width: `${Math.min(100, calculateDV(totals.protein, dailyValues.protein))}%`,
                }}
              />
            </div>
            <span className="dv-text">
              {calculateDV(totals.protein, dailyValues.protein)}% DV
            </span>
          </div>

          <div className="total-item">
            <span className="total-value total-carbs">
              {Math.round(totals.carbs)}g
            </span>
            <span className="total-label">Carbs</span>
            <div className="dv-bar">
              <div
                className="dv-fill bg-blue-500"
                style={{
                  width: `${Math.min(100, calculateDV(totals.carbs, dailyValues.carbs))}%`,
                }}
              />
            </div>
            <span className="dv-text">
              {calculateDV(totals.carbs, dailyValues.carbs)}% DV
            </span>
          </div>

          <div className="total-item">
            <span className="total-value total-fat">{Math.round(totals.fat)}g</span>
            <span className="total-label">Fat</span>
            <div className="dv-bar">
              <div
                className="dv-fill bg-rose-500"
                style={{
                  width: `${Math.min(100, calculateDV(totals.fat, dailyValues.fat))}%`,
                }}
              />
            </div>
            <span className="dv-text">
              {calculateDV(totals.fat, dailyValues.fat)}% DV
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

