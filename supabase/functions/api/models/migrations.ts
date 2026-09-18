import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const migrations = pgTable("_migrations", {
  id: varchar("id", { length: 255 }).primaryKey(),
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow().notNull(),
  errorMessage: text("error_message"),
});

export type Migration = typeof migrations.$inferSelect;
export type NewMigration = typeof migrations.$inferInsert;
