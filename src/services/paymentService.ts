/**
 * Payment Service Layer
 * Connects to /api/v1/payments endpoints for Razorpay order generation,
 * payment verification, and transaction history.
 */

import { apiClient } from "./apiClient";
import type { CreatePaymentOrderPayload, VerifyPaymentPayload, PaymentRecord } from "@/types/api";

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
  keyId?: string;
}

export const paymentService = {
  /**
   * Create Razorpay payment order for consultation fee or subscription
   */
  async createOrder(payload: CreatePaymentOrderPayload): Promise<RazorpayOrderResult> {
    return apiClient.post<RazorpayOrderResult>("/payments/create-order", payload);
  },

  /**
   * Verify Razorpay payment signature and record invoice
   */
  async verifyPayment(payload: VerifyPaymentPayload): Promise<PaymentRecord> {
    return apiClient.post<PaymentRecord>("/payments/verify-payment", payload);
  },

  /**
   * List payment transaction receipts (optional lawyerId filter)
   */
  async getPayments(lawyerId?: string): Promise<PaymentRecord[]> {
    return apiClient.get<PaymentRecord[]>("/payments", {
      params: lawyerId ? { lawyerId } : undefined,
    });
  },
};
