/**
 * Razorpay checkout for the citizen-facing payment flows.
 *
 * The full round trip is: create an order server-side → collect the payment in
 * Razorpay's hosted modal → hand the signed result back to `/payments/verify-payment`,
 * which validates the signature, writes the receipt and (for a subscription)
 * activates the plan. The client never decides that a payment succeeded — only a
 * server-verified signature does.
 *
 * Dev mode: when `RAZORPAY_KEY_ID` is unset or a placeholder, the backend returns
 * an `order_mock_…` id and accepts any signature. Recognising that prefix lets the
 * whole flow run locally without keys and without loading Razorpay's script.
 *
 * The order's `notes` carry the same citizenId/lawyerId/caseId/plan fields as
 * `verification` below, not just `source` — Razorpay stores notes verbatim and
 * echoes them back on every event for that order, including its webhook
 * delivery. That's what lets the backend's `/payments/webhook` reconstruct a
 * full payment record if this citizen's browser never gets to call
 * `verify-payment` at all (closed tab, crash, lost connection right after a
 * real charge) — the webhook is the only thing that still has the context to
 * record it correctly.
 */

import { useCallback, useState } from "react";
import { paymentService, type VerifyPaymentResult } from "@/services/paymentService";
import type { VerifyPaymentPayload } from "@/types/api";

const CHECKOUT_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key?: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

/** Everything in `verification` except the razorpay-issued fields (unknown until
 * after checkout) and `grossAmount` (redundant with the order's own `amount`),
 * flattened to the plain string map Razorpay's `notes` field expects. */
function buildOrderNotes(verification: CheckoutRequest["verification"]): Record<string, string> {
  const { grossAmount: _grossAmount, ...rest } = verification;
  const notes: Record<string, string> = {};
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      notes[key] = String(value);
    }
  });
  return notes;
}

/** Load Razorpay's script once and reuse it across checkouts. */
let scriptPromise: Promise<void> | null = null;
function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${CHECKOUT_SCRIPT_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Razorpay failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Let a later attempt retry rather than caching the failure forever.
      scriptPromise = null;
      reject(new Error("Could not reach Razorpay. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export interface CheckoutRequest {
  /** Amount in rupees — the service converts to paise when creating the order. */
  amount: number;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  /** Receipt details forwarded to verification and written onto the payment row. */
  verification: Omit<
    VerifyPaymentPayload,
    "razorpayOrderId" | "razorpayPaymentId" | "razorpaySignature"
  >;
}

export interface RazorpayCheckoutState {
  startCheckout: (req: CheckoutRequest) => Promise<VerifyPaymentResult | null>;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
}

export function useRazorpayCheckout(): RazorpayCheckoutState {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const startCheckout = useCallback(
    async (req: CheckoutRequest): Promise<VerifyPaymentResult | null> => {
      setIsProcessing(true);
      setError(null);

      try {
        const order = await paymentService.createOrder({
          amount: req.amount,
          currency: "INR",
          notes: buildOrderNotes(req.verification),
        });

        const verify = (signed: RazorpayHandlerResponse) =>
          paymentService.verifyPayment({
            ...req.verification,
            grossAmount: req.verification.grossAmount ?? req.amount,
            razorpayOrderId: signed.razorpay_order_id,
            razorpayPaymentId: signed.razorpay_payment_id,
            razorpaySignature: signed.razorpay_signature,
          });

        // Dev/mock order — the backend accepts any signature, so skip the modal.
        if (order.id.startsWith("order_mock_")) {
          const result = await verify({
            razorpay_order_id: order.id,
            razorpay_payment_id: `pay_mock_${Date.now()}`,
            razorpay_signature: "mock_signature",
          });
          setIsProcessing(false);
          return result;
        }

        await loadRazorpayScript();
        if (!window.Razorpay) {
          throw new Error("Razorpay checkout is unavailable right now.");
        }

        // The modal is event-driven, so the promise settles from its callbacks.
        return await new Promise<VerifyPaymentResult | null>((resolve, reject) => {
          const checkout = new window.Razorpay!({
            key: order.keyId,
            // Razorpay works in paise; `order.amount` is already converted.
            amount: order.amount,
            currency: order.currency || "INR",
            name: "CloseUrCase",
            description: req.description,
            order_id: order.id,
            prefill: req.prefill,
            handler: (response) => {
              verify(response)
                .then((result) => {
                  setIsProcessing(false);
                  resolve(result);
                })
                .catch((err: unknown) => {
                  setIsProcessing(false);
                  const message =
                    err instanceof Error ? err.message : "Payment could not be verified.";
                  setError(message);
                  reject(err instanceof Error ? err : new Error(message));
                });
            },
            modal: {
              // Closing the modal is a cancellation, not a failure.
              ondismiss: () => {
                setIsProcessing(false);
                resolve(null);
              },
            },
          });
          checkout.open();
        });
      } catch (err: unknown) {
        setIsProcessing(false);
        const message = err instanceof Error ? err.message : "Payment failed. Please try again.";
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [],
  );

  return { startCheckout, isProcessing, error, clearError };
}
