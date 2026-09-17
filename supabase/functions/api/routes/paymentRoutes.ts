import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import {
  createRazorpayOrder,
  verifyAndCompletePayment,
  getPayments,
} from "../controllers/paymentController.ts";
import { authenticateUser } from "../middlewares/auth.ts";
import {
  CreatePaymentOrderSchema,
  VerifyPaymentSchema,
  SuccessResponseSchema,
} from "../schemas/index.ts";

const payment = new OpenAPIHono();
payment.use(authenticateUser);

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
  summary: "List payment transaction receipts",
  security: [{ bearerAuth: [] }],
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

export default payment;
