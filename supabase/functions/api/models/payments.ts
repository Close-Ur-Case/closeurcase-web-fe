import { pgTable, text, timestamp, varchar, integer } from "drizzle-orm/pg-core";
import { citizens, lawyers } from "./users.ts";
import { casesUser } from "./casesUser.ts";

export const payments = pgTable("payments", {
  id: varchar("id", { length: 64 }).primaryKey(),
  source: varchar("source", { length: 32 }).notNull(),
  date: varchar("date", { length: 32 }).notNull(),
  status: varchar("status", { length: 32 }).default("Completed").notNull(),
  citizenId: varchar("citizen_id", { length: 64 }).references(() => citizens.id, { onDelete: "set null" }),
  citizenName: varchar("citizen_name", { length: 255 }),
  lawyerId: varchar("lawyer_id", { length: 64 }).references(() => lawyers.id, { onDelete: "set null" }),
  lawyerName: varchar("lawyer_name", { length: 255 }),
  caseId: varchar("case_id", { length: 128 }).references(() => casesUser.id, { onDelete: "set null" }),
  caseTitle: text("case_title"),
  grossAmount: integer("gross_amount").notNull(),
  platformAmount: integer("platform_amount").default(0).notNull(),
  lawyerAmount: integer("lawyer_amount").default(0).notNull(),

  razorpayOrderId: varchar("razorpay_order_id", { length: 128 }),
  razorpayPaymentId: varchar("razorpay_payment_id", { length: 128 }),
  razorpaySignature: varchar("razorpay_signature", { length: 255 }),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
