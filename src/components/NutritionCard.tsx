"use client";

import { useState } from "react";
import { formatNutrient } from "@/lib/utils";

interface NutritionCardProps {
  item: {
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
  };
  portionSize?: number;
  onAddToMealPlan?: (item: NutritionCardProps["item"], quantity: number) => void;
  isInMealPlan?: boolean;
}

export function NutritionCard({
  item,
  portionSize = 1,
  onAddToMealPlan,
  isInMealPlan = false,
}: NutritionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const nutrition = item.nutrition;
  const hasNutrition = nutrition !== null;

  const scale = (value: number | string | null) => {
    if (value === null) return null;
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num * portionSize * quantity;
  };

  return (
    <div className="nutrition-card group">
      <div
        className="nutrition-card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <h3 className="nutrition-card-title">{item.name}</h3>
          {item.category && (
            <span className="nutrition-card-category">{item.category}</span>
          )}
        </div>

        {hasNutrition && (
          <div className="nutrition-card-macros">
            <span className="macro-badge macro-calories">
              {formatNutrient(scale(nutrition.calories), "")} cal
            </span>
            <span className="macro-badge macro-protein">
              {formatNutrient(scale(nutrition.protein), "g")} P
            </span>
            <span className="macro-badge macro-carbs">
              {formatNutrient(scale(nutrition.carbs), "g")} C
            </span>
            <span className="macro-badge macro-fat">
              {formatNutrient(scale(nutrition.fat), "g")} F
            </span>
          </div>
        )}

        <button
          className="expand-button"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          <svg
            className={`w-5 h-5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="nutrition-card-details">
          {hasNutrition ? (
            <>
              {/* Serving size and quantity controls */}
              <div className="detail-row border-b border-slate-700 pb-3 mb-3">
                <span className="detail-label">Serving Size</span>
                <span className="detail-value">{nutrition.servingSize || "1 serving"}</span>
              </div>

              {onAddToMealPlan && (
                <div className="detail-row border-b border-slate-700 pb-3 mb-3">
                  <span className="detail-label">Quantity</span>
                  <div className="quantity-controls">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuantity(Math.max(0.5, quantity - 0.5));
                      }}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <span className="quantity-value">{quantity}x</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setQuantity(quantity + 0.5);
                      }}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Detailed macros */}
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <span className="nutrition-label">Calories</span>
                  <span className="nutrition-value">{formatNutrient(scale(nutrition.calories), "")}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Protein</span>
                  <span className="nutrition-value">{formatNutrient(scale(nutrition.protein), "g")}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Carbs</span>
                  <span className="nutrition-value">{formatNutrient(scale(nutrition.carbs), "g")}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Fat</span>
                  <span className="nutrition-value">{formatNutrient(scale(nutrition.fat), "g")}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Fiber</span>
                  <span className="nutrition-value">{formatNutrient(scale(nutrition.fiber), "g")}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Sugar</span>
                  <span className="nutrition-value">{formatNutrient(scale(nutrition.sugar), "g")}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Sodium</span>
                  <span className="nutrition-value">{formatNutrient(scale(nutrition.sodium), "mg")}</span>
                </div>
              </div>

              {/* Dietary flags */}
              {nutrition.dietaryFlags && nutrition.dietaryFlags.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Dietary</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {nutrition.dietaryFlags.map((flag) => (
                      <span key={flag} className="dietary-badge">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergens */}
              {nutrition.allergens && nutrition.allergens.length > 0 && (
                <div className="mt-3">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">Allergens</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {nutrition.allergens.map((allergen) => (
                      <span key={allergen} className="allergen-badge">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to meal plan button */}
              {onAddToMealPlan && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddToMealPlan(item, quantity);
                  }}
                  className={`add-to-plan-btn ${isInMealPlan ? "added" : ""}`}
                >
                  {isInMealPlan ? "✓ In Meal Plan" : "+ Add to Meal Plan"}
                </button>
              )}
            </>
          ) : (
            <div className="no-nutrition">
              <p>Nutrition information not available yet.</p>
              <p className="text-xs mt-1">Check back soon!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

