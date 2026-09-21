/**
 * React Query hooks for Real-time Case Chat
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatService } from "@/services/chatService";
import type { SendChatMessagePayload } from "@/types/api";

export function useCaseMessagesQuery(caseId?: string) {
  return useQuery({
    queryKey: ["cases", caseId, "messages"],
    queryFn: () => (caseId ? chatService.getMessages(caseId) : Promise.resolve([])),
    enabled: Boolean(caseId),
    refetchInterval: 5000, // Poll every 5s for active conversation updates
  });
}

export function useSendMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, payload }: { caseId: string; payload: SendChatMessagePayload }) =>
      chatService.sendMessage(caseId, payload),
    onSuccess: (_, { caseId }) => {
      queryClient.invalidateQueries({
        queryKey: ["cases", caseId, "messages"],
      });
    },
  });
}

export function useMarkMessagesReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (caseId: string) => chatService.markRead(caseId),
    onSuccess: (_, caseId) => {
      queryClient.invalidateQueries({
        queryKey: ["cases", caseId, "messages"],
      });
    },
  });
}
