import { pgTable, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";

export const casesImported = pgTable("cases_imported", {
  cnr: varchar("cnr", { length: 32 }).primaryKey(),
  caseDetails: jsonb("case_details").$type<Record<string, any>>().notNull().default({}),
  entityInfo: jsonb("entity_info").$type<Record<string, any>>().notNull().default({}),
  files: jsonb("files").$type<{ files: any[] }>().notNull().default({ files: [] }),
  descriptions: jsonb("descriptions").$type<{ enumFields: string[]; enumLookup: Record<string, Record<string, string>> }>().notNull().default({ enumFields: [], enumLookup: {} }),
  caseAiAnalysis: jsonb("case_ai_analysis").$type<Record<string, any> | null>(),
  rawData: jsonb("raw_data").$type<Record<string, any>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CaseImported = typeof casesImported.$inferSelect;
export type NewCaseImported = typeof casesImported.$inferInsert;
