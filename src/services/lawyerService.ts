/**
 * Lawyer / Advocate Service Layer
 * Connects to /api/v1/lawyers endpoints for directory search, profile updates,
 * admin moderation, availability toggle, and bank details.
 */

import { apiClient } from "./apiClient";
import type {
  UpdateLawyerProfilePayload,
  ToggleAvailabilityPayload,
  UpdateBankDetailsPayload,
  ModerateLawyerPayload,
  LawyerQueryParams,
} from "@/types/api";

export const lawyerService = {
  /**
   * Search & browse verified lawyers directory
   */
  async getLawyers<T = Record<string, unknown>>(params?: LawyerQueryParams): Promise<T[]> {
    return apiClient.get<T[]>("/lawyers", {
      params: params as Record<string, string | number | boolean | undefined | null>,
    });
  },

  /**
   * Get lawyer public profile, badges, ratings & fee structure
   */
  async getLawyerById<T = Record<string, unknown>>(id: string): Promise<T> {
    return apiClient.get<T>(`/lawyers/${id}`);
  },

  /**
   * Update advocate profile details (bio, experience, practice areas, fees, etc.)
   */
  async updateProfile<T = Record<string, unknown>>(
    id: string,
    payload: UpdateLawyerProfilePayload,
  ): Promise<T> {
    return apiClient.patch<T>(`/lawyers/${id}`, payload);
  },

  /**
   * Update lawyer active/inactive/busy status
   */
  async updateStatus<T = Record<string, unknown>>(
    id: string,
    status: "Active" | "Inactive" | "Busy",
  ): Promise<T> {
    return apiClient.patch<T>(`/lawyers/${id}/status`, { status });
  },

  /**
   * Superadmin approve, reject, or suspend advocate verification credentials
   */
  async moderateLawyer<T = Record<string, unknown>>(
    id: string,
    payload: ModerateLawyerPayload,
  ): Promise<T> {
    return apiClient.patch<T>(`/lawyers/${id}/moderate`, payload);
  },

  /**
   * Toggle online availability for instant consultation calls
   */
  async toggleAvailability<T = Record<string, unknown>>(
    id: string,
    availability: ToggleAvailabilityPayload["availability"],
  ): Promise<T> {
    return apiClient.patch<T>(`/lawyers/${id}/availability`, { availability });
  },

  /**
   * Save advocate bank account details for settlement payouts
   */
  async updateBankDetails<T = Record<string, unknown>>(
    id: string,
    payload: UpdateBankDetailsPayload,
  ): Promise<T> {
    return apiClient.patch<T>(`/lawyers/${id}/bank-details`, payload);
  },

  /**
   * Get master data languages linked to advocate
   */
  async getLanguages<T = Record<string, unknown>>(id: string): Promise<T[]> {
    return apiClient.get<T[]>(`/lawyers/${id}/languages`);
  },

  /**
   * Synchronize advocate linked languages with master data table
   */
  async setLanguages<T = Record<string, unknown>>(id: string, languages: string[]): Promise<T> {
    return apiClient.put<T>(`/lawyers/${id}/languages`, { languages });
  },
};
