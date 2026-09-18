import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";

/**
 * Centralized Project-Wide Lookup Table
 * Serves lookup options, statuses, types, and stages across all entities in the project.
 */
export const lookups = pgTable("lookups", {
  id: varchar("id", { length: 64 }).primaryKey(), // unique code e.g. 'new', 'pending', 'submitted'
  category: varchar("category", { length: 64 }).notNull(), // e.g. 'case_type', 'lawyer_casestage'
  label: varchar("label", { length: 128 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Lookup = typeof lookups.$inferSelect;
export type NewLookup = typeof lookups.$inferInsert;
