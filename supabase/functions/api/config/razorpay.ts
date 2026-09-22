import { env } from "./env.ts";
import crypto from "node:crypto";

export const razorpay = {
  keyId: env.RAZORPAY_KEY_ID,
  keySecret: env.RAZORPAY_KEY_SECRET,

  async createOrder({
    amount,
    currency = "INR",
    receipt,
    notes = {},
  }: {
    amount: number;
    currency?: string;
    receipt?: string;
    notes?: Record<string, string>;
  }) {
    // If running in development/mock mode without live key
    if (!env.RAZORPAY_KEY_ID || env.RAZORPAY_KEY_ID.includes("placeholder")) {
      return {
        id: `order_mock_${Date.now()}`,
        amount,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        status: "created",
        keyId: env.RAZORPAY_KEY_ID,
      };
    }

    const authHeader = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Razorpay order creation failed: ${errorText}`);
    }

    const data = await response.json();
    return { ...data, keyId: env.RAZORPAY_KEY_ID };
  },

  verifySignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  }: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    // The ONLY signature bypass is for orders this backend generated itself in
    // mock mode (`createOrder`'s dev branch stamps every mock order with this
    // prefix, and only takes that branch when no real Razorpay key is
    // configured) — so it can't be spoofed by a caller supplying an arbitrary
    // order id.
    //
    // This used to also bypass whenever `NODE_ENV === "development"`,
    // regardless of the order id. That is a much bigger hole than mock-mode
    // support requires: it would accept a forged signature for a REAL
    // Razorpay order — any amount, any lawyerId — in any deployment that has
    // `NODE_ENV=development` set, real keys configured or not (a staging
    // environment, for instance). Payment verification must fail closed
    // outside the specific case it's meant to support.
    if (razorpayOrderId?.startsWith("order_mock_")) {
      return true;
    }
    const hmac = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    return hmac.digest("hex") === razorpaySignature;
  },

  /**
   * Verifies a Razorpay webhook delivery.
   *
   * This is a *different* signing scheme from `verifySignature` above: Razorpay
   * signs the raw request body with a separate secret (`RAZORPAY_WEBHOOK_SECRET`,
   * configured in the Razorpay dashboard's webhook settings, not the API key
   * secret) and sends the result in the `X-Razorpay-Signature` header. The
   * caller must pass the exact raw body text — re-serializing a parsed object
   * can reorder keys or change whitespace and silently break the match.
   *
   * Deliberately has no mock-mode bypass, unlike `verifySignature`: HMAC
   * verification is symmetric, so a local test can just sign its own payload
   * with the same secret the server is configured with — there's no need for
   * an "order_mock_"-style escape hatch here.
   *
   * Refuses outright (rather than validating against it) when the secret is
   * still the placeholder default: that value is committed to source, so
   * anyone who's read this file could forge a signature that matches it. This
   * mirrors the lesson from `verifySignature`'s old `NODE_ENV === "development"`
   * bypass — fail closed outside the specific case a check is meant to support.
   */
  verifyWebhookSignature(rawBody: string, signature: string | null | undefined) {
    if (!signature) return false;
    if (!env.RAZORPAY_WEBHOOK_SECRET || env.RAZORPAY_WEBHOOK_SECRET.includes("placeholder")) {
      return false;
    }
    const hmac = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET);
    hmac.update(rawBody);
    return hmac.digest("hex") === signature;
  },
};
