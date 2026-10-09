import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  registerFcmToken,
  unregisterFcmToken,
  getNotifications,
  getDeviceTokens,
  markAsRead,
  markAllAsRead,
  sendPushNotification,
} from "../controllers/notificationController.ts";
import { optionalAuth, authenticateUser } from "../middlewares/auth.ts";
import { RegisterFcmTokenSchema, SendPushNotificationSchema, SuccessResponseSchema } from "../schemas/index.ts";

const notification = new OpenAPIHono();
notification.use(optionalAuth);
// Stricter than the router default: registering a push destination has no
// legitimate anonymous case, unlike reading/acking in-app notifications.
notification.use("/register-token", authenticateUser);
notification.use("/unregister-token", authenticateUser);

const sendNotificationRoute = createRoute({
  method: "post",
  path: "/send",
  tags: ["Notifications"],
  summary: "Send in-app & push notification to role or specific user (Admin)",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: SendPushNotificationSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Push notification created and dispatched",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const registerTokenRoute = createRoute({
  method: "post",
  path: "/register-token",
  tags: ["Notifications"],
  summary: "Register Firebase Cloud Messaging (FCM) push token",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterFcmTokenSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "FCM token registered",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const unregisterTokenRoute = createRoute({
  method: "post",
  path: "/unregister-token",
  tags: ["Notifications"],
  summary: "Unregister Firebase Cloud Messaging (FCM) push token",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            deviceToken: z.string().openapi({ example: "fcm_token_xyz" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "FCM token unregistered",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getNotificationsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Notifications"],
  summary: "Get user in-app notification center alerts",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      role: z.string().optional().openapi({ example: "citizen" }),
      limit: z.string().optional().openapi({ example: "50" }),
    }),
  },
  responses: {
    200: {
      description: "List of notifications",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const markAsReadRoute = createRoute({
  method: "patch",
  path: "/:id/read",
  tags: ["Notifications"],
  summary: "Mark single notification as read",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z.string().openapi({ example: "notif_101" }),
    }),
  },
  responses: {
    200: {
      description: "Notification marked as read",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const markAllAsReadRoute = createRoute({
  method: "post",
  path: "/mark-all-read",
  tags: ["Notifications"],
  summary: "Mark all user notifications as read",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            role: z.string().optional().openapi({ example: "citizen" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "All notifications marked as read",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

const getDeviceTokensRoute = createRoute({
  method: "get",
  path: "/tokens",
  tags: ["Notifications"],
  summary: "Get registered FCM device tokens for user or role (Admin / Internal)",
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      userId: z.string().optional().openapi({ example: "30ca823d-89ea-4da5-a660-1e63c6c897a5" }),
      role: z.string().optional().openapi({ example: "citizen" }),
    }),
  },
  responses: {
    200: {
      description: "List of registered device tokens",
      content: { "application/json": { schema: SuccessResponseSchema } },
    },
  },
});

notification.openapi(sendNotificationRoute, sendPushNotification as any);
notification.openapi(registerTokenRoute, registerFcmToken as any);
notification.openapi(unregisterTokenRoute, unregisterFcmToken as any);
notification.openapi(getNotificationsRoute, getNotifications as any);
notification.openapi(getDeviceTokensRoute, getDeviceTokens as any);
notification.openapi(markAsReadRoute, markAsRead as any);
notification.openapi(markAllAsReadRoute, markAllAsRead as any);

export default notification;
