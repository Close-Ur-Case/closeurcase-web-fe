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
  summary: "List active and past citizen subscriptions",
  request: {
    query: z.object({
      citizenId: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "List of subscriptions",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const createSubscriptionRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Subscriptions"],
  summary: "Subscribe citizen to an Auto-Assign Legal plan",
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
      description: "Subscription activated",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const cancelSubscriptionRoute = createRoute({
  method: "patch",
  path: "/:id/cancel",
  tags: ["Subscriptions"],
  summary: "Cancel recurring subscription plan",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "sub_101" }),
    }),
  },
  responses: {
    200: {
      description: "Subscription cancelled",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

subscription.openapi(getSubscriptionPlansRoute, getSubscriptionPlans as any);
subscription.openapi(listSubscriptionsRoute, listSubscriptions as any);
subscription.openapi(createSubscriptionRoute, createSubscription as any);
subscription.openapi(cancelSubscriptionRoute, cancelSubscription as any);

export default subscription;
