"use client";

import { useState } from "react";
import { formatNutrient } from "@/lib/utils";
import { useUserPreferences } from "@/contexts";

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
  onQuickAdd?: (item: NutritionCardProps["item"]) => void;
  onHoverStart?: (nutrition: { calories: number; protein: number; carbs: number; fat: number }) => void;
  onHoverEnd?: () => void;
  isInMealPlan?: boolean;
}

// Mini Donut Chart component for macro visualization
function MiniDonut({
  value,
  maxValue,
  color,
  size = 32,
}: {
  value: number;
  maxValue: number;
  color: string;
  size?: number;
}) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mini-donut"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--border-color)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.3s ease" }}
      />
    </svg>
  );
}

export function NutritionCard({
  item,
  portionSize = 1,
  onAddToMealPlan,
  onQuickAdd,
  onHoverStart,
  onHoverEnd,
  isInMealPlan = false,
}: NutritionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { goals } = useUserPreferences();

  const nutrition = item.nutrition;
  const hasNutrition = nutrition !== null;

  const scale = (value: number | string | null) => {
    if (value === null) return null;
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num * portionSize * quantity;
  };

  // Get numeric values for donuts
  const calories = nutrition?.calories ?? 0;
  const protein = parseFloat(nutrition?.protein || "0");
  const carbs = parseFloat(nutrition?.carbs || "0");
  const fat = parseFloat(nutrition?.fat || "0");

  const handleMouseEnter = () => {
    if (onHoverStart && hasNutrition) {
      onHoverStart({
        calories,
        protein,
        carbs,
        fat,
      });
    }
  };

  const handleMouseLeave = () => {
    if (onHoverEnd) {
      onHoverEnd();
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onQuickAdd) {
      onQuickAdd(item);
    } else if (onAddToMealPlan) {
      onAddToMealPlan(item, 1);
    }
  };

  return (
    <div
      className={`nutrition-card-v2 ${expanded ? "expanded" : ""} ${isInMealPlan ? "in-plan" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Quick Add Button - always visible on card face */}
      {(onQuickAdd || onAddToMealPlan) && hasNutrition && (
        <button
          className={`quick-add-btn ${isInMealPlan ? "added" : ""}`}
          onClick={handleQuickAdd}
          aria-label={isInMealPlan ? "Already in plan" : "Quick add to meal plan"}
          title={isInMealPlan ? "Already in plan" : "Add to meal plan"}
        >
          {isInMealPlan ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
        </button>
      )}

      <div className="card-header" onClick={() => setExpanded(!expanded)}>
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
          <div className="macro-visuals">
            {/* Mini donut charts - showing % of DAILY goal */}
            <div className="donut-row">
              <div className="donut-item">
                <MiniDonut
                  value={calories}
                  maxValue={goals.calories}
                  color="var(--accent-amber)"
                />
                <span className="donut-value calories">{Math.round(calories)}</span>
                <span className="donut-label">CAL</span>
              </div>
              <div className="donut-item">
                <MiniDonut
                  value={protein}
                  maxValue={goals.protein}
                  color="var(--accent-emerald)"
                />
                <span className="donut-value protein">{Math.round(protein)}g</span>
                <span className="donut-label">PROTEIN</span>
              </div>
              <div className="donut-item">
                <MiniDonut
                  value={carbs}
                  maxValue={goals.carbs}
                  color="var(--accent-blue)"
                />
                <span className="donut-value carbs">{Math.round(carbs)}g</span>
                <span className="donut-label">CARBS</span>
              </div>
              <div className="donut-item">
                <MiniDonut
                  value={fat}
                  maxValue={goals.fat}
                  color="var(--accent-rose)"
                />
                <span className="donut-value fat">{Math.round(fat)}g</span>
                <span className="donut-label">FAT</span>
              </div>
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
                  <span className="detail-value">
                    {nutrition.servingSize || "1 serving"}
                  </span>
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
                  <span className="stat-value calories">
                    {formatNutrient(scale(nutrition.calories), "")}
                  </span>
                  <span className="stat-label">Calories</span>
                </div>
                <div className="nutrition-stat">
                  <span className="stat-value protein">
                    {formatNutrient(scale(nutrition.protein), "g")}
                  </span>
                  <span className="stat-label">Protein</span>
                </div>
                <div className="nutrition-stat">
                  <span className="stat-value carbs">
                    {formatNutrient(scale(nutrition.carbs), "g")}
                  </span>
                  <span className="stat-label">Carbs</span>
                </div>
                <div className="nutrition-stat">
                  <span className="stat-value fat">
                    {formatNutrient(scale(nutrition.fat), "g")}
                  </span>
                  <span className="stat-label">Fat</span>
                </div>
                {nutrition.fiber && (
                  <div className="nutrition-stat">
                    <span className="stat-value">
                      {formatNutrient(scale(nutrition.fiber), "g")}
                    </span>
                    <span className="stat-label">Fiber</span>
                  </div>
                )}
                {nutrition.sugar && (
                  <div className="nutrition-stat">
                    <span className="stat-value">
                      {formatNutrient(scale(nutrition.sugar), "g")}
                    </span>
                    <span className="stat-label">Sugar</span>
                  </div>
                )}
                {nutrition.sodium && (
                  <div className="nutrition-stat">
                    <span className="stat-value">
                      {formatNutrient(scale(nutrition.sodium), "mg")}
                    </span>
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
                  {isInMealPlan
                    ? `✓ Add Another (${quantity}x)`
                    : `+ Add to Meal Plan (${quantity}x)`}
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
