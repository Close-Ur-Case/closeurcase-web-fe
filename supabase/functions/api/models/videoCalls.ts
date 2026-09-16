import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { cases } from "./cases.ts";

export const videoCalls = pgTable("video_calls", {
  id: varchar("id", { length: 64 }).primaryKey(),
  caseId: varchar("case_id", { length: 128 }).notNull().references(() => cases.id, { onDelete: "cascade" }),
  channelName: varchar("channel_name", { length: 128 }),
  withName: varchar("with_name", { length: 255 }).notNull(),
  callerId: varchar("caller_id", { length: 64 }),
  receiverId: varchar("receiver_id", { length: 64 }),
  at: varchar("at", { length: 64 }).notNull(),
  durationSeconds: integer("duration_seconds"),
  status: varchar("status", { length: 32 }).default("completed").notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
