import { razorpay } from "../config/razorpay.ts";
import { db } from "../config/db.ts";
import { payments } from "../models/payments.ts";
import { subscriptions } from "../models/subscriptions.ts";
import { and, eq } from "drizzle-orm";
import { ApiError } from "../utils/apiError.ts";
import { NotificationService } from "./notificationService.ts";

export class PaymentService {
  static async createOrder({ amount, currency = "INR", receipt, notes = {} }: any) {
    if (!amount || amount <= 0) throw ApiError.badRequest("Valid amount is required");
    const amountInPaise = Math.round(amount * 100);
    return razorpay.createOrder({ amount: amountInPaise, currency, receipt, notes });
  }

  static verifySignature(data: any) {
    return razorpay.verifySignature(data);
  }

  static verifyWebhookSignature(rawBody: string, signature: string | null | undefined) {
    return razorpay.verifyWebhookSignature(rawBody, signature);
  }

  /**
   * Records a captured payment (and, for a subscription purchase, activates
   * the plan) — the part shared between the two ways a payment can reach this
   * backend:
   *  - `completePayment`, after the client submits its Razorpay order/payment
   *    signature.
   *  - `recordPaymentFromWebhook`, after Razorpay's own signed delivery.
   *
   * Each entry point authenticates the request differently, but a captured
   * payment must be recorded exactly once, the same way, regardless of which
   * one saw it first — so this is the single place that actually inserts a
   * row. Idempotent on `razorpayPaymentId`: whichever path arrives second for
   * the same payment gets back the row the first one created, rather than a
   * duplicate receipt or a second subscription activation.
   */
  static async recordPayment({
    source,
    grossAmount,
    citizenId,
    citizenName,
    lawyerId,
    lawyerName,
    caseId,
    caseTitle,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    planId,
    planLabel,
  }: any) {
    if (razorpayPaymentId) {
      const [existing] = await db
        .select()
        .from(payments)
        .where(eq(payments.razorpayPaymentId, razorpayPaymentId));
      if (existing) {
        // Best-effort echo for a duplicate delivery — approximates "the
        // subscription this payment activated" as "whatever's currently
        // active for this citizen", since a payment row has no direct FK to
        // the subscription it created.
        const [existingSubscription] =
          existing.source === "subscription" && existing.citizenId
            ? await db
                .select()
                .from(subscriptions)
                .where(
                  and(
                    eq(subscriptions.citizenId, existing.citizenId),
                    eq(subscriptions.status, "Active"),
                  ),
                )
            : [];
        return { payment: existing, subscription: existingSubscription || null };
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    const paymentId = `pay_${Date.now()}`;

    let platformAmount = 0;
    let lawyerAmount = 0;

    if (source === "subscription") {
      platformAmount = grossAmount;
      lawyerAmount = 0;
    } else {
      platformAmount = Math.round(grossAmount * 0.2);
      lawyerAmount = grossAmount - platformAmount;
    }

    const [paymentRecord] = await db
      .insert(payments)
      .values({
        id: paymentId,
        source,
        date: today,
        status: "Completed",
        citizenId: citizenId || null,
        citizenName: citizenName || null,
        lawyerId: lawyerId || null,
        lawyerName: lawyerName || null,
        caseId: caseId || null,
        caseTitle: caseTitle || null,
        grossAmount,
        platformAmount,
        lawyerAmount,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature: razorpaySignature || null,
      })
      .returning();

    let subscriptionRecord = null;
    if (source === "subscription" && citizenId) {
      await db
        .update(subscriptions)
        .set({ status: "Expired" })
        .where(eq(subscriptions.citizenId, citizenId));

      const subId = `sub_${Date.now()}`;
      [subscriptionRecord] = await db
        .insert(subscriptions)
        .values({
          id: subId,
          citizenId,
          planId: planId || "monthly",
          planLabel: planLabel || "Monthly Plan",
          amount: grossAmount,
          startedAt: today,
          status: "Active",
          caseId: caseId || null,
        })
        .returning();

      await NotificationService.createInAppNotification({
        title: "Subscription Activated",
        body: `Your ${planLabel || "Auto-Assign"} plan (₹${grossAmount}) is now active.`,
        role: "citizen",
      });
    }

    return { payment: paymentRecord, subscription: subscriptionRecord };
  }

  /** Client-submitted path: gated on the order/payment signature the citizen's
   * browser received back from Razorpay's checkout modal. */
  static async completePayment(data: any) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = data;
    const isValid = this.verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!isValid) throw ApiError.badRequest("Invalid Razorpay payment signature");
    return this.recordPayment(data);
  }

  /**
   * Webhook path: gated on the HMAC signature Razorpay itself sends (verified
   * by the caller before this runs — see `verifyWebhookSignature`), not on
   * anything the client submitted. This is what makes a payment durable even
   * if the client never calls `/verify-payment` at all — a closed tab, a
   * crash, or a lost connection right after a real charge previously meant
   * the money moved but nothing was ever recorded here.
   *
   * The webhook's `payment.entity` carries only Razorpay's own fields
   * (amount, order id, payment id) — everything specific to *this* platform's
   * transaction (citizenId, lawyerId, caseId, planId, …) has to travel back
   * from `notes`, which `createOrder` now populates with that same context up
   * front, before the citizen ever sees the checkout modal.
   */
  static async recordPaymentFromWebhook(paymentEntity: any) {
    const notes = paymentEntity?.notes || {};
    return this.recordPayment({
      source: notes.source || "commission",
      grossAmount: Math.round((paymentEntity?.amount || 0) / 100),
      citizenId: notes.citizenId || undefined,
      citizenName: notes.citizenName || undefined,
      lawyerId: notes.lawyerId || undefined,
      lawyerName: notes.lawyerName || undefined,
      caseId: notes.caseId || undefined,
      caseTitle: notes.caseTitle || undefined,
      planId: notes.planId || undefined,
      planLabel: notes.planLabel || undefined,
      razorpayOrderId: paymentEntity?.order_id,
      razorpayPaymentId: paymentEntity?.id,
      // Not applicable here — authenticity is already established via the
      // webhook's own HMAC signature, not the order/payment signature scheme.
      razorpaySignature: null,
    });
  }
}
