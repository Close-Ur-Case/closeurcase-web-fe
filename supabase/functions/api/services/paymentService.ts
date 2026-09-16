import { razorpay } from "../config/razorpay.ts";
import { db } from "../config/db.ts";
import { payments } from "../models/payments.ts";
import { subscriptions } from "../models/subscriptions.ts";
import { eq } from "drizzle-orm";
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

  static async completePayment({
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
    const isValid = this.verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });
    if (!isValid) throw ApiError.badRequest("Invalid Razorpay payment signature");

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
        razorpaySignature,
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
}
