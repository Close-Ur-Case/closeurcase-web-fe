/**
 * Notification Service Layer
 * Connects to /api/v1/notifications endpoints for in-app alerts,
 * read status updates, and FCM device push token registration.
 */

import { apiClient } from "./apiClient";
import type {
  NotificationItem,
  RegisterFcmTokenPayload,
  NotificationQueryParams,
} from "@/types/api";

export const notificationService = {
  /**
   * Get in-app notifications (optional role filter and limit)
   */
  async getNotifications<T = NotificationItem>(params?: NotificationQueryParams): Promise<T[]> {
    return apiClient.get<T[]>("/notifications", {
      params: params as Record<string, string | number | boolean | undefined | null>,
    });
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead<T = NotificationItem>(id: string): Promise<T> {
    return apiClient.patch<T>(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read for a given role or user
   */
  async markAllAsRead(role?: string): Promise<void> {
    return apiClient.post<void>("/notifications/mark-all-read", { role });
  },

  /**
   * Register Firebase Cloud Messaging (FCM) push token
   */
  async registerFcmToken<T = Record<string, unknown>>(
    payload: RegisterFcmTokenPayload,
  ): Promise<T> {
    return apiClient.post<T>("/notifications/register-token", payload);
  },
};
