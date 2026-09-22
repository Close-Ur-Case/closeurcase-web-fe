import type { Context } from "hono";
import { NotificationService } from "../services/notificationService.ts";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

/**
 * `userId`/`role` come from the authenticated session, never the request
 * body — see the comment on `RegisterFcmTokenSchema`. This route requires
 * `authenticateUser` (scoped in notificationRoutes.ts), unlike the rest of
 * this router, precisely because there's no legitimate anonymous case for
 * "register a push destination."
 */
export async function registerFcmToken(c: Context) {
  const user = c.get("user");
  if (!user) throw ApiError.unauthorized("Authenticated session required");

  const { deviceToken, deviceType } = await c.req.json();
  if (!deviceToken) throw ApiError.badRequest("deviceToken is required");

  const result = await NotificationService.registerDeviceToken({
    userId: user.id,
    role: user.role,
    deviceToken,
    deviceType,
  });
  return ApiResponse.created(c, result, "FCM device token registered successfully");
}

export async function getNotifications(c: Context) {
  const role = c.req.query("role");
  const limit = Number(c.req.query("limit") || "50");
  const result = await NotificationService.getNotifications({ role, limit });
  return ApiResponse.success(c, result, "Notifications retrieved successfully");
}

export async function markAsRead(c: Context) {
  const id = c.req.param("id")!;
  const updated = await NotificationService.markAsRead(id);
  return ApiResponse.success(c, updated, "Notification marked as read");
}

export async function markAllAsRead(c: Context) {
  const { role } = await c.req.json().catch(() => ({ role: undefined }));
  await NotificationService.markAllAsRead(role);
  return ApiResponse.success(c, null, "All notifications marked as read");
}
