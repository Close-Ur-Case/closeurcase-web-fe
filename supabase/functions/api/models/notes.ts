import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { cases } from "./cases.ts";

export const caseNotes = pgTable("case_notes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  caseId: varchar("case_id", { length: 128 }).notNull().references(() => cases.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  author: varchar("author", { length: 128 }).default("You").notNull(),
  createdAt: varchar("created_at", { length: 64 }).notNull(),
  dbCreatedAt: timestamp("db_created_at").defaultNow().notNull(),
});
