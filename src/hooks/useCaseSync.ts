/**
 * Case read-path sync.
 *
 * Case *writes* already go to the API (create / import / stage / assign), but every
 * list and detail screen still renders `getCases()` out of the localStorage store.
 * These hooks close that loop: fetch from `/cases/user`, map the backend shape to
 * `LegalCase`, then `mergeRemoteCases()` into the store. The merge calls
 * `notifyListeners()`, so every component already subscribed via `subscribeToStore`
 * picks the server data up without being rewritten.
 *
 * The merge is additive and deduplicated by id, so the app seamlessly keeps
 * client and server state synchronized.
 */

import { useCallback, useEffect, useState } from "react";
import {
  caseService,
  mapBackendCaseToLegalCase,
  type BackendUserCase,
  type ListCasesParams,
} from "@/services/caseService";
import { getCitizens, getLawyers, mergeRemoteCases } from "@/data/appStore";
import { useAuth } from "@/context/useAuth";

export interface CaseSyncState {
  isSyncing: boolean;
  error: Error | null;
  /** `Date.now()` of the last successful sync, or null if none has landed yet. */
  lastSyncedAt: number | null;
  refetch: () => void;
}

/**
 * Scope the case list to whoever is signed in. Admins get the unfiltered list;
 * citizens and lawyers only ever see their own. Falls back to the generic `id`
 * because the backend's citizen/lawyer login payloads don't consistently set the
 * role-specific id field.
 */
function useScopedParams(): ListCasesParams | null {
  const { user, role } = useAuth();

  if (role === "admin") return {};
  if (role === "citizen") {
    const citizenId = user?.citizenId || user?.id;
    return citizenId ? { citizenId } : null;
  }
  if (role === "lawyer") {
    const lawyerId = user?.lawyerId || user?.id;
    return lawyerId ? { lawyerId } : null;
  }
  return null;
}

function mergeBackendCases(backendCases: BackendUserCase[]): number {
  if (!Array.isArray(backendCases) || backendCases.length === 0) return 0;
  // Resolved fresh per sync so names reflect whatever the citizen/lawyer
  // stores have merged in by now.
  const citizens = getCitizens();
  const lawyers = getLawyers();
  const mapped = backendCases.map((c) => mapBackendCaseToLegalCase(c, citizens, lawyers));
  mergeRemoteCases(mapped);
  return mapped.length;
}

/**
 * Pull the signed-in user's cases into the store on mount. Mount this once per
 * role layout — every list screen under it reads through `subscribeToStore`.
 */
export function useCaseSync(): CaseSyncState {
  const params = useScopedParams();
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  // Effects can't depend on an object identity that changes every render, and the
  // scope is only ever one or two string fields — serialize it as the dep key.
  const paramsKey = params ? JSON.stringify(params) : null;

  const sync = useCallback(() => {
    if (paramsKey === null) return;
    const scoped = JSON.parse(paramsKey) as ListCasesParams;

    let cancelled = false;
    setIsSyncing(true);
    setError(null);

    caseService
      .listUserCases<BackendUserCase>(scoped)
      .then((backendCases) => {
        if (cancelled) return;
        mergeBackendCases(backendCases);
        setLastSyncedAt(Date.now());
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Non-fatal: screens keep rendering whatever the store already holds.
        console.warn("[Case Sync] Falling back to local store:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [paramsKey]);

  useEffect(() => sync(), [sync]);

  return { isSyncing, error, lastSyncedAt, refetch: sync };
}

/**
 * Pull one case's full docket into the store. The list endpoint returns a lighter
 * row than `/cases/user/:id`, so detail routes re-sync the case they're showing to
 * fill in documents and timeline.
 */
export function useCaseDetailSync(caseId: string | undefined): CaseSyncState {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const sync = useCallback(() => {
    if (!caseId) return;

    let cancelled = false;
    setIsSyncing(true);
    setError(null);

    caseService
      .getUserCase<BackendUserCase>(caseId)
      .then((backendCase) => {
        if (cancelled || !backendCase) return;
        mergeBackendCases([backendCase]);
        setLastSyncedAt(Date.now());
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.warn(`[Case Sync] Detail fetch failed for ${caseId}:`, err);
        setError(err instanceof Error ? err : new Error(String(err)));
      })
      .finally(() => {
        if (!cancelled) setIsSyncing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  useEffect(() => sync(), [sync]);

  return { isSyncing, error, lastSyncedAt, refetch: sync };
}
