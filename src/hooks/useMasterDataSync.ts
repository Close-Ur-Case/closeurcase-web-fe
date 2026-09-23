/**
 * Master Data Sync Hook
 * Prefetches and synchronizes legal taxonomies (categories, specializations,
 * courts, states, languages, court levels) from the Supabase Edge API into
 * the reactive local appStore on app mount.
 */

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/useAuth";
import { masterDataService } from "@/services/masterDataService";
import {
  mergeRemoteCaseCategories,
  mergeRemoteCourts,
  mergeRemoteLanguages,
  mergeRemoteStates,
  mergeRemoteCourtLevels,
  type StateItem,
  type CourtLevelItem,
} from "@/data/appStore";
import type { MasterCategory, MasterCourt } from "@/types/api";

export function useMasterDataSync() {
  const { isAuthenticated } = useAuth();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (syncedRef.current) return;
    syncedRef.current = true;

    // 1. Categories, Sub-categories & Services
    masterDataService
      .getCategories()
      .then((remoteCats: MasterCategory[]) => {
        if (Array.isArray(remoteCats) && remoteCats.length > 0) {
          const mapped = remoteCats.map((rc) => ({
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
      })
      .catch((err) => console.warn("[MasterDataSync] Categories notice:", err));

    // 2. Courts Directory
    masterDataService
      .getCourts()
      .then((remoteCourts: MasterCourt[]) => {
        if (Array.isArray(remoteCourts) && remoteCourts.length > 0) {
          const mapped = remoteCourts.map((c) => ({
            id: c.id,
            name: c.name,
            level: c.courtLevel || c.level || "District Court",
            state: c.state || "Telangana",
            city: c.city,
            district: c.district,
            active: c.active !== false,
          }));
          mergeRemoteCourts(mapped);
        }
      })
      .catch((err) => console.warn("[MasterDataSync] Courts notice:", err));

    // 3. Supported Languages
    masterDataService
      .getLanguages()
      .then((remoteLangs) => {
        if (Array.isArray(remoteLangs) && remoteLangs.length > 0) {
          mergeRemoteLanguages(remoteLangs);
        }
      })
      .catch((err) => console.warn("[MasterDataSync] Languages notice:", err));

    // 4. States & Districts
    masterDataService
      .getStates<Partial<StateItem>>()
      .then((remoteStates) => {
        if (Array.isArray(remoteStates) && remoteStates.length > 0) {
          mergeRemoteStates(remoteStates);
        }
      })
      .catch((err) => console.warn("[MasterDataSync] States notice:", err));

    // 5. Court Levels
    masterDataService
      .getCourtLevels<Partial<CourtLevelItem>>()
      .then((remoteLevels) => {
        if (Array.isArray(remoteLevels) && remoteLevels.length > 0) {
          mergeRemoteCourtLevels(remoteLevels);
        }
      })
      .catch((err) => console.warn("[MasterDataSync] Court levels notice:", err));
  }, []);
}
