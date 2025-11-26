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
    <div className={`nutrition-card-v2 ${expanded ? "expanded" : ""} ${isInMealPlan ? "in-plan" : ""}`}>
      <div
        className="card-header"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="card-title-row">
          <div className="card-title-content">
            <h3 className="card-title">{item.name}</h3>
            {item.category && (
              <span className="card-category">{item.category}</span>
            )}
          </div>
          <button
            className="expand-btn"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            <svg
              className={`expand-icon ${expanded ? "rotated" : ""}`}
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

        {hasNutrition && (
          <div className="macro-row">
            <div className="macro-pill calories">
              <span className="macro-value">{formatNutrient(scale(nutrition.calories), "")}</span>
              <span className="macro-unit">cal</span>
            </div>
            <div className="macro-pill protein">
              <span className="macro-value">{formatNutrient(scale(nutrition.protein), "")}</span>
              <span className="macro-unit">g P</span>
            </div>
            <div className="macro-pill carbs">
              <span className="macro-value">{formatNutrient(scale(nutrition.carbs), "")}</span>
              <span className="macro-unit">g C</span>
            </div>
            <div className="macro-pill fat">
              <span className="macro-value">{formatNutrient(scale(nutrition.fat), "")}</span>
              <span className="macro-unit">g F</span>
            </div>
          </div>
        )}

        {!hasNutrition && (
          <div className="no-nutrition-badge">
            <span>Nutrition data coming soon</span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="card-details">
          {hasNutrition ? (
            <>
              {/* Serving size and quantity controls */}
              <div className="detail-section">
                <div className="detail-row">
                  <span className="detail-label">Serving Size</span>
                  <span className="detail-value">{nutrition.servingSize || "1 serving"}</span>
                </div>

                {onAddToMealPlan && (
                  <div className="detail-row">
                    <span className="detail-label">Quantity</span>
                    <div className="quantity-controls">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuantity(Math.max(0.5, quantity - 0.5));
                        }}
                        className="qty-btn"
                      >
                        −
                      </button>
                      <span className="qty-value">{quantity}x</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuantity(quantity + 0.5);
                        }}
                        className="qty-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed macros */}
              <div className="nutrition-breakdown">
                <div className="nutrition-stat">
                  <span className="stat-value calories">{formatNutrient(scale(nutrition.calories), "")}</span>
                  <span className="stat-label">Calories</span>
                </div>
                <div className="nutrition-stat">
                  <span className="stat-value protein">{formatNutrient(scale(nutrition.protein), "g")}</span>
                  <span className="stat-label">Protein</span>
                </div>
                <div className="nutrition-stat">
                  <span className="stat-value carbs">{formatNutrient(scale(nutrition.carbs), "g")}</span>
                  <span className="stat-label">Carbs</span>
                </div>
                <div className="nutrition-stat">
                  <span className="stat-value fat">{formatNutrient(scale(nutrition.fat), "g")}</span>
                  <span className="stat-label">Fat</span>
                </div>
                {nutrition.fiber && (
                  <div className="nutrition-stat">
                    <span className="stat-value">{formatNutrient(scale(nutrition.fiber), "g")}</span>
                    <span className="stat-label">Fiber</span>
                  </div>
                )}
                {nutrition.sugar && (
                  <div className="nutrition-stat">
                    <span className="stat-value">{formatNutrient(scale(nutrition.sugar), "g")}</span>
                    <span className="stat-label">Sugar</span>
                  </div>
                )}
                {nutrition.sodium && (
                  <div className="nutrition-stat">
                    <span className="stat-value">{formatNutrient(scale(nutrition.sodium), "mg")}</span>
                    <span className="stat-label">Sodium</span>
                  </div>
                )}
              </div>

              {/* Dietary flags */}
              {nutrition.dietaryFlags && nutrition.dietaryFlags.length > 0 && (
                <div className="tags-section">
                  <span className="tags-label">Dietary</span>
                  <div className="tags-list">
                    {nutrition.dietaryFlags.map((flag) => (
                      <span key={flag} className="tag dietary">
                        {flag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Allergens */}
              {nutrition.allergens && nutrition.allergens.length > 0 && (
                <div className="tags-section">
                  <span className="tags-label">Allergens</span>
                  <div className="tags-list">
                    {nutrition.allergens.map((allergen) => (
                      <span key={allergen} className="tag allergen">
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
                  className={`add-btn ${isInMealPlan ? "added" : ""}`}
                >
                  {isInMealPlan ? "✓ In Meal Plan" : "+ Add to Meal Plan"}
                </button>
              )}
            </>
          ) : (
            <div className="no-nutrition-message">
              <div className="no-nutrition-icon">🔬</div>
              <p>Nutrition information not available yet.</p>
              <p className="subtext">We&apos;re working on adding this data!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
