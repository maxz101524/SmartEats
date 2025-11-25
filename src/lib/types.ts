// Scraped menu data types
export interface ScrapedMenuItem {
  name: string;
  category?: string;
  course?: string;
  servingUnit?: string;
  traits?: string[];
}

export interface ScrapedMealPeriod {
  mealPeriod: string;
  items: ScrapedMenuItem[];
}

export interface ScrapedDayMenu {
  date: string;
  diningHall: string;
  meals: ScrapedMealPeriod[];
}

// LLM nutrition response types
export interface NutritionEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  servingSize: string;
  vitamins: {
    vitamin_a?: number;
    vitamin_c?: number;
    vitamin_d?: number;
    vitamin_b12?: number;
    vitamin_e?: number;
  };
  minerals: {
    calcium?: number;
    iron?: number;
    potassium?: number;
    zinc?: number;
    magnesium?: number;
  };
  allergens: string[];
  dietaryFlags: string[];
  confidence: "high" | "medium" | "low";
}

export interface NutritionBatchResponse {
  items: {
    name: string;
    nutrition: NutritionEstimate;
  }[];
}

// API response types
export interface MenuResponse {
  success: boolean;
  data?: {
    diningHall: {
      id: number;
      name: string;
      slug: string;
    };
    date: string;
    meals: Record<string, MenuItemWithNutrition[]>;
  };
  error?: string;
}

export interface MenuItemWithNutrition {
  id: number;
  name: string;
  category: string | null;
  course: string | null;
  nutrition: {
    calories: number | null;
    protein: number | null;
    carbs: number | null;
    fat: number | null;
    fiber: number | null;
    sugar: number | null;
    sodium: number | null;
    servingSize: string | null;
    vitamins: Record<string, number> | null;
    minerals: Record<string, number> | null;
    allergens: string[] | null;
    dietaryFlags: string[] | null;
  } | null;
}

// UI types
export interface MealPlanItem {
  itemId: number;
  name: string;
  quantity: number;
  nutrition: MenuItemWithNutrition["nutrition"];
}

export interface FilterOptions {
  searchQuery: string;
  maxCalories?: number;
  minProtein?: number;
  dietaryFlags: string[];
  excludeAllergens: string[];
}

