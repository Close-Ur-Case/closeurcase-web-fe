/**
 * React Query hooks for Master Data & Lookups
 */

import { useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { masterDataService } from "@/services/masterDataService";
import { mergeRemoteCaseCategories } from "@/data/appStore";
import { getLawyerPracticeAreas, type LawyerPracticeArea } from "@/components/app/lawyerPracticeAreas";
import type { MasterCategory } from "@/types/api";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["masterData", "categories"],
    queryFn: () => masterDataService.getCategories(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * React Query hook providing live legal practice areas (categories -> specializations -> services)
 * for the public header mega-menu and landing explorer.
 * Automatically synchronizes with appStore and falls back to local seed data.
 */
export function usePracticeAreas() {
  const query = useCategoriesQuery();
  const remoteCategories = query.data;

  useEffect(() => {
    if (Array.isArray(remoteCategories) && remoteCategories.length > 0) {
      const mapped = remoteCategories.map((rc) => ({
        id: rc.id,
        name: rc.name,
        code: rc.code || rc.name.slice(0, 4).toUpperCase(),
        description: rc.description || "",
        active: rc.active !== false,
        subCategories: (rc.subCategories || []).map((sc) => ({
          name: sc.name,
          services: (sc.services || []).map((s) => (typeof s === "string" ? s : s.name)),
        })),
      }));
      mergeRemoteCaseCategories(mapped);
    }
  }, [remoteCategories]);

  const practiceAreas: LawyerPracticeArea[] = useMemo(() => {
    if (Array.isArray(remoteCategories) && remoteCategories.length > 0) {
      return remoteCategories
        .filter((c) => c.active !== false)
        .map((c) => ({
          category: c.name,
          case_types: (c.subCategories || []).map((sc) => ({
            case_type: sc.name,
            legal_services: (sc.services || []).map((s) => (typeof s === "string" ? s : s.name)),
          })),
        }));
    }
    return getLawyerPracticeAreas();
  }, [remoteCategories]);

  return {
    practiceAreas,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useSpecializationsQuery(categoryId?: string) {
  return useQuery({
    queryKey: ["masterData", "specializations", categoryId],
    queryFn: () => masterDataService.getSpecializations(categoryId),
    enabled: Boolean(categoryId),
    staleTime: 60 * 60 * 1000,
  });
}

export function useCourtsQuery() {
  return useQuery({
    queryKey: ["masterData", "courts"],
    queryFn: () => masterDataService.getCourts(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useCitiesQuery() {
  return useQuery({
    queryKey: ["masterData", "cities"],
    queryFn: () => masterDataService.getCities(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useStatesQuery() {
  return useQuery({
    queryKey: ["masterData", "states"],
    queryFn: () => masterDataService.getStates(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useCourtLevelsQuery() {
  return useQuery({
    queryKey: ["masterData", "court-levels"],
    queryFn: () => masterDataService.getCourtLevels(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useDistrictsQuery(stateId?: string) {
  return useQuery({
    queryKey: ["masterData", "districts", stateId],
    queryFn: () => masterDataService.getDistricts(stateId),
    staleTime: 60 * 60 * 1000,
  });
}

export function useLanguagesQuery() {
  return useQuery({
    queryKey: ["masterData", "languages"],
    queryFn: () => masterDataService.getLanguages(),
    staleTime: 60 * 60 * 1000,
  });
}

export function useCreateTaxonomyMutation() {
  return useMutation({
    mutationFn: ({ type, data }: { type: string; data: unknown }) =>
      masterDataService.createTaxonomyItem(type, data),
  });
}

export function useUpdateTaxonomyMutation() {
  return useMutation({
    mutationFn: ({ type, id, data }: { type: string; id: string; data: unknown }) =>
      masterDataService.updateTaxonomyItem(type, id, data),
  });
}

export function useDeleteTaxonomyMutation() {
  return useMutation({
    mutationFn: ({ type, id }: { type: string; id: string }) =>
      masterDataService.deleteTaxonomyItem(type, id),
  });
}
