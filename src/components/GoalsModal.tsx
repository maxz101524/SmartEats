"use client";

import { useState, useEffect } from "react";
import {
  useUserPreferences,
  DEFAULT_GOALS,
  type DailyGoals,
  type UserProfile,
} from "@/contexts";

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DIETARY_OPTIONS = ["vegetarian", "vegan", "halal", "gluten-free"];
const ALLERGEN_OPTIONS = [
  "gluten",
  "dairy",
  "eggs",
  "soy",
  "nuts",
  "shellfish",
  "fish",
];

export function GoalsModal({ isOpen, onClose }: GoalsModalProps) {
  const { goals, profile, updateGoals, resetGoals, updateProfile } =
    useUserPreferences();
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [errors, setErrors] = useState<Partial<Record<keyof DailyGoals, string>>>(
    {}
  );
  const [excludedText, setExcludedText] = useState("");
  const [preferredText, setPreferredText] = useState("");
  const [cuisinesText, setCuisinesText] = useState("");

  // Sync form data with profile when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(profile);
      setErrors({});
      setExcludedText(profile.excludedIngredients.join(", "));
      setPreferredText(profile.preferredIngredients.join(", "));
      setCuisinesText(profile.preferredCuisines.join(", "));
    }
  }, [isOpen, profile]);

  const validateField = (
    field: keyof DailyGoals,
    value: number
  ): string | undefined => {
    if (isNaN(value) || value <= 0) {
      return "Must be a positive number";
    }
    const limits: Record<keyof DailyGoals, { min: number; max: number }> = {
      calories: { min: 500, max: 10000 },
      protein: { min: 10, max: 500 },
      carbs: { min: 20, max: 800 },
      fat: { min: 10, max: 400 },
    };
    const { min, max } = limits[field];
    if (value < min || value > max) {
      return `Must be between ${min} and ${max}`;
    }
    return undefined;
  };

  const handleChange = (field: keyof DailyGoals, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData((prev) => ({
      ...prev,
      goals: {
        ...prev.goals,
        [field]: numValue,
      },
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = () => {
    const newErrors: Partial<Record<keyof DailyGoals, string>> = {};
    let hasErrors = false;

    (Object.keys(formData.goals) as (keyof DailyGoals)[]).forEach((field) => {
      const error = validateField(field, formData.goals[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    const splitList = (value: string) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    const updatedProfile: UserProfile = {
      ...formData,
      excludedIngredients: splitList(excludedText),
      preferredIngredients: splitList(preferredText),
      preferredCuisines: splitList(cuisinesText),
    };

    updateGoals(updatedProfile.goals);
    updateProfile(updatedProfile);
    onClose();
  };

  const handleReset = () => {
    setFormData((prev) => ({
      ...prev,
      goals: DEFAULT_GOALS,
    }));
    setErrors({});
    resetGoals();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />

      <div className="modal-container">
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title-row">
              <div className="modal-icon">🎯</div>
              <div>
                <h2 className="modal-title">My Profile</h2>
                <p className="modal-subtitle">
                  Goals and preferences for personalized recommendations
                </p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="modal-body">
            <div className="goals-form">
              <div className="goal-input-group">
                <div className="goal-input-header">
                  <label className="goal-label">
                    <span className="goal-color calories" />
                    Calories
                  </label>
                  <span className="goal-unit">kcal/day</span>
                </div>
                <input
                  type="number"
                  className={`goal-input ${errors.calories ? "error" : ""}`}
                  value={formData.goals.calories || ""}
                  onChange={(e) => handleChange("calories", e.target.value)}
                  placeholder="2000"
                  min="500"
                  max="10000"
                />
                {errors.calories && <span className="goal-error">{errors.calories}</span>}
              </div>

              <div className="goal-input-group">
                <div className="goal-input-header">
                  <label className="goal-label">
                    <span className="goal-color protein" />
                    Protein
                  </label>
                  <span className="goal-unit">grams/day</span>
                </div>
                <input
                  type="number"
                  className={`goal-input ${errors.protein ? "error" : ""}`}
                  value={formData.goals.protein || ""}
                  onChange={(e) => handleChange("protein", e.target.value)}
                  placeholder="150"
                  min="10"
                  max="500"
                />
                {errors.protein && <span className="goal-error">{errors.protein}</span>}
              </div>

              <div className="goal-input-group">
                <div className="goal-input-header">
                  <label className="goal-label">
                    <span className="goal-color carbs" />
                    Carbohydrates
                  </label>
                  <span className="goal-unit">grams/day</span>
                </div>
                <input
                  type="number"
                  className={`goal-input ${errors.carbs ? "error" : ""}`}
                  value={formData.goals.carbs || ""}
                  onChange={(e) => handleChange("carbs", e.target.value)}
                  placeholder="250"
                  min="20"
                  max="800"
                />
                {errors.carbs && <span className="goal-error">{errors.carbs}</span>}
              </div>

              <div className="goal-input-group">
                <div className="goal-input-header">
                  <label className="goal-label">
                    <span className="goal-color fat" />
                    Fat
                  </label>
                  <span className="goal-unit">grams/day</span>
                </div>
                <input
                  type="number"
                  className={`goal-input ${errors.fat ? "error" : ""}`}
                  value={formData.goals.fat || ""}
                  onChange={(e) => handleChange("fat", e.target.value)}
                  placeholder="65"
                  min="10"
                  max="400"
                />
                {errors.fat && <span className="goal-error">{errors.fat}</span>}
              </div>
            </div>

            <div className="goals-preview">
              <h4 className="preview-title">Daily Macro Split</h4>
              <div className="preview-bar">
                <div
                  className="preview-segment protein"
                  style={{
                    width: `${Math.round(
                      ((formData.goals.protein * 4) /
                        (formData.goals.protein * 4 +
                          formData.goals.carbs * 4 +
                          formData.goals.fat * 9)) *
                        100
                    )}%`,
                  }}
                />
                <div
                  className="preview-segment carbs"
                  style={{
                    width: `${Math.round(
                      ((formData.goals.carbs * 4) /
                        (formData.goals.protein * 4 +
                          formData.goals.carbs * 4 +
                          formData.goals.fat * 9)) *
                        100
                    )}%`,
                  }}
                />
                <div
                  className="preview-segment fat"
                  style={{
                    width: `${Math.round(
                      ((formData.goals.fat * 9) /
                        (formData.goals.protein * 4 +
                          formData.goals.carbs * 4 +
                          formData.goals.fat * 9)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="preview-legend">
                <span className="legend-item">
                  <span className="legend-color protein" />
                  Protein ({Math.round(((formData.goals.protein * 4) / formData.goals.calories) * 100)}%)
                </span>
                <span className="legend-item">
                  <span className="legend-color carbs" />
                  Carbs ({Math.round(((formData.goals.carbs * 4) / formData.goals.calories) * 100)}%)
                </span>
                <span className="legend-item">
                  <span className="legend-color fat" />
                  Fat ({Math.round(((formData.goals.fat * 9) / formData.goals.calories) * 100)}%)
                </span>
              </div>
            </div>

            <div className="goals-form" style={{ marginTop: "1.5rem" }}>
              <div className="filter-section">
                <h4 className="filter-section-title">Dietary Preferences</h4>
                <div className="filter-chips">
                  {DIETARY_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          dietaryFlags: prev.dietaryFlags.includes(option)
                            ? prev.dietaryFlags.filter((f) => f !== option)
                            : [...prev.dietaryFlags, option],
                        }))
                      }
                      className={`filter-chip dietary ${
                        formData.dietaryFlags.includes(option) ? "selected" : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-section">
                <h4 className="filter-section-title">Exclude Allergens</h4>
                <div className="filter-chips">
                  {ALLERGEN_OPTIONS.map((option) => (
                    <button
                      key={option}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          allergens: prev.allergens.includes(option)
                            ? prev.allergens.filter((a) => a !== option)
                            : [...prev.allergens, option],
                        }))
                      }
                      className={`filter-chip allergen ${
                        formData.allergens.includes(option) ? "selected" : ""
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="goal-input-group">
                <div className="goal-input-header">
                  <label className="goal-label">Avoid Ingredients</label>
                  <span className="goal-unit">comma-separated</span>
                </div>
                <input
                  type="text"
                  className="goal-input"
                  value={excludedText}
                  onChange={(e) => setExcludedText(e.target.value)}
                  placeholder="e.g., pork, peanuts"
                />
              </div>

              <div className="goal-input-group">
                <div className="goal-input-header">
                  <label className="goal-label">Prefer Ingredients</label>
                  <span className="goal-unit">comma-separated</span>
                </div>
                <input
                  type="text"
                  className="goal-input"
                  value={preferredText}
                  onChange={(e) => setPreferredText(e.target.value)}
                  placeholder="e.g., chicken, quinoa"
                />
              </div>

              <div className="goal-input-group">
                <div className="goal-input-header">
                  <label className="goal-label">Preferred Cuisines</label>
                  <span className="goal-unit">comma-separated</span>
                </div>
                <input
                  type="text"
                  className="goal-input"
                  value={cuisinesText}
                  onChange={(e) => setCuisinesText(e.target.value)}
                  placeholder="e.g., Mediterranean, Indian"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={handleReset}>
              Reset Goals
            </button>
            <div className="footer-actions">
              <button className="btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSubmit}>
                Save Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
