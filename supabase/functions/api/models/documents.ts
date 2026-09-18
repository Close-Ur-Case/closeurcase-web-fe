import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { lawyers } from "./users.ts";

export const lawyerDocuments = pgTable("lawyer_documents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  lawyerId: varchar("lawyer_id", { length: 64 }).notNull().references(() => lawyers.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  size: varchar("size", { length: 64 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }),
  fileMimeType: varchar("file_mime_type", { length: 128 }),
  uploadedAt: varchar("uploaded_at", { length: 64 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
