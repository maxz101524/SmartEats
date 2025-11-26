"use client";

import { formatNutrient } from "@/lib/utils";
import { useUserPreferences, type DailyGoals } from "@/contexts";

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

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Ghost preview for hover effect
interface GhostPreview {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealPlanSummaryProps {
  items: MealPlanItem[];
  onRemoveItem: (id: number) => void;
  onClear: () => void;
  onOpenGoals?: () => void;
  ghostPreview?: GhostPreview | null;
}

function ProgressBar({
  current,
  goal,
  ghost,
  label,
  unit,
  colorClass,
}: {
  current: number;
  goal: number;
  ghost?: number;
  label: string;
  unit: string;
  colorClass: string;
}) {
  const percentage = Math.min((current / goal) * 100, 100);
  const isOver = current > goal;
  const remaining = goal - current;
  
  // Ghost percentage (preview of what adding an item would do)
  const ghostPercentage = ghost
    ? Math.min(((current + ghost) / goal) * 100, 100)
    : percentage;
  const wouldBeOver = ghost ? current + ghost > goal : false;

  return (
    <div className="progress-item">
      <div className="progress-header">
        <span className={`progress-label ${colorClass}`}>{label}</span>
        <span className="progress-values">
          <span className={`progress-current ${isOver ? "over" : ""}`}>
            {Math.round(current)}
          </span>
          <span className="progress-separator">/</span>
          <span className="progress-goal">{goal}{unit}</span>
        </span>
      </div>
      
      <div className="progress-bar-track">
        {/* Ghost preview fill */}
        {ghost && ghost > 0 && (
          <div
            className={`progress-bar-ghost ${wouldBeOver ? "over" : colorClass}`}
            style={{ width: `${ghostPercentage}%` }}
          />
        )}
        {/* Current fill */}
        <div
          className={`progress-bar-fill ${isOver ? "over" : colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="progress-footer">
        {isOver ? (
          <span className="progress-remaining over">
            {Math.round(current - goal)}{unit} over
          </span>
        ) : (
          <span className="progress-remaining">
            {Math.round(remaining)}{unit} remaining
          </span>
        )}
      </div>
    </div>
  );
}

export function MealPlanSummary({
  items,
  onRemoveItem,
  onClear,
  onOpenGoals,
  ghostPreview,
}: MealPlanSummaryProps) {
  const { goals } = useUserPreferences();

  // Calculate totals
  const totals: Totals = items.reduce(
    (acc, item) => {
      if (!item.nutrition) return acc;
      const q = item.quantity;
      return {
        calories: acc.calories + (item.nutrition.calories || 0) * q,
        protein: acc.protein + parseFloat(item.nutrition.protein || "0") * q,
        carbs: acc.carbs + parseFloat(item.nutrition.carbs || "0") * q,
        fat: acc.fat + parseFloat(item.nutrition.fat || "0") * q,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  if (items.length === 0) {
    return (
      <div className="meal-plan-summary empty">
        <div className="meal-plan-empty-state">
          <div className="empty-icon">🥗</div>
          <h3>Your meal plan is empty</h3>
          <p>Click the + button on items to add them</p>
        </div>
        
        {/* Show goals even when empty */}
        <div className="meal-plan-goals-preview">
          <div className="goals-preview-header">
            <span className="goals-preview-title">Daily Targets</span>
            {onOpenGoals && (
              <button className="goals-edit-btn" onClick={onOpenGoals}>
                Edit
              </button>
            )}
          </div>
          <div className="goals-preview-grid">
            <div className="goal-preview-item">
              <span className="goal-preview-value calories">{goals.calories}</span>
              <span className="goal-preview-label">cal</span>
            </div>
            <div className="goal-preview-item">
              <span className="goal-preview-value protein">{goals.protein}g</span>
              <span className="goal-preview-label">protein</span>
            </div>
            <div className="goal-preview-item">
              <span className="goal-preview-value carbs">{goals.carbs}g</span>
              <span className="goal-preview-label">carbs</span>
            </div>
            <div className="goal-preview-item">
              <span className="goal-preview-value fat">{goals.fat}g</span>
              <span className="goal-preview-label">fat</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="meal-plan-summary">
      <div className="meal-plan-header">
        <h3>
          <span className="header-icon">📋</span>
          Meal Plan
          <span className="item-count">{items.length}</span>
        </h3>
        <div className="header-actions">
          {onOpenGoals && (
            <button onClick={onOpenGoals} className="goals-btn" title="Edit Goals">
              🎯
            </button>
          )}
          <button onClick={onClear} className="clear-btn">
            Clear
          </button>
        </div>
      </div>

      {/* Items list */}
      <div className="meal-plan-items">
        {items.map((item) => (
          <div key={item.id} className="meal-plan-item">
            <div className="item-info">
              <span className="item-name">
                {item.quantity > 1 && (
                  <span className="item-qty">{item.quantity}×</span>
                )}
                {item.name}
              </span>
              <span className="item-macros">
                {formatNutrient((item.nutrition?.calories || 0) * item.quantity, "")} cal
                {item.nutrition?.protein && (
                  <> • {formatNutrient(parseFloat(item.nutrition.protein) * item.quantity, "")}g P</>
                )}
              </span>
            </div>
            <button
              onClick={() => onRemoveItem(item.id)}
              className="remove-btn"
              aria-label="Remove item"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div className="meal-plan-progress">
        <ProgressBar
          current={totals.calories}
          goal={goals.calories}
          ghost={ghostPreview?.calories}
          label="Calories"
          unit=""
          colorClass="calories"
        />
        <ProgressBar
          current={totals.protein}
          goal={goals.protein}
          ghost={ghostPreview?.protein}
          label="Protein"
          unit="g"
          colorClass="protein"
        />
        <ProgressBar
          current={totals.carbs}
          goal={goals.carbs}
          ghost={ghostPreview?.carbs}
          label="Carbs"
          unit="g"
          colorClass="carbs"
        />
        <ProgressBar
          current={totals.fat}
          goal={goals.fat}
          ghost={ghostPreview?.fat}
          label="Fat"
          unit="g"
          colorClass="fat"
        />
      </div>

      {/* Summary footer */}
      <div className="meal-plan-footer">
        <div className="totals-summary">
          <span className="totals-label">Total Intake</span>
          <div className="totals-pills">
            <span className="total-pill calories">{Math.round(totals.calories)} cal</span>
            <span className="total-pill protein">{Math.round(totals.protein)}g P</span>
            <span className="total-pill carbs">{Math.round(totals.carbs)}g C</span>
            <span className="total-pill fat">{Math.round(totals.fat)}g F</span>
          </div>
        </div>
      </div>
    </div>
  );
}
