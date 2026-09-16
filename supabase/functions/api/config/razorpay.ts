import { env } from "./env.ts";
import crypto from "node:crypto";

export const razorpay = {
  keyId: env.RAZORPAY_KEY_ID,
  keySecret: env.RAZORPAY_KEY_SECRET,

  async createOrder({ amount, currency = "INR", receipt, notes = {} }: {
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

  verifySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    if (razorpayOrderId?.startsWith("order_mock_") || env.NODE_ENV === "development") {
      return true;
    }
    const hmac = crypto.createHmac("sha256", env.RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    return hmac.digest("hex") === razorpaySignature;
  },
};
