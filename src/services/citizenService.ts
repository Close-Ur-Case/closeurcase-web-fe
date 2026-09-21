/**
 * Citizen Service Layer
 * Connects to /api/v1/citizens endpoints for logged-in profile management,
 * admin citizen directory, and citizen subscription tracking.
 */

import { apiClient } from "./apiClient";
import type {
  CitizenProfile,
  UpdateCitizenMePayload,
  UpdateCitizenPayload,
  CitizenSubscription,
} from "@/types/api";

export const citizenService = {
  /**
   * Get logged-in citizen profile & preferences
   */
  async getMe<T = CitizenProfile>(): Promise<T> {
    return apiClient.get<T>("/citizens/me");
  },

  /**
   * Update logged-in citizen profile details
   */
  async updateMe<T = CitizenProfile>(payload: UpdateCitizenMePayload): Promise<T> {
    return apiClient.patch<T>("/citizens/me", payload);
  },

  /**
   * List citizens directory (Admin)
   */
  async getCitizens<T = CitizenProfile>(params?: { search?: string; page?: string }): Promise<T[]> {
    return apiClient.get<T[]>("/citizens", {
      params,
    });
  },

  /**
   * Get citizen profile by ID (including subscriptions)
   */
  async getCitizenById<T = CitizenProfile & { subscriptions?: CitizenSubscription[] }>(
    id: string,
  ): Promise<T> {
    return apiClient.get<T>(`/citizens/${id}`);
  },

  /**
   * Update citizen profile by ID (Admin)
   */
  async updateCitizen<T = CitizenProfile>(id: string, payload: UpdateCitizenPayload): Promise<T> {
    return apiClient.patch<T>(`/citizens/${id}`, payload);
  },

  /**
   * Get active subscriptions and usage for a citizen
   */
  async getSubscriptions<T = CitizenSubscription[]>(citizenId: string): Promise<T> {
    return apiClient.get<T>(`/citizens/${citizenId}/subscriptions`);
  },
};
