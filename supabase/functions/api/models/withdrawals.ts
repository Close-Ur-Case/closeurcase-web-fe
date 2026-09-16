import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { lawyers } from "./users.ts";

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id", { length: 64 }).primaryKey(),
  lawyerId: varchar("lawyer_id", { length: 64 }).notNull().references(() => lawyers.id, { onDelete: "cascade" }),
  lawyerName: varchar("lawyer_name", { length: 255 }).notNull(),
  amount: integer("amount").notNull(),
  requestedAt: varchar("requested_at", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).default("Pending").notNull(),
  bankName: varchar("bank_name", { length: 128 }).notNull(),
  accountNumber: varchar("account_number", { length: 64 }).notNull(),
  ifscCode: varchar("ifsc_code", { length: 32 }).notNull(),
  processedAt: varchar("processed_at", { length: 32 }),
  referenceId: varchar("reference_id", { length: 128 }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
