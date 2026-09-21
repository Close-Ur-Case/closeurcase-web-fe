/**
 * Master Data Service
 * Connects to /v1/master-data endpoints for categories, courts, cities, and languages.
 */

import { apiClient } from "./apiClient";
import type {
  MasterCategory,
  MasterSpecialization,
  MasterLegalService,
  MasterCourt,
  MasterCity,
} from "@/types/api";

export const masterDataService = {
  /**
   * Get legal practice areas & categories (with nested specializations & legal services)
   */
  async getCategories(): Promise<MasterCategory[]> {
    return apiClient.get<MasterCategory[]>("/master-data/categories");
  },

  /**
   * Get specializations, optionally filtered by categoryId
   */
  async getSpecializations(categoryId?: string): Promise<MasterSpecialization[]> {
    return apiClient.get<MasterSpecialization[]>("/master-data/specializations", {
      params: categoryId ? { categoryId } : undefined,
    });
  },

  /**
   * Get legal services catalog, optionally filtered by categoryId
   */
  async getLegalServices(categoryId?: string): Promise<MasterLegalService[]> {
    return apiClient.get<MasterLegalService[]>("/master-data/legal-services", {
      params: categoryId ? { categoryId } : undefined,
    });
  },

  /**
   * Get Indian courts list
   */
  async getCourts(): Promise<MasterCourt[]> {
    return apiClient.get<MasterCourt[]>("/master-data/courts");
  },

  /**
   * Get Indian cities list
   */
  async getCities(): Promise<MasterCity[]> {
    return apiClient.get<MasterCity[]>("/master-data/cities");
  },

  /**
   * Get supported languages
   */
  async getLanguages(): Promise<Array<{ id: string; name: string; code: string }>> {
    return apiClient.get("/master-data/languages");
  },

  /**
   * Get Indian states & territories
   */
  async getStates<T = unknown>(): Promise<T[]> {
    return apiClient.get<T[]>("/master-data/states");
  },

  /**
   * Get court levels & hierarchy
   */
  async getCourtLevels<T = unknown>(): Promise<T[]> {
    return apiClient.get<T[]>("/master-data/court-levels");
  },

  /**
   * Get districts (optional stateId)
   */
  async getDistricts<T = unknown>(stateId?: string): Promise<T[]> {
    return apiClient.get<T[]>("/master-data/districts", {
      params: stateId ? { stateId } : undefined,
    });
  },

  /**
   * Admin create taxonomy record
   */
  async createTaxonomyItem<T = unknown>(
    type:
      | "categories"
      | "cities"
      | "districts"
      | "courts"
      | "states"
      | "court-levels"
      | "languages"
      | string,
    data: unknown,
  ): Promise<T> {
    return apiClient.post<T>(`/master-data/${type}`, data);
  },

  /**
   * Admin update taxonomy item
   */
  async updateTaxonomyItem<T = unknown>(type: string, id: string, data: unknown): Promise<T> {
    return apiClient.put<T>(`/master-data/${type}/${id}`, data);
  },

  /**
   * Admin delete taxonomy item
   */
  async deleteTaxonomyItem<T = void>(type: string, id: string): Promise<T> {
    return apiClient.delete<T>(`/master-data/${type}/${id}`);
  },
};
