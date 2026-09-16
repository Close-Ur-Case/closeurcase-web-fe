import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const contactInquiries = pgTable("contact_inquiries", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  category: varchar("category", { length: 64 }).default("general").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 32 }).default("New").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
