// UIUC Dining API Configuration
export const DINING_API_BASE = "https://web.housing.illinois.edu/DiningMenus/api/DiningMenu";

// Dining hall option IDs (discovered from the website dropdown)
// The API uses a single DiningOptionID per location
export const DINING_HALLS = {
  "ikenberry": {
    name: "Ikenberry Dining Center",
    slug: "ikenberry",
    optionId: 1,
  },
  "par": {
    name: "PAR Dining Hall",
    slug: "par",
    optionId: 2,
  },
  "isr": {
    name: "ISR Dining Center",
    slug: "isr",
    optionId: 3,
  },
  "lincoln-allen": {
    name: "Lincoln/Allen Dining Hall",
    slug: "lincoln-allen",
    optionId: 5,
  },
  "field-of-greens": {
    name: "Field of Greens",
    slug: "field-of-greens",
    optionId: 12,
  },
} as const;

export type DiningHallSlug = keyof typeof DINING_HALLS;

// Meal period mappings
export const MEAL_PERIODS = {
  "breakfast": "Breakfast",
  "lunch": "Lunch",
  "dinner": "Dinner",
  "light lunch": "Light Lunch",
  "brunch": "Brunch",
} as const;

// API response types (actual structure from UIUC API)
export interface DiningMenuApiItem {
  EventDate: string;
  DiningMenuID: number;
  ServingUnit: string;
  Course: string;
  CourseSort: number;
  FormalName: string;
  Meal: string;
  Traits: string;
  DiningOptionID: number;
  ScheduleID: number;
  ItemID: number;
  Category: string;
  EventDateGMT: number;
}

export interface DiningScheduleItem {
  DiningOptionID: number;
  Date: string;
  Day: string;
  TimePeriod: string;
  Start24: string;
  End24: string;
  Start: string;
  End: string;
}

