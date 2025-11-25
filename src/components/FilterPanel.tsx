"use client";

import { useState } from "react";

interface FilterOptions {
  searchQuery: string;
  maxCalories: number | null;
  minProtein: number | null;
  dietaryFlags: string[];
  excludeAllergens: string[];
}

interface FilterPanelProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
}

const DIETARY_OPTIONS = [
  "vegetarian",
  "vegan",
  "halal",
  "gluten-free",
];

const ALLERGEN_OPTIONS = [
  "gluten",
  "dairy",
  "eggs",
  "soy",
  "nuts",
  "shellfish",
  "fish",
];

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const toggleArrayItem = (
    key: "dietaryFlags" | "excludeAllergens",
    item: string
  ) => {
    const current = filters[key];
    const updated = current.includes(item)
      ? current.filter((i) => i !== item)
      : [...current, item];
    updateFilter(key, updated);
  };

  const clearFilters = () => {
    onFilterChange({
      searchQuery: "",
      maxCalories: null,
      minProtein: null,
      dietaryFlags: [],
      excludeAllergens: [],
    });
  };

  const hasActiveFilters =
    filters.searchQuery ||
    filters.maxCalories !== null ||
    filters.minProtein !== null ||
    filters.dietaryFlags.length > 0 ||
    filters.excludeAllergens.length > 0;

  return (
    <div className="filter-panel">
      {/* Search Bar */}
      <div className="search-bar">
        <svg
          className="search-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search dishes..."
          value={filters.searchQuery}
          onChange={(e) => updateFilter("searchQuery", e.target.value)}
          className="search-input"
        />
        {filters.searchQuery && (
          <button
            onClick={() => updateFilter("searchQuery", "")}
            className="search-clear"
          >
            ×
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`filter-toggle ${hasActiveFilters ? "has-filters" : ""}`}
      >
        <svg
          className="filter-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filters
        {hasActiveFilters && (
          <span className="filter-count">
            {[
              filters.maxCalories !== null,
              filters.minProtein !== null,
              ...filters.dietaryFlags,
              ...filters.excludeAllergens,
            ].filter(Boolean).length}
          </span>
        )}
      </button>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="filter-expanded">
          {/* Calorie & Protein Sliders */}
          <div className="filter-section">
            <h4 className="filter-section-title">Macros</h4>
            <div className="macro-filters">
              <div className="macro-filter">
                <label>
                  Max Calories: {filters.maxCalories || "Any"}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1500"
                  step="50"
                  value={filters.maxCalories || 1500}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateFilter("maxCalories", val >= 1500 ? null : val);
                  }}
                  className="macro-slider"
                />
              </div>
              <div className="macro-filter">
                <label>
                  Min Protein: {filters.minProtein || 0}g
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={filters.minProtein || 0}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    updateFilter("minProtein", val === 0 ? null : val);
                  }}
                  className="macro-slider"
                />
              </div>
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="filter-section">
            <h4 className="filter-section-title">Dietary Preferences</h4>
            <div className="filter-chips">
              {DIETARY_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleArrayItem("dietaryFlags", option)}
                  className={`filter-chip dietary ${
                    filters.dietaryFlags.includes(option) ? "selected" : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Allergen Exclusions */}
          <div className="filter-section">
            <h4 className="filter-section-title">Exclude Allergens</h4>
            <div className="filter-chips">
              {ALLERGEN_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => toggleArrayItem("excludeAllergens", option)}
                  className={`filter-chip allergen ${
                    filters.excludeAllergens.includes(option) ? "selected" : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to filter items
export function filterMenuItems<T extends {
  name: string;
  nutrition: {
    calories: number | null;
    protein: string | null;
    allergens: string[] | null;
    dietaryFlags: string[] | null;
  } | null;
}>(items: T[], filters: FilterOptions): T[] {
  return items.filter((item) => {
    // Search query
    if (
      filters.searchQuery &&
      !item.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
    ) {
      return false;
    }

    const nutrition = item.nutrition;

    // Max calories
    if (filters.maxCalories !== null && nutrition) {
      if (
        nutrition.calories !== null &&
        nutrition.calories > filters.maxCalories
      ) {
        return false;
      }
    }

    // Min protein
    if (filters.minProtein !== null && nutrition) {
      const protein = parseFloat(nutrition.protein || "0");
      if (protein < filters.minProtein) {
        return false;
      }
    }

    // Dietary flags (must have ALL selected flags)
    if (filters.dietaryFlags.length > 0 && nutrition?.dietaryFlags) {
      const hasAllFlags = filters.dietaryFlags.every((flag) =>
        nutrition.dietaryFlags?.includes(flag)
      );
      if (!hasAllFlags) {
        return false;
      }
    }

    // Exclude allergens (must NOT have ANY selected allergens)
    if (filters.excludeAllergens.length > 0 && nutrition?.allergens) {
      const hasExcluded = filters.excludeAllergens.some((allergen) =>
        nutrition.allergens?.includes(allergen)
      );
      if (hasExcluded) {
        return false;
      }
    }

    return true;
  });
}

