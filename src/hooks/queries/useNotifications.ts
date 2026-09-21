/**
 * React Query hooks for Notifications
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notificationService";
import type { RegisterFcmTokenPayload, NotificationQueryParams } from "@/types/api";

export function useNotificationsQuery(params?: NotificationQueryParams) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: () => notificationService.getNotifications(params),
    staleTime: 30 * 1000,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (role?: string) => notificationService.markAllAsRead(role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useRegisterFcmTokenMutation() {
  return useMutation({
    mutationFn: (payload: RegisterFcmTokenPayload) => notificationService.registerFcmToken(payload),
  });
}
