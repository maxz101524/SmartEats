"use client";

import { useState, useEffect } from "react";
import { useUserPreferences, DEFAULT_GOALS, type DailyGoals } from "@/contexts";

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoalsModal({ isOpen, onClose }: GoalsModalProps) {
  const { goals, updateGoals, resetGoals } = useUserPreferences();
  const [formData, setFormData] = useState<DailyGoals>(goals);
  const [errors, setErrors] = useState<Partial<Record<keyof DailyGoals, string>>>({});

  // Sync form data with goals when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(goals);
      setErrors({});
    }
  }, [isOpen, goals]);

  const validateField = (field: keyof DailyGoals, value: number): string | undefined => {
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
    setFormData((prev) => ({ ...prev, [field]: numValue }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = () => {
    // Validate all fields
    const newErrors: Partial<Record<keyof DailyGoals, string>> = {};
    let hasErrors = false;

    (Object.keys(formData) as (keyof DailyGoals)[]).forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    updateGoals(formData);
    onClose();
  };

  const handleReset = () => {
    setFormData(DEFAULT_GOALS);
    setErrors({});
    resetGoals();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="modal-container">
        <div className="modal-content">
          {/* Header */}
          <div className="modal-header">
            <div className="modal-title-row">
              <div className="modal-icon">🎯</div>
              <div>
                <h2 className="modal-title">My Daily Goals</h2>
                <p className="modal-subtitle">Set your personal nutrition targets</p>
              </div>
            </div>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <div className="modal-body">
            <div className="goals-form">
              {/* Calories */}
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
                  value={formData.calories || ""}
                  onChange={(e) => handleChange("calories", e.target.value)}
                  placeholder="2000"
                  min="500"
                  max="10000"
                />
                {errors.calories && <span className="goal-error">{errors.calories}</span>}
              </div>

              {/* Protein */}
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
                  value={formData.protein || ""}
                  onChange={(e) => handleChange("protein", e.target.value)}
                  placeholder="150"
                  min="10"
                  max="500"
                />
                {errors.protein && <span className="goal-error">{errors.protein}</span>}
              </div>

              {/* Carbs */}
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
                  value={formData.carbs || ""}
                  onChange={(e) => handleChange("carbs", e.target.value)}
                  placeholder="250"
                  min="20"
                  max="800"
                />
                {errors.carbs && <span className="goal-error">{errors.carbs}</span>}
              </div>

              {/* Fat */}
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
                  value={formData.fat || ""}
                  onChange={(e) => handleChange("fat", e.target.value)}
                  placeholder="65"
                  min="10"
                  max="400"
                />
                {errors.fat && <span className="goal-error">{errors.fat}</span>}
              </div>
            </div>

            {/* Macro breakdown preview */}
            <div className="goals-preview">
              <h4 className="preview-title">Daily Macro Split</h4>
              <div className="preview-bar">
                <div
                  className="preview-segment protein"
                  style={{
                    width: `${Math.round(
                      ((formData.protein * 4) /
                        (formData.protein * 4 + formData.carbs * 4 + formData.fat * 9)) *
                        100
                    )}%`,
                  }}
                />
                <div
                  className="preview-segment carbs"
                  style={{
                    width: `${Math.round(
                      ((formData.carbs * 4) /
                        (formData.protein * 4 + formData.carbs * 4 + formData.fat * 9)) *
                        100
                    )}%`,
                  }}
                />
                <div
                  className="preview-segment fat"
                  style={{
                    width: `${Math.round(
                      ((formData.fat * 9) /
                        (formData.protein * 4 + formData.carbs * 4 + formData.fat * 9)) *
                        100
                    )}%`,
                  }}
                />
              </div>
              <div className="preview-legend">
                <span className="legend-item">
                  <span className="legend-color protein" />
                  Protein ({Math.round(((formData.protein * 4) / formData.calories) * 100)}%)
                </span>
                <span className="legend-item">
                  <span className="legend-color carbs" />
                  Carbs ({Math.round(((formData.carbs * 4) / formData.calories) * 100)}%)
                </span>
                <span className="legend-item">
                  <span className="legend-color fat" />
                  Fat ({Math.round(((formData.fat * 9) / formData.calories) * 100)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button className="btn-secondary" onClick={handleReset}>
              Reset to Defaults
            </button>
            <div className="footer-actions">
              <button className="btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSubmit}>
                Save Goals
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

