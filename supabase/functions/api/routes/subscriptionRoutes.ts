import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  getSubscriptionPlans,
  listSubscriptions,
  createSubscription,
  cancelSubscription,
} from "../controllers/subscriptionController.ts";
import { optionalAuth } from "../middlewares/auth.ts";
import { CreateSubscriptionSchema, SuccessResponseSchema } from "../schemas/index.ts";

const subscription = new OpenAPIHono();
subscription.use(optionalAuth);

const getSubscriptionPlansRoute = createRoute({
  method: "get",
  path: "/plans",
  tags: ["Subscriptions"],
  summary: "Get citizen subscription plans catalog (Free, Monthly, Yearly)",
  responses: {
    200: {
      description: "Catalog of available tiers and prices",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const listSubscriptionsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Subscriptions"],
  summary: "List active and past citizen subscriptions (auto-expires past plans and resets citizen to Bronze Free tier)",
  description:
    "Returns subscriptions for the given citizen. Any active subscription whose expiry timestamp has passed is automatically marked as 'Expired', and the citizen account is automatically reset to the 'bronze' Free tier.",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      citizenId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "List of subscriptions with auto-expired status synced",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const createSubscriptionRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Subscriptions"],
  summary: "Subscribe citizen to an Auto-Assign Legal plan",
  description:
    "Subscribes a citizen to an Auto-Assign Legal plan (e.g. Gold, Silver, or Micro-Pass) and updates the citizen's account plan tier to match.",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateSubscriptionSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Subscription activated and citizen plan tier updated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const cancelSubscriptionRoute = createRoute({
  method: "patch",
  path: "/:id/cancel",
  tags: ["Subscriptions"],
  summary: "Cancel recurring subscription plan",
  description:
    "Cancels an active subscription and automatically reverts the citizen account back to the Bronze Free tier (plan_tier = 'bronze').",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "sub_101" }),
    }),
  },
  responses: {
    200: {
      description: "Subscription cancelled and citizen reverted to Bronze Free tier",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

subscription.openapi(getSubscriptionPlansRoute, getSubscriptionPlans as any);
subscription.openapi(listSubscriptionsRoute, listSubscriptions as any);
subscription.openapi(createSubscriptionRoute, createSubscription as any);
subscription.openapi(cancelSubscriptionRoute, cancelSubscription as any);

export default subscription;
