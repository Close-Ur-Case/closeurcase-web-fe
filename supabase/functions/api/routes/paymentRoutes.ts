import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  createRazorpayOrder,
  verifyAndCompletePayment,
  getPayments,
  razorpayWebhook,
} from "../controllers/paymentController.ts";
import { authenticateUser, optionalAuth } from "../middlewares/auth.ts";
import {
  CreatePaymentOrderSchema,
  VerifyPaymentSchema,
  SuccessResponseSchema,
} from "../schemas/index.ts";

const payment = new OpenAPIHono();
// Scoped per path rather than router-wide: `/webhook` is called directly by
// Razorpay's own servers, which have no bearer token to send — it
// authenticates via the `X-Razorpay-Signature` header instead (see the
// handler), so it must stay reachable without one.
payment.use("/create-order", authenticateUser);
payment.use("/verify-payment", authenticateUser);
payment.use("/", optionalAuth);

const createOrderRoute = createRoute({
  method: "post",
  path: "/create-order",
  tags: ["Payments"],
  summary: "Create Razorpay payment order for consultation fee or subscription",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreatePaymentOrderSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Razorpay order created with order_id",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const verifyPaymentRoute = createRoute({
  method: "post",
  path: "/verify-payment",
  tags: ["Payments"],
  summary: "Verify Razorpay payment signature and record invoice",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: VerifyPaymentSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Payment successfully verified",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getPaymentsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Payments"],
  summary: "List payment transaction receipts (scoped to the caller's role)",
  description:
    "Admins see all payments and may narrow by lawyerId/citizenId. Lawyers and citizens always receive only their own records; the filters are ignored for them.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      lawyerId: z.string().optional().openapi({ example: "l_001" }),
      citizenId: z.string().optional().openapi({ example: "u_001" }),
    }),
  },
  responses: {
    200: {
      description: "Transaction history",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

payment.openapi(createOrderRoute, createRazorpayOrder as any);
payment.openapi(verifyPaymentRoute, verifyAndCompletePayment as any);
payment.openapi(getPaymentsRoute, getPayments as any);

// Registered as a plain route, not through `createRoute`/`.openapi()` — see
// the handler's comment in paymentController.ts for why: an OpenAPI-declared
// body schema risks the framework reading the request body before this
// handler gets a chance to, which would break raw-signature verification.
// (It also means this endpoint — Razorpay's servers call it directly, never
// this app's own client — doesn't show up in the generated Swagger docs,
// which is the right outcome for it.)
payment.post("/webhook", razorpayWebhook as any);

export default payment;
