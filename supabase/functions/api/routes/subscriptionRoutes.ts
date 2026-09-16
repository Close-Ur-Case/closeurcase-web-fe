import { Hono } from "hono";
import {
  getSubscriptionPlans,
  listSubscriptions,
  createSubscription,
  cancelSubscription,
} from "../controllers/subscriptionController.ts";
import { optionalAuth } from "../middlewares/auth.ts";

const subscription = new Hono();

subscription.get("/plans", optionalAuth, getSubscriptionPlans);
subscription.get("/", optionalAuth, listSubscriptions);
subscription.post("/", optionalAuth, createSubscription);
subscription.patch("/:id/cancel", optionalAuth, cancelSubscription);

export default subscription;
