"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DiningHallSelector,
  DateSelector,
  MealTabs,
  MealSection,
  MealPlanSummary,
  FilterPanel,
  filterMenuItems,
  Header,
  GoalsModal,
} from "@/components";
import { formatDateISO, formatDate } from "@/lib/utils";
import type { DiningHallSlug } from "@/lib/scraper/config";

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

interface MenuData {
  diningHall: {
    id: number;
    name: string;
    slug: string;
  };
  date: string;
  meals: Record<string, MenuItem[]>;
}

interface MealPlanItem {
  id: number;
  name: string;
  quantity: number;
  nutrition: MenuItem["nutrition"];
}

interface FilterOptions {
  searchQuery: string;
  maxCalories: number | null;
  minProtein: number | null;
  dietaryFlags: string[];
  excludeAllergens: string[];
}

interface GhostPreview {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function Home() {
  const [selectedHall, setSelectedHall] = useState<DiningHallSlug>("ikenberry");
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [selectedMeal, setSelectedMeal] = useState<string>("");
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlanItem[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: "",
    maxCalories: null,
    minProtein: null,
    dietaryFlags: [],
    excludeAllergens: [],
  });
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [ghostPreview, setGhostPreview] = useState<GhostPreview | null>(null);

  const fetchMenu = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/menu?hall=${selectedHall}&date=${selectedDate}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setMenuData(data.data);
        // Set first available meal as selected
        const meals = Object.keys(data.data.meals);
        if (meals.length > 0 && !meals.includes(selectedMeal)) {
          // Prefer lunch, then dinner, then breakfast
          const preferredOrder = ["lunch", "dinner", "breakfast"];
          const preferred = preferredOrder.find((m) => meals.includes(m));
          setSelectedMeal(preferred || meals[0]);
        }
      } else {
        setMenuData(null);
        setError(data.error || "No menu data available");
      }
    } catch {
      setError("Failed to load menu data");
      setMenuData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedHall, selectedDate, selectedMeal]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  const handleAddToMealPlan = (item: MenuItem, quantity: number) => {
    setMealPlan((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + quantity } : p
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          quantity,
          nutrition: item.nutrition,
        },
      ];
    });
  };

  const handleQuickAdd = (item: MenuItem) => {
    handleAddToMealPlan(item, 1);
  };

  const handleRemoveFromMealPlan = (id: number) => {
    setMealPlan((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClearMealPlan = () => {
    setMealPlan([]);
  };

  const handleHoverStart = (nutrition: GhostPreview) => {
    setGhostPreview(nutrition);
  };

  const handleHoverEnd = () => {
    setGhostPreview(null);
  };

  const meals = menuData ? Object.keys(menuData.meals) : [];
  const currentMealItems = menuData?.meals[selectedMeal] || [];
  const filteredItems = filterMenuItems(currentMealItems, filters);
  const mealPlanItemIds = mealPlan.map((p) => p.id);

  return (
    <>
      <Header onOpenGoals={() => setIsGoalsModalOpen(true)} />
      
      <main className="main-container">
        {/* Controls */}
        <section className="controls-section">
          <DiningHallSelector
            selected={selectedHall}
            onChange={setSelectedHall}
          />
          <DateSelector selected={selectedDate} onChange={setSelectedDate} />
        </section>

        {/* Content Layout */}
        <div className="content-layout">
          {/* Main Menu Content */}
          <div className="menu-content">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner" />
                <p className="loading-text">Loading menu...</p>
              </div>
            ) : error ? (
              <div className="empty-state">
                <div className="empty-state-icon">🍽️</div>
                <h2 className="empty-state-title">No Menu Available</h2>
                <p className="empty-state-text">
                  {error}
                  <br />
                  Try selecting a different date or dining hall.
                </p>
              </div>
            ) : menuData && meals.length > 0 ? (
              <>
                <h1 style={{ marginBottom: "1rem", fontSize: "1.25rem" }}>
                  {menuData.diningHall.name}
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--text-secondary)",
                      marginLeft: "0.5rem",
                    }}
                  >
                    • {formatDate(menuData.date)}
                  </span>
                </h1>

                <MealTabs
                  meals={meals}
                  selected={selectedMeal}
                  onChange={setSelectedMeal}
                />

                <FilterPanel
                  filters={filters}
                  onFilterChange={setFilters}
                />

                {filteredItems.length > 0 ? (
                  <MealSection
                    mealPeriod={selectedMeal}
                    items={filteredItems}
                    onAddToMealPlan={handleAddToMealPlan}
                    onQuickAdd={handleQuickAdd}
                    mealPlanItems={mealPlanItemIds}
                    onHoverStart={handleHoverStart}
                    onHoverEnd={handleHoverEnd}
                  />
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h2 className="empty-state-title">No Matches</h2>
                    <p className="empty-state-text">
                      No items match your current filters.
                      <br />
                      Try adjusting your search or filter criteria.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h2 className="empty-state-title">No Items Found</h2>
                <p className="empty-state-text">
                  No menu items available for this selection.
                </p>
              </div>
            )}
          </div>

          {/* Sidebar - Meal Plan */}
          <aside className="sidebar">
            <div className="sidebar-sticky">
              <MealPlanSummary
                items={mealPlan}
                onRemoveItem={handleRemoveFromMealPlan}
                onClear={handleClearMealPlan}
                onOpenGoals={() => setIsGoalsModalOpen(true)}
                ghostPreview={ghostPreview}
              />
            </div>
          </aside>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer">
          <strong>Disclaimer:</strong> Nutritional information is estimated using
          AI and may not be 100% accurate. For official nutrition data, please
          consult{" "}
          <a
            href="http://eatsmart.housing.illinois.edu/NetNutrition/46"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent-orange)" }}
          >
            UIUC NetNutrition
          </a>
          .
        </div>

        {/* Footer */}
        <footer className="app-footer">
          <p>
            Made for UIUC students 🧡 •{" "}
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--text-secondary)" }}
            >
              GitHub
            </a>
          </p>
        </footer>
      </main>

      {/* Goals Modal */}
      <GoalsModal
        isOpen={isGoalsModalOpen}
        onClose={() => setIsGoalsModalOpen(false)}
      />
    </>
  );
}
