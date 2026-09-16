import { pgTable, text, timestamp, varchar, boolean, jsonb } from "drizzle-orm/pg-core";
import { citizens, lawyers } from "./users.ts";

export const cases = pgTable("cases", {
  id: varchar("id", { length: 128 }).primaryKey(),
  cnr: varchar("cnr", { length: 32 }).unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  citizenId: varchar("citizen_id", { length: 64 }).references(() => citizens.id, { onDelete: "set null" }),
  citizenName: varchar("citizen_name", { length: 255 }).notNull(),
  lawyerId: varchar("lawyer_id", { length: 64 }).references(() => lawyers.id, { onDelete: "set null" }),
  lawyerName: varchar("lawyer_name", { length: 255 }),
  status: varchar("status", { length: 64 }).default("Pending").notNull(),
  city: varchar("city", { length: 128 }).notNull(),
  source: varchar("source", { length: 32 }).default("manual"),
  isEmergency: boolean("is_emergency").default(false),
  emergencyReason: text("emergency_reason"),
  viaWhatsApp: boolean("via_whatsapp").default(false),
  practiceArea: varchar("practice_area", { length: 255 }),
  specialization: varchar("specialization", { length: 255 }),
  legalService: varchar("legal_service", { length: 255 }),

  caseDetails: jsonb("case_details").$type<Record<string, any>>().default({}),
  entityInfo: jsonb("entity_info").$type<Record<string, any>>().default({}),
  files: jsonb("files").$type<{ files: any[] }>().default({ files: [] }),
  descriptions: jsonb("descriptions").$type<Record<string, any>>().default({ enumFields: [], enumLookup: {} }),
  caseAiAnalysis: jsonb("case_ai_analysis").$type<any>().default(null),
  timeline: jsonb("timeline").$type<any[]>().default([]),

  createdAt: varchar("created_at", { length: 64 }).notNull(),
  updatedAt: varchar("updated_at", { length: 64 }).notNull(),
  dbCreatedAt: timestamp("db_created_at").defaultNow().notNull(),
  dbUpdatedAt: timestamp("db_updated_at").defaultNow().notNull(),
});
