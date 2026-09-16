import { pgTable, text, timestamp, varchar, boolean, jsonb } from "drizzle-orm/pg-core";

export const caseCategories = pgTable("case_categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  description: text("description").default(""),
  subCategories: jsonb("sub_categories").$type<any[]>().default([]),
  active: boolean("active").default(true).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cities = pgTable("cities", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  state: varchar("state", { length: 128 }).notNull(),
  tier: varchar("tier", { length: 32 }).default("Tier 1"),
  active: boolean("active").default(true).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const districts = pgTable("districts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  state: varchar("state", { length: 128 }).notNull(),
  active: boolean("active").default(true).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courts = pgTable("courts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  level: varchar("level", { length: 64 }).notNull(),
  state: varchar("state", { length: 128 }).notNull(),
  city: varchar("city", { length: 128 }),
  district: varchar("district", { length: 128 }),
  active: boolean("active").default(true).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const states = pgTable("states", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  districts: jsonb("districts").$type<string[]>().default([]),
  active: boolean("active").default(true).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courtLevels = pgTable("court_levels", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  active: boolean("active").default(true).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const languages = pgTable("languages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  nativeName: varchar("native_name", { length: 128 }).notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  active: boolean("active").default(true).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
