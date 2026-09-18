import { pgTable, text, timestamp, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { casesUser } from "./casesUser.ts";

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id", { length: 64 }).primaryKey(),
  caseId: varchar("case_id", { length: 128 }).notNull().references(() => casesUser.id, { onDelete: "cascade" }),
  sender: varchar("sender", { length: 32 }).notNull(), // 'citizen' | 'lawyer'
  senderName: varchar("sender_name", { length: 255 }).notNull(),
  text: text("text"),
  attachmentType: varchar("attachment_type", { length: 32 }), // 'image' | 'file' | 'audio'
  attachmentName: varchar("attachment_name", { length: 255 }),
  attachmentUrl: text("attachment_url"),
  attachmentSize: varchar("attachment_size", { length: 64 }),
  audioDuration: integer("audio_duration"),
  read: boolean("read").default(false).notNull(),
  at: varchar("at", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
