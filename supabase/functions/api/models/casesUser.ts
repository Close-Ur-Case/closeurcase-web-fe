import { pgTable, varchar, timestamp, text, boolean, jsonb } from "drizzle-orm/pg-core";
import { citizens, lawyers } from "./users.ts";
import { casesImported } from "./casesImported.ts";
import { lookups } from "./lookups.ts";

export { lookups };

export interface UserCaseDocument {
  id?: string;
  name: string;
  fileUrl: string;
  size?: string;
  fileMimeType?: string;
  uploadedAt?: string;
}

export interface UserCaseTimelineEvent {
  id: string;
  status: string;
  at: string;
  time?: string;
  note: string;
}

export interface UserCaseNote {
  id: string;
  caseId?: string;
  text: string;
  author: string;
  createdAt: string;
}

export const casesUser = pgTable("cases_user", {
  id: varchar("id", { length: 128 }).primaryKey(),
  citizenId: varchar("citizen_id", { length: 64 }).notNull().references(() => citizens.id, { onDelete: "cascade" }),
  lawyerId: varchar("lawyer_id", { length: 64 }).references(() => lawyers.id, { onDelete: "set null" }),
  caseType: varchar("case_type", { length: 32 }).notNull().references(() => lookups.id),
  cnr: varchar("cnr", { length: 32 }).references(() => casesImported.cnr, { onDelete: "set null" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  documents: jsonb("documents").$type<UserCaseDocument[]>().notNull().default([]),
  practiceArea: varchar("practice_area", { length: 128 }).notNull(),
  specialization: varchar("specialization", { length: 128 }).notNull(),
  legalServices: jsonb("legal_services").$type<string[]>().notNull().default([]),
  caseStatus: varchar("case_status", { length: 64 }).default("submitted").notNull(),
  lawyerCasestageId: varchar("lawyer_casestage_id", { length: 64 }).default("submitted").notNull().references(() => lookups.id),
  rejectionReason: text("rejection_reason"),
  isEmergency: boolean("is_emergency").default(false),
  timeline: jsonb("timeline").$type<UserCaseTimelineEvent[]>().notNull().default([]),
  notes: jsonb("notes").$type<UserCaseNote[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserCase = typeof casesUser.$inferSelect;
export type NewUserCase = typeof casesUser.$inferInsert;

export type CaseUser = typeof casesUser.$inferSelect;
export type NewCaseUser = typeof casesUser.$inferInsert;
