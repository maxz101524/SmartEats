"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// Types for daily nutrition goals
export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface UserPreferencesContextType {
  goals: DailyGoals;
  updateGoals: (goals: Partial<DailyGoals>) => void;
  resetGoals: () => void;
  isLoaded: boolean;
}

// Default daily goals
const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

const STORAGE_KEY = "smarteats-user-goals";

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(
  undefined
);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [goals, setGoals] = useState<DailyGoals>(DEFAULT_GOALS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load goals from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<DailyGoals>;
        setGoals({
          calories: parsed.calories ?? DEFAULT_GOALS.calories,
          protein: parsed.protein ?? DEFAULT_GOALS.protein,
          carbs: parsed.carbs ?? DEFAULT_GOALS.carbs,
          fat: parsed.fat ?? DEFAULT_GOALS.fat,
        });
      }
    } catch (error) {
      console.warn("Failed to load user goals from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save goals to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
      } catch (error) {
        console.warn("Failed to save user goals to localStorage:", error);
      }
    }
  }, [goals, isLoaded]);

  const updateGoals = useCallback((newGoals: Partial<DailyGoals>) => {
    setGoals((prev) => ({
      ...prev,
      ...newGoals,
    }));
  }, []);

  const resetGoals = useCallback(() => {
    setGoals(DEFAULT_GOALS);
  }, []);

  return (
    <UserPreferencesContext.Provider
      value={{
        goals,
        updateGoals,
        resetGoals,
        isLoaded,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences(): UserPreferencesContextType {
  const context = useContext(UserPreferencesContext);
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    );
  }
  return context;
}

// Export default goals for reference
export { DEFAULT_GOALS };

