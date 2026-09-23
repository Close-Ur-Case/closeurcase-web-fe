import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
  registerFcmToken,
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.ts";
import { optionalAuth, authenticateUser } from "../middlewares/auth.ts";
import { RegisterFcmTokenSchema, SuccessResponseSchema } from "../schemas/index.ts";

const notification = new OpenAPIHono();
notification.use(optionalAuth);
// Stricter than the router default: registering a push destination has no
// legitimate anonymous case, unlike reading/acking in-app notifications.
notification.use("/register-token", authenticateUser);

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

notification.openapi(registerTokenRoute, registerFcmToken as any);
notification.openapi(getNotificationsRoute, getNotifications as any);
notification.openapi(markAsReadRoute, markAsRead as any);
notification.openapi(markAllAsReadRoute, markAllAsRead as any);

export default notification;
