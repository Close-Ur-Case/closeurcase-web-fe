import type { Context } from "hono";
import { NotificationService } from "../services/notificationService.ts";
import { ApiResponse } from "../utils/apiResponse.ts";

export async function registerFcmToken(c: Context) {
  const body = await c.req.json();
  const result = await NotificationService.registerDeviceToken(body);
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
