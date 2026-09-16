import type { Context } from "hono";
import { PaymentService } from "../services/paymentService.ts";
import { db } from "../config/db.ts";
import { payments } from "../models/payments.ts";
import { eq, desc } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";

export async function createRazorpayOrder(c: Context) {
  const { amount, currency, receipt, notes } = await c.req.json();
  const order = await PaymentService.createOrder({ amount, currency, receipt, notes });
  return ApiResponse.created(c, order, "Razorpay order created successfully");
}

export async function verifyAndCompletePayment(c: Context) {
  const body = await c.req.json();
  const result = await PaymentService.completePayment(body);
  return ApiResponse.success(c, result, "Payment verified and recorded successfully");
}

export async function getPayments(c: Context) {
  const lawyerId = c.req.query("lawyerId");
  let query = db.select().from(payments);
  if (lawyerId) {
    query = query.where(eq(payments.lawyerId, lawyerId)) as any;
  }
  const results = await query.orderBy(desc(payments.date));
  return ApiResponse.success(c, results, "Payments retrieved successfully");
}
