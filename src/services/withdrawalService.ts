/**
 * Withdrawal & Payout Service Layer
 * Connects to /api/v1/withdrawals endpoints for lawyer earnings withdrawal requests,
 * summary balances, and admin settlement approvals.
 */

import { apiClient } from "./apiClient";
import type { CreateWithdrawalPayload, WithdrawalRecord, WithdrawalSummary } from "@/types/api";

export const withdrawalService = {
  /**
   * List lawyer payout settlement requests (all for admin, or filtered by lawyerId)
   */
  async listWithdrawals<T = WithdrawalRecord>(lawyerId?: string): Promise<T[]> {
    return apiClient.get<T[]>("/withdrawals", {
      params: lawyerId ? { lawyerId } : undefined,
    });
  },

  /**
   * Submit lawyer earnings withdrawal request
   */
  async requestWithdrawal(payload: CreateWithdrawalPayload): Promise<WithdrawalRecord> {
    return apiClient.post<WithdrawalRecord>("/withdrawals", payload);
  },

  /**
   * Get lawyer earnings balance, pending payouts, and lifetime withdrawals
   */
  async getSummary(lawyerId: string): Promise<WithdrawalSummary> {
    return apiClient.get<WithdrawalSummary>("/withdrawals/summary", {
      params: { lawyerId },
    });
  },

  /**
   * Admin approve lawyer earnings withdrawal
   */
  async approveWithdrawal(id: string): Promise<WithdrawalRecord> {
    return apiClient.patch<WithdrawalRecord>(`/withdrawals/${id}/approve`);
  },

  /**
   * Admin reject lawyer earnings withdrawal with reason
   */
  async rejectWithdrawal(id: string, rejectionReason: string): Promise<WithdrawalRecord> {
    return apiClient.patch<WithdrawalRecord>(`/withdrawals/${id}/reject`, {
      rejectionReason,
    });
  },
};
