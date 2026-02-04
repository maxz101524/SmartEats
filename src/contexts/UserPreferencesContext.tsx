"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

// Types for daily nutrition goals
export interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface UserProfile {
  goals: DailyGoals;
  dietaryFlags: string[];
  allergens: string[];
  excludedIngredients: string[];
  preferredIngredients: string[];
  preferredCuisines: string[];
  notes: string;
}

interface UserPreferencesContextType {
  goals: DailyGoals;
  profile: UserProfile;
  updateGoals: (goals: Partial<DailyGoals>) => void;
  resetGoals: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  isLoaded: boolean;
}

// Default daily goals
const DEFAULT_GOALS: DailyGoals = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
};

const DEFAULT_PROFILE: UserProfile = {
  goals: DEFAULT_GOALS,
  dietaryFlags: [],
  allergens: [],
  excludedIngredients: [],
  preferredIngredients: [],
  preferredCuisines: [],
  notes: "",
};

const STORAGE_KEY = "smarteats-user-profile";

const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(
  undefined
);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserProfile>;
        setProfile({
          goals: {
            calories: parsed.goals?.calories ?? DEFAULT_GOALS.calories,
            protein: parsed.goals?.protein ?? DEFAULT_GOALS.protein,
            carbs: parsed.goals?.carbs ?? DEFAULT_GOALS.carbs,
            fat: parsed.goals?.fat ?? DEFAULT_GOALS.fat,
          },
          dietaryFlags: parsed.dietaryFlags ?? [],
          allergens: parsed.allergens ?? [],
          excludedIngredients: parsed.excludedIngredients ?? [],
          preferredIngredients: parsed.preferredIngredients ?? [],
          preferredCuisines: parsed.preferredCuisines ?? [],
          notes: parsed.notes ?? "",
        });
      }
    } catch (error) {
      console.warn("Failed to load profile from localStorage:", error);
    }
  }, []);

  // Load profile from API if signed in, otherwise from localStorage
  useEffect(() => {
    const load = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch("/api/profile");
          const data = await res.json();
          if (data?.profile) {
            setProfile({
              goals: {
                calories: data.profile.dailyCalories ?? DEFAULT_GOALS.calories,
                protein: data.profile.dailyProtein ?? DEFAULT_GOALS.protein,
                carbs: data.profile.dailyCarbs ?? DEFAULT_GOALS.carbs,
                fat: data.profile.dailyFat ?? DEFAULT_GOALS.fat,
              },
              dietaryFlags: data.profile.dietaryFlags ?? [],
              allergens: data.profile.allergens ?? [],
              excludedIngredients: data.profile.excludedIngredients ?? [],
              preferredIngredients: data.profile.preferredIngredients ?? [],
              preferredCuisines: data.profile.preferredCuisines ?? [],
              notes: data.profile.notes ?? "",
            });
          } else {
            loadFromStorage();
          }
        } catch {
          loadFromStorage();
        }
      } else {
        loadFromStorage();
      }
      setIsLoaded(true);
    };

    load();
  }, [session?.user?.id, loadFromStorage]);

  const updateGoals = useCallback((newGoals: Partial<DailyGoals>) => {
    setProfile((prev) => ({
      ...prev,
      goals: {
        ...prev.goals,
        ...newGoals,
      },
    }));
  }, []);

  const resetGoals = useCallback(() => {
    setProfile((prev) => ({
      ...prev,
      goals: DEFAULT_GOALS,
    }));
  }, []);

  const updateProfile = useCallback(
    (updates: Partial<UserProfile>) => {
      setProfile((prev) => {
        const next = {
          ...prev,
          ...updates,
          goals: {
            ...prev.goals,
            ...(updates.goals ?? {}),
          },
        };

        if (session?.user?.id) {
          fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dailyCalories: next.goals.calories,
              dailyProtein: next.goals.protein,
              dailyCarbs: next.goals.carbs,
              dailyFat: next.goals.fat,
              dietaryFlags: next.dietaryFlags,
              allergens: next.allergens,
              excludedIngredients: next.excludedIngredients,
              preferredIngredients: next.preferredIngredients,
              preferredCuisines: next.preferredCuisines,
              notes: next.notes,
            }),
          }).catch(() => undefined);
        } else if (isLoaded) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch (error) {
            console.warn("Failed to save profile to localStorage:", error);
          }
        }

        return next;
      });
    },
    [session?.user?.id, isLoaded]
  );

  return (
    <UserPreferencesContext.Provider
      value={{
        goals: profile.goals,
        profile,
        updateGoals,
        resetGoals,
        updateProfile,
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
