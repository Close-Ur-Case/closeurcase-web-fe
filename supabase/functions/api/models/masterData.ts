import { pgTable, text, timestamp, varchar, boolean, jsonb, integer, numeric } from "drizzle-orm/pg-core";

export interface CaseServiceItem {
  id: string;
  name: string;
}

export interface CaseSubCategoryItem {
  id: string;
  name: string;
  services: (string | CaseServiceItem)[];
}

export const caseCategories = pgTable("case_categories", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 32 }).notNull(),
  description: text("description").default(""),
  subCategories: jsonb("sub_categories").$type<CaseSubCategoryItem[]>().default([]),
  active: boolean("active").default(true).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const caseSpecializations = pgTable("case_specializations", {
  id: varchar("id", { length: 64 }).primaryKey(),
  categoryId: varchar("category_id", { length: 64 })
    .notNull()
    .references(() => caseCategories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const legalServices = pgTable("legal_services", {
  id: varchar("id", { length: 64 }).primaryKey(),
  specializationId: varchar("specialization_id", { length: 64 })
    .notNull()
    .references(() => caseSpecializations.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id", { length: 64 })
    .notNull()
    .references(() => caseCategories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  estimatedDays: integer("estimated_days").default(7),
  baseFee: numeric("base_fee", { precision: 10, scale: 2 }).default("0"),
  requiredDocuments: jsonb("required_documents").$type<string[]>().default([]),
  displayOrder: integer("display_order").default(0),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const states = pgTable("states", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  code: varchar("code", { length: 16 }).notNull(),
  active: boolean("active").default(true).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const districts = pgTable("districts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  state: varchar("state", { length: 128 }).notNull(),
  stateId: varchar("state_id", { length: 64 }).references(() => states.id, { onDelete: "cascade" }),
  active: boolean("active").default(true).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const cities = pgTable("cities", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  state: varchar("state", { length: 128 }).notNull(),
  stateId: varchar("state_id", { length: 64 }).references(() => states.id, { onDelete: "set null" }),
  districtId: varchar("district_id", { length: 64 }).references(() => districts.id, { onDelete: "set null" }),
  tier: varchar("tier", { length: 32 }).default("Tier 1"),
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

export const courts = pgTable("courts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name").notNull(),
  level: varchar("level", { length: 64 }).references(() => courtLevels.id, { onDelete: "set null" }).notNull(),
  state: varchar("state", { length: 128 }).notNull(),
  city: varchar("city", { length: 128 }),
  district: varchar("district", { length: 128 }),
  stateId: varchar("state_id", { length: 64 }).references(() => states.id, { onDelete: "set null" }),
  districtId: varchar("district_id", { length: 64 }).references(() => districts.id, { onDelete: "set null" }),
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

