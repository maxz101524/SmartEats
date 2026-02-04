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

// Auth.js tables
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

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

// User profile (preferences + goals)
export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  dailyCalories: integer("daily_calories"),
  dailyProtein: integer("daily_protein"),
  dailyCarbs: integer("daily_carbs"),
  dailyFat: integer("daily_fat"),
  dietaryFlags: jsonb("dietary_flags").$type<string[]>(),
  allergens: jsonb("allergens").$type<string[]>(),
  excludedIngredients: jsonb("excluded_ingredients").$type<string[]>(),
  preferredIngredients: jsonb("preferred_ingredients").$type<string[]>(),
  preferredCuisines: jsonb("preferred_cuisines").$type<string[]>(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Meal history
export const mealLogs = pgTable("meal_logs", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  diningHallId: integer("dining_hall_id").references(() => diningHalls.id),
  date: date("date").notNull(),
  mealPeriod: varchar("meal_period", { length: 50 }).notNull(),
  source: varchar("source", { length: 50 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mealLogItems = pgTable("meal_log_items", {
  id: serial("id").primaryKey(),
  mealLogId: integer("meal_log_id")
    .notNull()
    .references(() => mealLogs.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id").references(() => menuItems.id),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  calories: integer("calories"),
  protein: decimal("protein", { precision: 6, scale: 2 }),
  carbs: decimal("carbs", { precision: 6, scale: 2 }),
  fat: decimal("fat", { precision: 6, scale: 2 }),
  fiber: decimal("fiber", { precision: 6, scale: 2 }),
  sugar: decimal("sugar", { precision: 6, scale: 2 }),
  sodium: integer("sodium"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  accounts: many(accounts),
  sessions: many(sessions),
  mealLogs: many(mealLogs),
}));

export const diningHallsRelations = relations(diningHalls, ({ many }) => ({
  dailyMenus: many(dailyMenus),
  mealLogs: many(mealLogs),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  nutritionInfo: one(nutritionInfo, {
    fields: [menuItems.id],
    references: [nutritionInfo.menuItemId],
  }),
  menuEntries: many(menuEntries),
  mealLogItems: many(mealLogItems),
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

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
}));

export const mealLogsRelations = relations(mealLogs, ({ one, many }) => ({
  user: one(users, {
    fields: [mealLogs.userId],
    references: [users.id],
  }),
  diningHall: one(diningHalls, {
    fields: [mealLogs.diningHallId],
    references: [diningHalls.id],
  }),
  items: many(mealLogItems),
}));

export const mealLogItemsRelations = relations(mealLogItems, ({ one }) => ({
  mealLog: one(mealLogs, {
    fields: [mealLogItems.mealLogId],
    references: [mealLogs.id],
  }),
  menuItem: one(menuItems, {
    fields: [mealLogItems.menuItemId],
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
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type MealLog = typeof mealLogs.$inferSelect;
export type NewMealLog = typeof mealLogs.$inferInsert;
export type MealLogItem = typeof mealLogItems.$inferSelect;
export type NewMealLogItem = typeof mealLogItems.$inferInsert;
