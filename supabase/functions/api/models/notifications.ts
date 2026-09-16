import { pgTable, text, timestamp, varchar, boolean } from "drizzle-orm/pg-core";

export const appNotifications = pgTable("app_notifications", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }),
  role: varchar("role", { length: 32 }).default("all"),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  at: varchar("at", { length: 64 }).notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fcmTokens = pgTable("fcm_tokens", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  deviceToken: text("device_token").notNull(),
  deviceType: varchar("device_type", { length: 32 }).default("web"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
