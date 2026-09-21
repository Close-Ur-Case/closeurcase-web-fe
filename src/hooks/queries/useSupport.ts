/**
 * React Query hooks for Customer Support & Inquiries
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supportService } from "@/services/supportService";
import type { ContactInquiryPayload, UpdateInquiryStatusPayload } from "@/types/api";

export function useInquiriesQuery() {
  return useQuery({
    queryKey: ["support-inquiries"],
    queryFn: () => supportService.listInquiries(),
    staleTime: 60 * 1000,
  });
}

export function useSubmitInquiryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ContactInquiryPayload) => supportService.submitInquiry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-inquiries"] });
    },
  });
}

export function useUpdateInquiryStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: UpdateInquiryStatusPayload["status"] }) =>
      supportService.updateInquiryStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-inquiries"] });
    },
  });
}
