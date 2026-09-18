import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { citizens } from "./users.ts";
import { casesUser } from "./casesUser.ts";

export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id", { length: 32 }).primaryKey(),
  label: varchar("label", { length: 128 }).notNull(),
  price: integer("price").notNull(),
  cadence: varchar("cadence", { length: 32 }).notNull(),
  badge: varchar("badge", { length: 64 }),
  audience: varchar("audience", { length: 255 }).notNull(),
  description: text("description").notNull(),
  features: text("features").array(),
  active: varchar("active", { length: 16 }).default("true"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  citizenId: varchar("citizen_id", { length: 64 }).notNull().references(() => citizens.id, { onDelete: "cascade" }),
  planId: varchar("plan_id", { length: 32 }).notNull(),
  planLabel: varchar("plan_label", { length: 128 }).notNull(),
  amount: integer("amount").notNull(),
  startedAt: varchar("started_at", { length: 32 }).notNull(),
  expiresAt: varchar("expires_at", { length: 64 }),
  status: varchar("status", { length: 32 }).default("Active").notNull(),
  caseId: varchar("case_id", { length: 128 }).references(() => casesUser.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
