"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import type { DailyGoals } from "@/contexts";

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

interface RecommendationItem {
  id: number;
  name: string;
  quantity: number;
  nutrition: MenuItem["nutrition"];
  score: number;
}

interface RecommendationResult {
  items: RecommendationItem[];
  totals: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  explanation: string;
  warnings: string[];
}

interface ChatPanelProps {
  diningHall: string;
  date: string;
  mealPeriod: string;
  goals: DailyGoals;
  dietaryFlags: string[];
  excludeAllergens: string[];
  excludedIngredients: string[];
  preferredIngredients: string[];
  onAddToMealPlan: (item: MenuItem, quantity: number) => void;
}

export function ChatPanel({
  diningHall,
  date,
  mealPeriod,
  goals,
  dietaryFlags,
  excludeAllergens,
  excludedIngredients,
  preferredIngredients,
  onAddToMealPlan,
}: ChatPanelProps) {
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | "accept" | "save">(null);
  const canRecommend = input.trim().length > 0 && mealPeriod.length > 0 && !isLoading;

  const handleSubmit = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input.trim(),
          diningHall,
          date,
          mealPeriod,
          dailyCalories: goals.calories,
          dailyProtein: goals.protein,
          dailyCarbs: goals.carbs,
          dailyFat: goals.fat,
          dietaryFlags,
          excludeAllergens,
          avoidIngredients: excludedIngredients,
          preferIngredients: preferredIngredients,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to get recommendation");
      }

      setRecommendation(data.recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get recommendation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAllToPlan = () => {
    if (!recommendation) return;
    recommendation.items.forEach((item) => {
      onAddToMealPlan(
        {
          id: item.id,
          name: item.name,
          category: null,
          course: null,
          nutrition: item.nutrition,
        },
        item.quantity
      );
    });
  };

  const handleSaveHistory = async (source: "recommendation" | "manual") => {
    if (!recommendation) return;
    const items = recommendation.items.map((item) => ({
      menuItemId: item.id,
      name: item.name,
      quantity: item.quantity,
      nutrition: item.nutrition,
    }));

    await fetch("/api/meal-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diningHallSlug: diningHall,
        date,
        mealPeriod,
        source,
        items,
      }),
    });
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div>
          <h3>Nutrition Coach</h3>
          <p>Ask for a meal that matches your goals</p>
        </div>
        {!session && (
          <button className="chat-signin-btn" onClick={() => signIn("google")}>
            Sign in
          </button>
        )}
      </div>

      <div className="chat-body">
        <div className="chat-input-row">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Try: "50g+ protein under 700 calories"'
            rows={3}
          />
          <button className="chat-submit-btn" onClick={handleSubmit} disabled={!canRecommend}>
            {isLoading ? "Thinking..." : "Recommend"}
          </button>
        </div>

        {!mealPeriod && (
          <div className="chat-error">Select a meal period to get recommendations.</div>
        )}

        {error && <div className="chat-error">{error}</div>}

        {recommendation && (
          <div className="chat-recommendation">
            <div className="recommendation-summary">
              <div className="summary-title">Recommendation</div>
              <div className="summary-totals">
                {Math.round(recommendation.totals.calories)} cal •{" "}
                {Math.round(recommendation.totals.protein)}g protein
              </div>
              <div className="summary-explanation">{recommendation.explanation}</div>
              {recommendation.warnings.length > 0 && (
                <div className="summary-warnings">
                  {recommendation.warnings.map((warn) => (
                    <div key={warn}>• {warn}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="recommendation-items">
              {recommendation.items.map((item) => (
                <div key={item.id} className="recommendation-item">
                  <div>
                    <div className="item-name">{item.name}</div>
                    <div className="item-macros">
                      {item.nutrition?.calories ?? 0} cal •{" "}
                      {item.nutrition?.protein ?? "0"}g P
                    </div>
                  </div>
                  <div className="item-qty">×{item.quantity}</div>
                </div>
              ))}
            </div>

            <div className="recommendation-actions">
              <button onClick={handleAddAllToPlan} className="chat-primary-btn">
                Add to Meal Plan
              </button>
              <button
                onClick={() => setConfirmAction("save")}
                className="chat-secondary-btn"
                disabled={!session}
              >
                Save to History
              </button>
              <button
                onClick={() => setConfirmAction("accept")}
                className="chat-secondary-btn"
                disabled={!session}
              >
                Accept Recommendation
              </button>
            </div>
          </div>
        )}
      </div>

      {confirmAction && (
        <div className="chat-confirm-backdrop">
          <div className="chat-confirm-modal">
            <h4>Save meal to history?</h4>
            <p>
              This will add the recommended items to your meal history for future
              personalization.
            </p>
            <div className="chat-confirm-actions">
              <button
                className="chat-secondary-btn"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="chat-primary-btn"
                onClick={async () => {
                  await handleSaveHistory(
                    confirmAction === "accept" ? "recommendation" : "manual"
                  );
                  setConfirmAction(null);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
