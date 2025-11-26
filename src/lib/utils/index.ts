import { type ClassValue, clsx } from "clsx";

// Simple class merging utility (no tailwind-merge needed for basic use)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Format date for display
export function formatDate(date: Date | string): string {
  // Add T12:00:00 to avoid timezone issues when parsing ISO date strings
  const d = typeof date === "string" ? new Date(date + "T12:00:00") : date;
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Format date for API/database (YYYY-MM-DD) - uses local timezone
export function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today's date in ISO format
export function getTodayISO(): string {
  return formatDateISO(new Date());
}

// Parse meal period from time
export function getMealPeriodFromTime(hour: number): string {
  if (hour < 10) return "breakfast";
  if (hour < 14) return "lunch";
  return "dinner";
}

// Meal period display names
export const mealPeriodLabels: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  brunch: "Brunch",
  "light lunch": "Light Lunch",
};

// Format number with unit
export function formatNutrient(value: number | string | null, unit: string): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return `${Math.round(num)}${unit}`;
}

// Calculate daily value percentage
export function calculateDV(value: number, dailyValue: number): number {
  return Math.round((value / dailyValue) * 100);
}

// Daily values for common nutrients (FDA reference)
export const dailyValues = {
  calories: 2000,
  protein: 50, // g
  carbs: 275, // g
  fat: 78, // g
  fiber: 28, // g
  sugar: 50, // g
  sodium: 2300, // mg
  vitaminA: 900, // mcg
  vitaminC: 90, // mg
  vitaminD: 20, // mcg
  calcium: 1300, // mg
  iron: 18, // mg
  potassium: 4700, // mg
};

// Slugify a string
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

