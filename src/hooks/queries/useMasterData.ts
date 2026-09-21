/**
 * React Query hooks for Master Data & Lookups
 */

import { useQuery, useMutation } from "@tanstack/react-query";
import { masterDataService } from "@/services/masterDataService";

export function useCategoriesQuery() {
  return useQuery({
    queryKey: ["masterData", "categories"],
    queryFn: () => masterDataService.getCategories(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
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
