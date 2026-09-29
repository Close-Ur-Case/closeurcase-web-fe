import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { casesUser } from "./casesUser.ts";

export const caseDocuments = pgTable("case_documents", {
  id: varchar("id", { length: 128 }).primaryKey(),
  caseId: varchar("case_id", { length: 128 })
    .notNull()
    .references(() => casesUser.id, { onDelete: "cascade" }),
  uploaderId: varchar("uploader_id", { length: 64 }),
  uploadedBy: varchar("uploaded_by", { length: 32 }).default("citizen").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  size: varchar("size", { length: 64 }),
  fileMimeType: varchar("file_mime_type", { length: 128 }),
  uploadedAt: varchar("uploaded_at", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CaseDocumentRecord = typeof caseDocuments.$inferSelect;
export type NewCaseDocumentRecord = typeof caseDocuments.$inferInsert;
