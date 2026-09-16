import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { lawyers, citizens } from "./users.ts";
import { cases } from "./cases.ts";

export const lawyerRatings = pgTable("lawyer_ratings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  lawyerId: varchar("lawyer_id", { length: 64 }).notNull().references(() => lawyers.id, { onDelete: "cascade" }),
  caseId: varchar("case_id", { length: 128 }).notNull().references(() => cases.id, { onDelete: "cascade" }),
  citizenId: varchar("citizen_id", { length: 64 }).references(() => citizens.id, { onDelete: "set null" }),
  citizenName: varchar("citizen_name", { length: 255 }).notNull(),
  rating: integer("rating").notNull(),
  review: text("review").default(""),
  createdAt: varchar("created_at", { length: 64 }).notNull(),
  dbCreatedAt: timestamp("db_created_at").defaultNow().notNull(),
});
