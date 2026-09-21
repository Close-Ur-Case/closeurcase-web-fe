/**
 * Subscription Service Layer
 * Connects to /api/v1/subscriptions for plans catalog, active memberships,
 * new plan checkouts, and cancellations.
 */

import { apiClient } from "./apiClient";
import type {
  SubscriptionPlanItem,
  SubscriptionRecord,
  CreateSubscriptionPayload,
} from "@/types/api";
import type { SubscriptionPlanId } from "@/types";
import { SUBSCRIPTION_PLANS, FREE_PLAN } from "@/data/subscriptionPlans";
import {
  getSubscriptions as getLocalSubs,
  addSubscription as addLocalSub,
  cancelSubscription as cancelLocalSub,
} from "@/data/appStore";

export const subscriptionService = {
  /**
   * Get subscription plans catalog (Daily, Monthly, Yearly, Free)
   */
  async getPlans(): Promise<SubscriptionPlanItem[]> {
    try {
      const items = await apiClient.get<SubscriptionPlanItem[]>("/subscriptions/plans");
      if (Array.isArray(items) && items.length > 0) {
        return items;
      }
      return [FREE_PLAN, ...SUBSCRIPTION_PLANS];
    } catch (err) {
      console.warn("[SubscriptionService] Backend plans fallback to local:", err);
      return [FREE_PLAN, ...SUBSCRIPTION_PLANS];
    }
  },

  /**
   * List citizen subscriptions
   */
  async listSubscriptions(citizenId?: string): Promise<SubscriptionRecord[]> {
    try {
      const params = citizenId ? { citizenId } : undefined;
      const items = await apiClient.get<SubscriptionRecord[]>("/subscriptions", { params });
      if (Array.isArray(items)) {
        return items;
      }
      return getLocalSubs(citizenId || "u_001") as unknown as SubscriptionRecord[];
    } catch (err) {
      console.warn("[SubscriptionService] Backend list fallback to local:", err);
      return getLocalSubs(citizenId || "u_001") as unknown as SubscriptionRecord[];
    }
  },

  /**
   * Create and activate a citizen Auto-Assign subscription
   */
  async createSubscription(payload: CreateSubscriptionPayload): Promise<SubscriptionRecord> {
    try {
      const res = await apiClient.post<SubscriptionRecord>("/subscriptions", payload);
      // Dual-sync with local appStore
      addLocalSub({
        citizenId: payload.citizenId,
        planId: payload.planId as SubscriptionPlanId,
        planLabel: payload.planLabel || payload.planId,
        amount: payload.amount,
        caseId: payload.caseId,
      });
      return res;
    } catch (err) {
      console.warn("[SubscriptionService] Backend create fallback to local:", err);
      const local = addLocalSub({
        citizenId: payload.citizenId,
        planId: payload.planId as SubscriptionPlanId,
        planLabel: payload.planLabel || payload.planId,
        amount: payload.amount,
        caseId: payload.caseId,
      });
      return local as unknown as SubscriptionRecord;
    }
  },

  /**
   * Cancel recurring subscription plan
   */
  async cancelSubscription(id: string): Promise<SubscriptionRecord> {
    try {
      const res = await apiClient.patch<SubscriptionRecord>(`/subscriptions/${id}/cancel`);
      cancelLocalSub(id);
      return res;
    } catch (err) {
      console.warn("[SubscriptionService] Backend cancel fallback to local:", err);
      const local = cancelLocalSub(id);
      if (local) return local as unknown as SubscriptionRecord;
      throw err;
    }
  },
};
