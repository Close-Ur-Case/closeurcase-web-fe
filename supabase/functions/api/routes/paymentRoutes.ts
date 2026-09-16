import { Hono } from "hono";
import {
  createRazorpayOrder,
  verifyAndCompletePayment,
  getPayments,
} from "../controllers/paymentController.ts";
import { authenticateUser } from "../middlewares/auth.ts";

const payment = new Hono();

payment.post("/create-order", authenticateUser, createRazorpayOrder);
payment.post("/verify-payment", authenticateUser, verifyAndCompletePayment);
payment.get("/", authenticateUser, getPayments);

export default payment;
