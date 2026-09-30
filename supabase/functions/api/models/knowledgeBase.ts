import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { caseCategories } from "./masterData.ts";

export const knowledgeItems = pgTable("knowledge_items", {
  id: varchar("id", { length: 64 }).primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 })
    .notNull()
    .references(() => caseCategories.id, { onDelete: "cascade" }),
  size: varchar("size", { length: 64 }).notNull(),
  fileUrl: text("file_url"),
  fileName: varchar("file_name", { length: 255 }),
  fileMimeType: varchar("file_mime_type", { length: 128 }),
  scope: varchar("scope", { length: 32 }).notNull().default("global"),
  uploadedBy: varchar("uploaded_by", { length: 128 }),
  lawyerId: varchar("lawyer_id", { length: 64 }),
  uploadedAt: varchar("uploaded_at", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
