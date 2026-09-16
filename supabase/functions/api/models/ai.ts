import { pgTable, text, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";
import { cases } from "./cases.ts";

export const aiCaseAnalyses = pgTable("ai_case_analyses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  caseId: varchar("case_id", { length: 128 }).notNull().references(() => cases.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 64 }).notNull(), // 'counter_argument' | 'case_qa' | 'summary'
  inputPrompt: text("input_prompt").notNull(),
  responseContent: jsonb("response_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
