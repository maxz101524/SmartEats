import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  date,
  jsonb,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Dining halls table
export const diningHalls = pgTable("dining_halls", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Menu items table (cached dish info)
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  servingUnit: varchar("serving_unit", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Daily menus table
export const dailyMenus = pgTable("daily_menus", {
  id: serial("id").primaryKey(),
  diningHallId: integer("dining_hall_id")
    .notNull()
    .references(() => diningHalls.id),
  date: date("date").notNull(),
  mealPeriod: varchar("meal_period", { length: 50 }).notNull(), // breakfast, lunch, dinner
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Junction table for daily menus and menu items
export const menuEntries = pgTable(
  "menu_entries",
  {
    dailyMenuId: integer("daily_menu_id")
      .notNull()
      .references(() => dailyMenus.id, { onDelete: "cascade" }),
    menuItemId: integer("menu_item_id")
      .notNull()
      .references(() => menuItems.id, { onDelete: "cascade" }),
    course: varchar("course", { length: 100 }), // e.g., "Main", "Side", "Dessert"
  },
  (table) => ({
    pk: primaryKey({ columns: [table.dailyMenuId, table.menuItemId] }),
  })
);

// Nutrition information table
export const nutritionInfo = pgTable("nutrition_info", {
  id: serial("id").primaryKey(),
  menuItemId: integer("menu_item_id")
    .notNull()
    .references(() => menuItems.id, { onDelete: "cascade" })
    .unique(),
  calories: integer("calories"),
  protein: decimal("protein", { precision: 6, scale: 2 }), // grams
  carbs: decimal("carbs", { precision: 6, scale: 2 }), // grams
  fat: decimal("fat", { precision: 6, scale: 2 }), // grams
  fiber: decimal("fiber", { precision: 6, scale: 2 }), // grams
  sugar: decimal("sugar", { precision: 6, scale: 2 }), // grams
  sodium: integer("sodium"), // mg
  servingSize: varchar("serving_size", { length: 100 }),
  vitamins: jsonb("vitamins").$type<Record<string, number>>(), // { "vitamin_a": 10, "vitamin_c": 15, ... } percentages
  minerals: jsonb("minerals").$type<Record<string, number>>(), // { "iron": 8, "calcium": 12, ... } percentages
  allergens: jsonb("allergens").$type<string[]>(), // ["gluten", "dairy", "nuts", ...]
  dietaryFlags: jsonb("dietary_flags").$type<string[]>(), // ["vegetarian", "vegan", "halal", ...]
  llmGeneratedAt: timestamp("llm_generated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const diningHallsRelations = relations(diningHalls, ({ many }) => ({
  dailyMenus: many(dailyMenus),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  nutritionInfo: one(nutritionInfo, {
    fields: [menuItems.id],
    references: [nutritionInfo.menuItemId],
  }),
  menuEntries: many(menuEntries),
}));

export const dailyMenusRelations = relations(dailyMenus, ({ one, many }) => ({
  diningHall: one(diningHalls, {
    fields: [dailyMenus.diningHallId],
    references: [diningHalls.id],
  }),
  menuEntries: many(menuEntries),
}));

export const menuEntriesRelations = relations(menuEntries, ({ one }) => ({
  dailyMenu: one(dailyMenus, {
    fields: [menuEntries.dailyMenuId],
    references: [dailyMenus.id],
  }),
  menuItem: one(menuItems, {
    fields: [menuEntries.menuItemId],
    references: [menuItems.id],
  }),
}));

export const nutritionInfoRelations = relations(nutritionInfo, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [nutritionInfo.menuItemId],
    references: [menuItems.id],
  }),
}));

// Types
export type DiningHall = typeof diningHalls.$inferSelect;
export type NewDiningHall = typeof diningHalls.$inferInsert;
export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;
export type DailyMenu = typeof dailyMenus.$inferSelect;
export type NewDailyMenu = typeof dailyMenus.$inferInsert;
export type MenuEntry = typeof menuEntries.$inferSelect;
export type NewMenuEntry = typeof menuEntries.$inferInsert;
export type NutritionInfo = typeof nutritionInfo.$inferSelect;
export type NewNutritionInfo = typeof nutritionInfo.$inferInsert;

