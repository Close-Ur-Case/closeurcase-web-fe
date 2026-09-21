/**
 * React Query hooks for Video Consultation Calls
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { videoCallService } from "@/services/videoCallService";
import type { AgoraTokenPayload, LogCallPayload } from "@/types/api";

export function useCallHistoryQuery(caseId?: string) {
  return useQuery({
    queryKey: ["videoCalls", "history", caseId],
    queryFn: () => videoCallService.getCallHistory(caseId),
    staleTime: 30 * 1000,
  });
}

export function useGenerateTokenMutation() {
  return useMutation({
    mutationFn: (payload: AgoraTokenPayload) => videoCallService.generateToken(payload),
  });
}

export function useLogCallMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LogCallPayload) => videoCallService.logCall(payload),
    onSuccess: (_, payload) => {
      queryClient.invalidateQueries({
        queryKey: ["videoCalls", "history", payload.caseId],
      });
      queryClient.invalidateQueries({
        queryKey: ["videoCalls", "history", undefined],
      });
    },
  });
}
