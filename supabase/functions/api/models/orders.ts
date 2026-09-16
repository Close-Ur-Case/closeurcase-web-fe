import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { cases } from "./cases.ts";

export const caseOrders = pgTable("case_orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  caseId: varchar("case_id", { length: 128 }).notNull().references(() => cases.id, { onDelete: "cascade" }),
  orderDate: varchar("order_date", { length: 32 }).notNull(),
  orderType: varchar("order_type", { length: 64 }).default("INTERIM").notNull(),
  description: text("description"),
  orderUrl: text("order_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
