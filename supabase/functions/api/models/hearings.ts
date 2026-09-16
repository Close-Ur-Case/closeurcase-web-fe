import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { cases } from "./cases.ts";

export const caseHearings = pgTable("case_hearings", {
  id: varchar("id", { length: 64 }).primaryKey(),
  caseId: varchar("case_id", { length: 128 }).notNull().references(() => cases.id, { onDelete: "cascade" }),
  judge: text("judge").default(""),
  businessOnDate: varchar("business_on_date", { length: 32 }).notNull(),
  hearingDate: varchar("hearing_date", { length: 32 }),
  time: varchar("time", { length: 32 }),
  purposeOfListing: text("purpose_of_listing").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
