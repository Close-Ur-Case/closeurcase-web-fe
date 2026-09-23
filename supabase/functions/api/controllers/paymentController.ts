import type { Context } from "hono";
import { PaymentService } from "../services/paymentService.ts";
import { db } from "../config/db.ts";
import { payments } from "../models/payments.ts";
import { citizens, lawyers } from "../models/users.ts";
import { and, eq, desc } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

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

/**
 * Razorpay webhook delivery — the system of record for a payment succeeding,
 * independent of the citizen's browser. `/verify-payment` above only ever
 * runs if the client is still there to call it; a closed tab, a crash, or a
 * lost connection right after a real charge previously meant the money moved
 * but nothing was ever recorded here. This is what closes that gap.
 *
 * Deliberately reads the body as raw text, not `c.req.json()`: Razorpay signs
 * the exact bytes it sent, and re-serializing a parsed object can reorder
 * keys or change whitespace, which would silently break every signature
 * check. For the same reason this route is registered with a plain `.post()`
 * in paymentRoutes.ts rather than through `createRoute`/`.openapi()` — an
 * OpenAPI-validated body schema risks the framework consuming the request
 * stream before this handler ever sees it.
 */
export async function razorpayWebhook(c: Context) {
  const rawBody = await c.req.text();
  const signature = c.req.header("x-razorpay-signature");

  const isValid = PaymentService.verifyWebhookSignature(rawBody, signature);
  if (!isValid) {
    // 400, not 401 — Razorpay retries a delivery on network/5xx failures,
    // not on a 4xx, so a forged or misconfigured signature fails once rather
    // than triggering a retry storm.
    throw ApiError.badRequest("Invalid webhook signature");
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    throw ApiError.badRequest("Malformed webhook payload");
  }

  // Only `payment.captured` needs action here. `payment.failed` and every
  // other event type have nothing recorded on either path (client or
  // webhook) to reconcile, so there's nothing to do for them — acknowledging
  // with 200 is still correct; it just means "received, no action taken."
  if (event.event === "payment.captured") {
    const paymentEntity = event.payload?.payment?.entity;
    if (paymentEntity?.id) {
      await PaymentService.recordPaymentFromWebhook(paymentEntity);
    }
  }

  return ApiResponse.success(c, { received: true }, "Webhook processed");
}

/**
 * List payment receipts, scoped to whoever is asking.
 *
 * Payment rows expose both sides of a transaction plus the platform's cut, so
 * the caller's role — not a client-supplied query param — decides what comes
 * back. Only admins may read across accounts; a lawyer or citizen is pinned to
 * their own records regardless of what they pass in.
 *
 * `payments.lawyerId`/`citizenId` hold the domain record ids (l_001 / u_001),
 * while the token resolves to the Supabase auth UUID, so each role is mapped
 * through its own table first.
 */
export async function getPayments(c: Context) {
  const user = c.get("user") as { id: string; role: string } | undefined;
  const lawyerIdParam = c.req.query("lawyerId");
  const citizenIdParam = c.req.query("citizenId");

  const filters = [];

  if (!user || user.role === "admin") {
    // Unauthenticated (dev) or admin: filter by query param if provided, otherwise see all
    if (lawyerIdParam) filters.push(eq(payments.lawyerId, lawyerIdParam));
    if (citizenIdParam) filters.push(eq(payments.citizenId, citizenIdParam));
  } else if (user.role === "lawyer") {
    const [lawyerRecord] = await db.select().from(lawyers).where(eq(lawyers.userId, user.id));
    // No advocate record means nothing is owed to this account yet.
    if (!lawyerRecord) return ApiResponse.success(c, [], "Payments retrieved successfully");
    filters.push(eq(payments.lawyerId, lawyerRecord.id));
  } else {
    const [citizenRecord] = await db.select().from(citizens).where(eq(citizens.userId, user.id));
    if (!citizenRecord) return ApiResponse.success(c, [], "Payments retrieved successfully");
    filters.push(eq(payments.citizenId, citizenRecord.id));
  }

  const results = await db
    .select()
    .from(payments)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(payments.date));

  return ApiResponse.success(c, results, "Payments retrieved successfully");
}
