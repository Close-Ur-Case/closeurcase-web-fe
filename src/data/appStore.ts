import { resolveLegalCategory } from "@/lib/caseCategories";
import type {
  AppNotification,
  CaseDocument,
  CaseNote,
  CaseStatus,
  Citizen,
  HistoryOfHearing,
  KnowledgeItem,
  Lawyer,
  LawyerDocument,
  LegalCase,
  Payment,
  Subscription,
  UserRole,
  VideoCall,
  WithdrawalRequest,
  CaseCategoryItem,
  CaseSubCategoryItem,
  LanguageItem,
  CityItem,
  CourtItem,
  StateItem,
  CourtLevelItem,
} from "@/types";
const LAWYERS_KEY = "cuc_lawyers_v11";
const CITIZENS_KEY = "cuc_citizens_v4";
const NOTIFICATIONS_KEY = "cuc_notifications_v3";
const VIDEO_CALLS_KEY = "cuc_video_calls_v2";
const KB_KEY = "cuc_kb_v4";
const LAWYER_DOCS_KEY = "cuc_lawyer_docs_v1";
const PROFILE_PHOTOS_KEY = "cuc_profile_photos_v1";
const CASES_KEY = "cuc_cases_v13";
const NOTES_KEY = "cuc_case_notes_v1";
const SUBSCRIPTIONS_KEY = "cuc_subscriptions_v2";
const PAYMENTS_KEY = "cuc_payments_v2";
const LAWYER_RATINGS_KEY = "cuc_lawyer_ratings_v1";
const CASE_CATEGORIES_KEY = "cuc_case_categories_v5";
const LANGUAGES_KEY = "cuc_languages_v3";
const CITIES_KEY = "cuc_cities_v4";
const COURTS_KEY = "cuc_courts_v4";
const STATES_KEY = "cuc_states_v3";
const COURT_LEVELS_KEY = "cuc_court_levels_v3";

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((l) => l());
}

export function subscribeToStore(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/* ── Generic LocalStorage Helpers ────────────────────────────────────────── */
function load<T>(key: string, seed: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as T;
  } catch {
    return seed;
  }
}

/** Drop `undefined`/`null` entries so spreading a sparse server record over a
 * local one can only fill fields in, never blank them out. */
function definedOnly<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    const v = obj[k];
    if (v !== undefined && v !== null) out[k] = v;
  });
  return out;
}

function save<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    notifyListeners();
  } catch (err) {
    console.error("Failed to save to store", err);
  }
}

/* ── CASES STORE ─────────────────────────────────────────────────────────── */

/** CloseUrCase ID for a newly-filed case — derived from the filing datetime
 * (down to the second) so it's unique, sortable, and traceable to when the
 * citizen actually registered the case, e.g. "CUC-20260831154512". */
export function generateCloseUrCaseId(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp =
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `CUC ID - ${stamp}`;
}

export function getCases(): LegalCase[] {
  return load<LegalCase[]>(CASES_KEY, []);
}

export function saveCases(cases: LegalCase[]) {
  save(CASES_KEY, cases);
}

export function mergeRemoteCases(remoteCases: LegalCase[]): void {
  if (!Array.isArray(remoteCases) || remoteCases.length === 0) return;
  const current = getCases();
  const currentMap = new Map(current.map((c) => [c.id, c]));
  let hasChanges = false;

  remoteCases.forEach((remote) => {
    const existing = currentMap.get(remote.id);
    if (existing) {
      const updatedStatus = remote.status || existing.status;
      const updatedTimeline =
        remote.timeline && remote.timeline.length > 0 ? remote.timeline : existing.timeline;
      const updatedFiles =
        remote.files && remote.files.files && remote.files.files.length > 0
          ? remote.files
          : existing.files;

      if (
        existing.status !== updatedStatus ||
        existing.timeline.length !== updatedTimeline.length ||
        (existing.files?.files?.length ?? 0) !== (updatedFiles?.files?.length ?? 0)
      ) {
        hasChanges = true;
      }

      currentMap.set(remote.id, {
        ...existing,
        ...remote,
        status: updatedStatus,
        timeline: updatedTimeline,
        files: updatedFiles,
        citizenName: existing.citizenName || remote.citizenName,
        lawyerName: existing.lawyerName || remote.lawyerName,
      });
    } else {
      currentMap.set(remote.id, remote);
      hasChanges = true;
    }
  });

  if (hasChanges) {
    saveCases(Array.from(currentMap.values()));
  }
}

export function addCase(c: LegalCase) {
  const current = getCases();
  const updated = [c, ...current];
  saveCases(updated);

  // Auto-generate notification for citizen
  addNotification({
    title: "New Case Created",
    body: `Your case "${c.title}" (${c.id}) has been filed successfully${c.lawyerName ? ` and assigned to ${c.lawyerName}` : ""}.`,
  });

  if (c.lawyerName) {
    addNotification({
      title: "Lawyer Assigned",
      body: `${c.lawyerName} was linked to your case ${c.id}. Track updates in your dashboard.`,
    });
  }
}

export function updateCaseStatus(id: string, newStatus: CaseStatus, note?: string) {
  const current = getCases();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const updated = current.map((c) => {
    if (c.id !== id) return c;
    const timeline = c.timeline || [];
    const newTimeline = [
      ...timeline,
      {
        id: `t_${Date.now()}`,
        status: newStatus,
        at: today,
        time,
        note: note || `Status updated to ${newStatus}`,
      },
    ];
    return {
      ...c,
      status: newStatus,
      updatedAt: today,
      timeline: newTimeline,
    };
  });

  saveCases(updated);

  // Notify citizen
  const found = updated.find((x) => x.id === id);
  if (found) {
    addNotification({
      title: `Case Status: ${newStatus}`,
      body: `Case ${id} (${found.title}) status was updated to ${newStatus}${note ? `: "${note}"` : ""}.`,
    });
  }
}

export function assignLawyerToCase(caseId: string, lawyerId?: string, lawyerName?: string) {
  const current = getCases();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const updated = current.map((c) => {
    if (c.id !== caseId) return c;
    const newStatus: CaseStatus = lawyerId
      ? c.status === "Submitted"
        ? "Assigned"
        : c.status
      : c.status;
    const note = lawyerName ? `Assigned to ${lawyerName}` : "Unassigned by admin";
    const timeline = [
      ...(c.timeline || []),
      { id: `t_${Date.now()}`, status: newStatus, at: today, time, note },
    ];
    return {
      ...c,
      lawyerId: lawyerId || undefined,
      lawyerName: lawyerName || undefined,
      status: newStatus,
      updatedAt: today,
      timeline,
    };
  });

  saveCases(updated);

  if (lawyerName) {
    addNotification({
      title: "Lawyer Appointed",
      body: `${lawyerName} has been assigned to your case ${caseId}.`,
    });
  }
}

export function updateCaseFields(id: string, patch: Partial<LegalCase>) {
  const current = getCases();
  const updated = current.map((c) =>
    c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString().slice(0, 10) } : c,
  );
  saveCases(updated);
}

export function addCaseAttachments(caseId: string, docs: CaseDocument[]) {
  const current = getCases();
  const today = new Date().toISOString().slice(0, 10);
  const updated = current.map((c) =>
    c.id === caseId ? { ...c, files: { files: [...c.files.files, ...docs] }, updatedAt: today } : c,
  );
  saveCases(updated);

  const found = updated.find((c) => c.id === caseId);
  if (found) {
    addNotification({
      title: "New Attachment Added",
      body: `${docs.length} new attachment${docs.length === 1 ? "" : "s"} added to case ${caseId} (${found.title}).`,
    });
  }
}

/* ── COURT HISTORY (per-case, caseDetails.historyOfCaseHearings) ─────────── */
export function addCourtHearing(caseId: string, hearing: HistoryOfHearing) {
  const current = getCases();
  const updated = current.map((c) =>
    c.id === caseId
      ? {
          ...c,
          caseDetails: {
            ...c.caseDetails,
            historyOfCaseHearings: [...c.caseDetails.historyOfCaseHearings, hearing],
          },
        }
      : c,
  );
  saveCases(updated);

  const found = updated.find((c) => c.id === caseId);
  if (found) {
    addNotification({
      title: "Hearing Scheduled",
      body: `A hearing for case ${caseId} (${found.title}) has been scheduled on ${hearing.hearingDate ?? hearing.businessOnDate}.`,
    });
  }
}

export function updateCourtHearing(
  caseId: string,
  index: number,
  patch: Partial<HistoryOfHearing>,
) {
  const current = getCases();
  const updated = current.map((c) => {
    if (c.id !== caseId) return c;
    return {
      ...c,
      caseDetails: {
        ...c.caseDetails,
        historyOfCaseHearings: c.caseDetails.historyOfCaseHearings.map((h, i) =>
          i === index ? { ...h, ...patch } : h,
        ),
      },
    };
  });
  saveCases(updated);

  const found = updated.find((c) => c.id === caseId);
  if (found) {
    addNotification({
      title: "Hearing Updated",
      body: `A hearing for case ${caseId} (${found.title}) was updated.`,
    });
  }
}

export function deleteCourtHearing(caseId: string, index: number) {
  const current = getCases();
  const updated = current.map((c) =>
    c.id === caseId
      ? {
          ...c,
          caseDetails: {
            ...c.caseDetails,
            historyOfCaseHearings: c.caseDetails.historyOfCaseHearings.filter(
              (_, i) => i !== index,
            ),
          },
        }
      : c,
  );
  saveCases(updated);
}

/* ── CASE NOTES (per-case) ───────────────────────────────────────────────── */
export function getCaseNotes(caseId: string): CaseNote[] {
  const all = load<CaseNote[]>(NOTES_KEY, []);
  return all
    .filter((n) => n.caseId === caseId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addCaseNote(caseId: string, text: string, author = "You"): CaseNote {
  const all = load<CaseNote[]>(NOTES_KEY, []);
  const note: CaseNote = {
    id: `note_${Date.now()}`,
    caseId,
    text,
    author,
    createdAt: new Date().toISOString(),
  };
  save(NOTES_KEY, [note, ...all]);
  return note;
}

export function deleteCaseNote(noteId: string) {
  const all = load<CaseNote[]>(NOTES_KEY, []);
  save(
    NOTES_KEY,
    all.filter((n) => n.id !== noteId),
  );
}

/* ── LAWYERS STORE ───────────────────────────────────────────────────────── */
export function getLawyers(): Lawyer[] {
  return load<Lawyer[]>(LAWYERS_KEY, []);
}

export function saveLawyers(lawyers: Lawyer[]) {
  save(LAWYERS_KEY, lawyers);
}

/** Fold server advocates into the local store, mirroring `mergeRemoteCases`.
 *
 * Field-wise rather than wholesale: the backend `lawyers` table is a near-1:1
 * match for `Lawyer`, but any column it leaves null must not blank out a value
 * the local store already has. Unresolvable categories keep the local value too,
 * since `category` drives the admin list's filters. */
export function mergeRemoteLawyers(remote: Partial<Lawyer>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getLawyers();
  const byId = new Map(current.map((l) => [l.id, l]));
  let changed = false;

  remote.forEach((r) => {
    if (!r || !r.id) return;
    const existing = byId.get(r.id);

    // `rating` is stored as text server-side; coerce before it reaches the UI.
    const rating =
      r.rating !== undefined && r.rating !== null && !Number.isNaN(Number(r.rating))
        ? Number(r.rating)
        : existing?.rating;

    const category = resolveLegalCategory(r.category) ?? existing?.category;

    const merged: Lawyer = {
      ...(existing ?? ({} as Lawyer)),
      ...definedOnly(r),
      id: r.id,
      name: r.name ?? existing?.name ?? "Advocate",
      email: r.email ?? existing?.email ?? "",
      phone: r.phone ?? existing?.phone ?? "",
      city: r.city ?? existing?.city ?? "",
      barId: r.barId ?? existing?.barId ?? "",
      joinedAt: r.joinedAt ?? existing?.joinedAt ?? new Date().toISOString().slice(0, 10),
      status: r.status ?? existing?.status ?? "Pending",
      experienceYears: r.experienceYears ?? existing?.experienceYears ?? 0,
      activeCases: r.activeCases ?? existing?.activeCases ?? 0,
      rating: rating ?? 0,
      category: category ?? "Civil",
    };

    if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
      byId.set(r.id, merged);
      changed = true;
    }
  });

  if (changed) saveLawyers(Array.from(byId.values()));
}

export function addLawyer(
  lawyer: Omit<Lawyer, "id" | "rating" | "activeCases" | "joinedAt">,
): Lawyer {
  const current = getLawyers();
  const newLawyer: Lawyer = {
    ...lawyer,
    id: `l_${Date.now()}`,
    rating: 5.0,
    activeCases: 0,
    joinedAt: new Date().toISOString().slice(0, 10),
  };
  saveLawyers([newLawyer, ...current]);
  return newLawyer;
}

export function updateLawyerStatus(id: string, status: Lawyer["status"]) {
  const current = getLawyers();
  const updated = current.map((l) => (l.id === id ? { ...l, status } : l));
  saveLawyers(updated);
}

export function updateLawyerProfile(id: string, fields: Partial<Lawyer>) {
  const current = getLawyers();
  const updated = current.map((l) => (l.id === id ? { ...l, ...fields } : l));
  saveLawyers(updated);
}

/* ── LAWYER RATINGS & REVIEWS STORE ──────────────────────────────────────── */
export interface LawyerRatingRecord {
  id: string;
  lawyerId: string;
  caseId: string;
  rating: number; // 0 - 5
  feedback: string;
  citizenName?: string;
  createdAt: string;
  updatedAt: string;
}

export function getLawyerRatings(): LawyerRatingRecord[] {
  return load<LawyerRatingRecord[]>(LAWYER_RATINGS_KEY, []);
}

export function getLawyerRatingForCase(
  caseId: string,
  lawyerId: string,
): LawyerRatingRecord | undefined {
  const all = getLawyerRatings();
  return all.find((r) => r.caseId === caseId && r.lawyerId === lawyerId);
}

/**
 * Mathematical formulation for dynamic rating averaging:
 *
 * Case A (New rating):
 * - Previous rating count: N_old (defaults to lawyer.ratingCount || 1)
 * - Previous average rating: R_old (defaults to lawyer.rating || 5.0)
 * - Previous sum of ratings: S_old = R_old * N_old
 * - New total ratings count: N_new = N_old + 1
 * - New sum of ratings: S_new = S_old + r
 * - New average rating: R_new = S_new / N_new = ((R_old * N_old) + r) / (N_old + 1)
 *
 * Case B (Updating an existing rating for the same case):
 * - Previous rating on this case: r_prev
 * - Total count remains unchanged: N_new = N_old
 * - New sum of ratings: S_new = S_old - r_prev + r
 * - New average rating: R_new = S_new / N_new
 *
 * Clamping & Rounding:
 * - R_clamped = Math.min(5, Math.max(0, R_new))
 * - R_display = Number(R_clamped.toFixed(1))
 */
export function submitLawyerRating({
  lawyerId,
  caseId,
  rating,
  feedback = "",
  citizenName,
}: {
  lawyerId: string;
  caseId: string;
  rating: number;
  feedback?: string;
  citizenName?: string;
}): { newRating: number; newRatingCount: number } {
  // Clamp input rating strictly between 0 and 5
  const clampedRating = Math.min(5, Math.max(0, rating));
  const now = new Date().toISOString();

  const allRatings = getLawyerRatings();
  const existingIndex = allRatings.findIndex((r) => r.caseId === caseId && r.lawyerId === lawyerId);
  const existingRecord = existingIndex >= 0 ? allRatings[existingIndex] : undefined;

  const lawyers = getLawyers();
  const lawyer = lawyers.find((l) => l.id === lawyerId);

  let newRating = clampedRating;
  let newRatingCount = 1;

  if (lawyer) {
    const oldCount = lawyer.ratingCount ?? (lawyer.rating ? 1 : 0);
    const oldAverage = lawyer.rating ?? 5.0;
    const oldSum = oldAverage * oldCount;

    if (existingRecord) {
      // Citizen is updating an existing review for this case
      const prevRating = existingRecord.rating;
      newRatingCount = Math.max(1, oldCount);
      const newSum = oldSum - prevRating + clampedRating;
      newRating = Number((newSum / newRatingCount).toFixed(1));
    } else {
      // First-time review for this case
      newRatingCount = oldCount + 1;
      const newSum = oldSum + clampedRating;
      newRating = Number((newSum / newRatingCount).toFixed(1));
    }

    newRating = Math.min(5, Math.max(0, newRating));

    // Save updated lawyer profile
    const updatedLawyers = lawyers.map((l) =>
      l.id === lawyerId
        ? {
            ...l,
            rating: newRating,
            ratingCount: newRatingCount,
          }
        : l,
    );
    saveLawyers(updatedLawyers);
  }

  // Save or update the rating submission record
  let updatedRatings: LawyerRatingRecord[];
  if (existingIndex >= 0) {
    updatedRatings = allRatings.map((r, i) =>
      i === existingIndex
        ? {
            ...r,
            rating: clampedRating,
            feedback,
            citizenName: citizenName || r.citizenName,
            updatedAt: now,
          }
        : r,
    );
  } else {
    const newRecord: LawyerRatingRecord = {
      id: `rev_${Date.now()}`,
      lawyerId,
      caseId,
      rating: clampedRating,
      feedback,
      citizenName,
      createdAt: now,
      updatedAt: now,
    };
    updatedRatings = [newRecord, ...allRatings];
  }
  save(LAWYER_RATINGS_KEY, updatedRatings);

  if (lawyer) {
    addNotification({
      title: "Rating Submitted",
      body: `You rated ${lawyer.name} ${clampedRating}/5 stars. Average rating is now ${newRating.toFixed(1)} (${newRatingCount}).`,
    });
  }

  return { newRating, newRatingCount };
}

/* ── CITIZENS STORE ──────────────────────────────────────────────────────── */
export function getCitizens(): Citizen[] {
  return load<Citizen[]>(CITIZENS_KEY, []);
}

export function saveCitizens(citizens: Citizen[]) {
  save(CITIZENS_KEY, citizens);
}

/** Fold server citizens into the local store. Same field-wise approach as
 * `mergeRemoteLawyers` — the backend leaves email/phone/city nullable, and a
 * null must not wipe a value the store already holds. */
export function mergeRemoteCitizens(remote: Partial<Citizen>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getCitizens();
  const byId = new Map(current.map((c) => [c.id, c]));
  let changed = false;

  remote.forEach((r) => {
    if (!r || !r.id) return;
    const existing = byId.get(r.id);

    const merged: Citizen = {
      ...(existing ?? ({} as Citizen)),
      ...definedOnly(r),
      id: r.id,
      name: r.name ?? existing?.name ?? "Citizen",
      email: r.email ?? existing?.email ?? "",
      phone: r.phone ?? existing?.phone ?? "",
      city: r.city ?? existing?.city ?? "",
      joinedAt: r.joinedAt ?? existing?.joinedAt ?? new Date().toISOString().slice(0, 10),
      lastLoginAt: r.lastLoginAt ?? existing?.lastLoginAt ?? "",
      status: r.status ?? existing?.status ?? "Active",
    };

    if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
      byId.set(r.id, merged);
      changed = true;
    }
  });

  if (changed) saveCitizens(Array.from(byId.values()));
}

export function updateCitizenStatus(id: string, status: Citizen["status"]) {
  const current = getCitizens();
  const updated = current.map((c) => (c.id === id ? { ...c, status } : c));
  saveCitizens(updated);
}

export function updateCitizenProfile(
  id: string,
  fields: Partial<Pick<Citizen, "name" | "email" | "phone" | "city" | "currentLocation">>,
) {
  const current = getCitizens();
  const updated = current.map((c) => (c.id === id ? { ...c, ...fields } : c));
  saveCitizens(updated);
}

/* ── ADMIN PROFILE STORE ─────────────────────────────────────────────────── */
export interface AdminProfile {
  name: string;
  email: string;
  phone: string;
  city: string;
  currentLocation?: string;
}

const ADMIN_PROFILE_KEY = "cuc_admin_profile_v1";

const DEFAULT_ADMIN_PROFILE: AdminProfile = {
  name: "Platform Ops",
  email: "ops@closeur.legal",
  phone: "+91 90000 11122",
  city: "Hyderabad",
};

export function getAdminProfile(): AdminProfile {
  return load<AdminProfile>(ADMIN_PROFILE_KEY, DEFAULT_ADMIN_PROFILE);
}

export function updateAdminProfile(fields: Partial<AdminProfile>) {
  save(ADMIN_PROFILE_KEY, { ...getAdminProfile(), ...fields });
}

/* ── NOTIFICATIONS STORE ─────────────────────────────────────────────────── */
export function getNotifications(role?: UserRole): AppNotification[] {
  const all = load<AppNotification[]>(NOTIFICATIONS_KEY, []);
  if (!role) return all;
  return all.filter((n) => !n.role || n.role === "all" || n.role === role);
}

export function saveNotifications(notifications: AppNotification[]) {
  save(NOTIFICATIONS_KEY, notifications);
}

/** `at` is rendered verbatim in the notifications list, so server ISO timestamps
 * are normalized to the store's own "YYYY-MM-DD HH:MM" display format. That
 * format also sorts lexicographically, which keeps the newest-first ordering. */
function normalizeNotificationAt(at: string | undefined): string {
  if (!at) return new Date().toISOString().replace("T", " ").slice(0, 16);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(at)) return at;
  const parsed = new Date(at);
  if (Number.isNaN(parsed.getTime())) return at;
  return parsed.toISOString().replace("T", " ").slice(0, 16);
}

/** Fold server notifications into the local store, mirroring `mergeRemoteCases`.
 * Additive: seeded/local-only alerts are kept so the app still works offline. */
export function mergeRemoteNotifications(remote: AppNotification[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getNotifications();
  const byId = new Map(current.map((n) => [n.id, n]));
  let changed = false;

  remote.forEach((r) => {
    if (!r || !r.id) return;
    const existing = byId.get(r.id);
    // Marking read only ever goes one way, and either side may have done it
    // before the other synced — so the union wins and nothing flips back to
    // unread on the next fetch.
    const read = Boolean(existing?.read) || Boolean(r.read);

    if (existing) {
      if (existing.read !== read) {
        byId.set(r.id, { ...existing, read });
        changed = true;
      }
      return;
    }

    byId.set(r.id, {
      id: r.id,
      title: r.title,
      body: r.body,
      at: normalizeNotificationAt(r.at),
      read,
      role: r.role || "all",
    });
    changed = true;
  });

  if (changed) {
    const merged = Array.from(byId.values()).sort((a, b) => b.at.localeCompare(a.at));
    saveNotifications(merged);
  }
}

export function addNotification(n: { title: string; body: string; role?: UserRole | "all" }) {
  const current = getNotifications();
  const todayTime = new Date().toISOString().replace("T", " ").slice(0, 16);
  const newNotif: AppNotification = {
    id: `n_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: n.title,
    body: n.body,
    at: todayTime,
    read: false,
    role: n.role || "citizen",
  };
  saveNotifications([newNotif, ...current]);
}

export function markNotificationRead(id: string) {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
  saveNotifications(updated);
}

export function markAllNotificationsRead() {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, read: true }));
  saveNotifications(updated);
}

export function getVideoCalls(): VideoCall[] {
  return load<VideoCall[]>(VIDEO_CALLS_KEY, []);
}

export function saveVideoCalls(calls: VideoCall[]) {
  save(VIDEO_CALLS_KEY, calls);
}

export function mergeRemoteVideoCalls(remote: Partial<VideoCall>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getVideoCalls();
  const byId = new Map(current.map((v) => [v.id, v]));
  let changed = false;

  remote.forEach((r) => {
    if (!r || !r.id) return;
    const existing = byId.get(r.id);
    const merged: VideoCall = {
      ...(existing ?? ({} as VideoCall)),
      ...definedOnly(r),
      id: r.id,
      caseId: r.caseId ?? existing?.caseId ?? "",
      withName: r.withName ?? existing?.withName ?? "Participant",
      at: r.at ?? existing?.at ?? new Date().toISOString(),
      durationSeconds: r.durationSeconds ?? existing?.durationSeconds ?? 0,
      status: r.status ?? existing?.status ?? "Scheduled",
      role: r.role ?? existing?.role ?? "citizen",
    };

    if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
      byId.set(r.id, merged);
      changed = true;
    }
  });

  if (changed) {
    saveVideoCalls(Array.from(byId.values()));
  }
}

export function getRecentVideoCalls(role: UserRole): VideoCall[] {
  const all = getVideoCalls();
  return all
    .filter((call) => call.role === role)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

/** Records a video consultation. */
export function addVideoCall(entry: {
  id?: string;
  at?: string;
  caseId: string;
  withName: string;
  role: UserRole;
  status: VideoCall["status"];
  durationSeconds?: number;
}) {
  const current = getVideoCalls();
  const call: VideoCall = {
    id: entry.id || `vc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    caseId: entry.caseId,
    withName: entry.withName,
    at: entry.at || new Date().toISOString(),
    durationSeconds: entry.durationSeconds,
    status: entry.status,
    role: entry.role,
  };
  save(VIDEO_CALLS_KEY, [call, ...current]);
}

export function deleteNotification(id: string) {
  const current = getNotifications();
  const updated = current.filter((n) => n.id !== id);
  saveNotifications(updated);
}

/* ── PROFILE PHOTOS STORE ────────────────────────────────────────────────── */
export function getProfilePhoto(role: UserRole): string | undefined {
  const all = load<Partial<Record<UserRole, string>>>(PROFILE_PHOTOS_KEY, {});
  return all[role];
}

export function setProfilePhoto(role: UserRole, dataUrl: string) {
  const all = load<Partial<Record<UserRole, string>>>(PROFILE_PHOTOS_KEY, {});
  save(PROFILE_PHOTOS_KEY, { ...all, [role]: dataUrl });
}

export function clearProfilePhoto(role: UserRole) {
  const all = load<Partial<Record<UserRole, string>>>(PROFILE_PHOTOS_KEY, {});
  const { [role]: _removed, ...rest } = all;
  save(PROFILE_PHOTOS_KEY, rest);
}

/* ── KNOWLEDGE BASE STORE ────────────────────────────────────────────────── */
export function getKnowledgeBase(): KnowledgeItem[] {
  return load<KnowledgeItem[]>(KB_KEY, []);
}

export function saveKnowledgeBase(kb: KnowledgeItem[]) {
  save(KB_KEY, kb);
}

export function mergeRemoteKnowledgeItems(remote: Partial<KnowledgeItem>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getKnowledgeBase();
  const byId = new Map(current.map((k) => [k.id, k]));
  let changed = false;

  remote.forEach((r) => {
    if (!r || !r.id) return;
    const existing = byId.get(r.id);
    const merged: KnowledgeItem = {
      ...(existing ?? ({} as KnowledgeItem)),
      ...definedOnly(r),
      id: r.id,
      title: r.title ?? existing?.title ?? "Legal Document",
      category: r.category ?? existing?.category ?? "General",
      fileName: r.fileName ?? existing?.fileName ?? "doc.pdf",
      fileSize: r.fileSize ?? existing?.fileSize ?? "1.0 MB",
      uploadedAt: r.uploadedAt ?? existing?.uploadedAt ?? new Date().toISOString().slice(0, 10),
      summary: r.summary ?? existing?.summary ?? "",
      tags: r.tags ?? existing?.tags ?? [],
      status: r.status ?? existing?.status ?? "Indexed",
    };

    if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
      byId.set(r.id, merged);
      changed = true;
    }
  });

  if (changed) {
    saveKnowledgeBase(Array.from(byId.values()));
  }
}

/** Adds a knowledge-base entry.
 *
 * `id`/`uploadedAt` are generated for locally-authored items, but items synced
 * from the API pass their own. Overwriting a server id used to strip it, which
 * left the local copy keyed `k_<timestamp>` — so deleting a synced item sent an
 * id the backend had never seen. */
export function addKnowledgeItem(
  item: Omit<KnowledgeItem, "id" | "uploadedAt"> & { id?: string; uploadedAt?: string },
): KnowledgeItem {
  const current = getKnowledgeBase();
  const newItem: KnowledgeItem = {
    ...item,
    id: item.id || `k_${Date.now()}`,
    uploadedAt: item.uploadedAt || new Date().toISOString().slice(0, 10),
  };
  saveKnowledgeBase([newItem, ...current]);
  return newItem;
}

export function deleteKnowledgeItem(id: string) {
  const current = getKnowledgeBase();
  const updated = current.filter((k) => k.id !== id);
  saveKnowledgeBase(updated);
}

/* ── LAWYER PERSONAL DOCUMENTS STORE ("My Docs") ────────────────────────────
   Separate from the admin-curated KnowledgeItem index ("Global Docs") — each
   Lawyer only ever sees and manages their own documents here. */
function getAllLawyerDocuments(): LawyerDocument[] {
  return load<LawyerDocument[]>(LAWYER_DOCS_KEY, []);
}

export function getLawyerDocuments(lawyerId: string): LawyerDocument[] {
  return getAllLawyerDocuments().filter((d) => d.lawyerId === lawyerId);
}

export function addLawyerDocument(doc: Omit<LawyerDocument, "id" | "uploadedAt">): LawyerDocument {
  const current = getAllLawyerDocuments();
  const newDoc: LawyerDocument = {
    ...doc,
    id: `ld_${Date.now()}`,
    uploadedAt: new Date().toISOString().slice(0, 10),
  };
  save(LAWYER_DOCS_KEY, [newDoc, ...current]);
  return newDoc;
}

export function deleteLawyerDocument(id: string) {
  const updated = getAllLawyerDocuments().filter((d) => d.id !== id);
  save(LAWYER_DOCS_KEY, updated);
}

/* ── SUBSCRIPTIONS STORE ("My Subscriptions") ────────────────────────────── */
export function getSubscriptions(citizenId?: string): Subscription[] {
  const all = load<Subscription[]>(SUBSCRIPTIONS_KEY, []);
  const sorted = [...all].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return citizenId ? sorted.filter((s) => s.citizenId === citizenId) : sorted;
}

export function saveSubscriptions(subscriptions: Subscription[]) {
  save(SUBSCRIPTIONS_KEY, subscriptions);
}

export function mergeRemoteSubscriptions(remote: Partial<Subscription>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getSubscriptions();
  const byId = new Map(current.map((s) => [s.id, s]));
  let changed = false;

  remote.forEach((r) => {
    if (!r || !r.id) return;
    const existing = byId.get(r.id);
    const merged: Subscription = {
      ...(existing ?? ({} as Subscription)),
      ...definedOnly(r),
      id: r.id,
      citizenId: r.citizenId ?? existing?.citizenId ?? "u_001",
      planId: r.planId ?? existing?.planId ?? "free",
      planLabel: r.planLabel ?? existing?.planLabel ?? "Free Plan",
      amount: r.amount ?? existing?.amount ?? 0,
      status: r.status ?? existing?.status ?? "Active",
      startedAt: r.startedAt ?? existing?.startedAt ?? new Date().toISOString().slice(0, 10),
      expiresAt:
        r.expiresAt ??
        existing?.expiresAt ??
        new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    };

    if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
      byId.set(r.id, merged);
      changed = true;
    }
  });

  if (changed) {
    saveSubscriptions(Array.from(byId.values()));
  }
}

/** A citizen's membership tier, derived from their real subscription history —
 * NOT a name hash. An active `yearly` plan is Gold, an active `monthly` plan
 * is Silver, and everyone else (daily, free, expired, cancelled, or no plan)
 * is Bronze. Accepts a citizen id ("u_003") or a display name.
 * Returns `null` for anyone who isn't a known citizen. */
export function planTierForCitizen(idOrName: string): "gold" | "silver" | "bronze" | null {
  const key = idOrName.trim();
  const citizens = getCitizens();
  const citizen = key.startsWith("u_")
    ? citizens.find((c) => c.id === key)
    : citizens.find((c) => c.name.toLowerCase() === key.toLowerCase());
  if (!citizen) return null;

  const subs = getSubscriptions(citizen.id);
  const active = subs.find((s) => s.status === "Active");
  if (active?.planId === "yearly") return "gold";
  if (active?.planId === "monthly") return "silver";
  return "bronze";
}

export function addSubscription(
  sub: Omit<Subscription, "id" | "startedAt" | "status">,
): Subscription {
  const current = getSubscriptions();
  // A citizen only has one active plan at a time — starting a new one
  // supersedes whichever plan they were previously on.
  const withPriorExpired = current.map((s) =>
    s.citizenId === sub.citizenId && s.status === "Active"
      ? { ...s, status: "Expired" as const }
      : s,
  );
  const newSub: Subscription = {
    ...sub,
    id: `sub_${Date.now()}`,
    startedAt: new Date().toISOString().slice(0, 10),
    status: "Active",
  };
  save(SUBSCRIPTIONS_KEY, [newSub, ...withPriorExpired]);

  addNotification({
    title: "Subscription Activated",
    body: `Your ${sub.planLabel} Auto-Assign plan (₹${sub.amount}) is now active.`,
  });

  return newSub;
}

export function cancelSubscription(id: string): Subscription | null {
  const current = getSubscriptions();
  let target: Subscription | null = null;
  const updated = current.map((s) => {
    if (s.id === id) {
      target = { ...s, status: "Cancelled" as const };
      return target;
    }
    return s;
  });
  save(SUBSCRIPTIONS_KEY, updated);
  if (target) {
    addNotification({
      title: "Subscription Cancelled",
      body: `Your ${(target as Subscription).planLabel} plan has been cancelled.`,
    });
  }
  return target;
}

/* ── PAYMENTS STORE (Revenue tabs) ───────────────────────────────────────── */
export function getPayments(lawyerId?: string): Payment[] {
  const all = load<Payment[]>(PAYMENTS_KEY, []);
  const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
  return lawyerId ? sorted.filter((p) => p.lawyerId === lawyerId) : sorted;
}

/** Fold server payment receipts into the local store, mirroring the other
 * merge helpers. The backend `payments` table matches `Payment` field-for-field
 * (grossAmount / platformAmount / lawyerAmount), so this is a direct merge. */
export function mergeRemotePayments(remote: Partial<Payment>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getPayments();
  const byId = new Map(current.map((p) => [p.id, p]));
  let changed = false;

  remote.forEach((r) => {
    if (!r || !r.id) return;
    const existing = byId.get(r.id);

    const merged: Payment = {
      ...(existing ?? ({} as Payment)),
      ...definedOnly(r),
      id: r.id,
      source: r.source ?? existing?.source ?? "commission",
      date: r.date ?? existing?.date ?? new Date().toISOString().slice(0, 10),
      status: r.status ?? existing?.status ?? "Completed",
      grossAmount: Number(r.grossAmount ?? existing?.grossAmount ?? 0),
      platformAmount: Number(r.platformAmount ?? existing?.platformAmount ?? 0),
      lawyerAmount: Number(r.lawyerAmount ?? existing?.lawyerAmount ?? 0),
    };

    if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
      byId.set(r.id, merged);
      changed = true;
    }
  });

  if (changed) save(PAYMENTS_KEY, Array.from(byId.values()));
}

/* ── WITHDRAWAL REQUESTS STORE ───────────────────────────────────────────── */
const WITHDRAWALS_KEY = "cuc_withdrawals_v3";

export const seedWithdrawals: WithdrawalRequest[] = [];

export function getWithdrawalRequests(lawyerId?: string): WithdrawalRequest[] {
  const all = load<WithdrawalRequest[]>(WITHDRAWALS_KEY, []);
  const sorted = [...all].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  return lawyerId ? sorted.filter((w) => w.lawyerId === lawyerId) : sorted;
}

/** Fold server withdrawal requests into the local store. The backend
 * `withdrawal_requests` table is a 1:1 match for `WithdrawalRequest`, so this is
 * a straight field-wise merge that never blanks out local values. */
export function mergeRemoteWithdrawals(remote: Partial<WithdrawalRequest>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getWithdrawalRequests();
  const byId = new Map(current.map((w) => [w.id, w]));
  let changed = false;

  remote.forEach((r) => {
    if (!r || !r.id) return;
    const existing = byId.get(r.id);

    const merged: WithdrawalRequest = {
      ...(existing ?? ({} as WithdrawalRequest)),
      ...definedOnly(r),
      id: r.id,
      lawyerId: r.lawyerId ?? existing?.lawyerId ?? "",
      lawyerName: r.lawyerName ?? existing?.lawyerName ?? "Advocate",
      amount: Number(r.amount ?? existing?.amount ?? 0),
      requestedAt: r.requestedAt ?? existing?.requestedAt ?? new Date().toISOString().slice(0, 10),
      status: r.status ?? existing?.status ?? "Pending",
      bankName: r.bankName ?? existing?.bankName ?? "",
      accountNumber: r.accountNumber ?? existing?.accountNumber ?? "",
      ifscCode: r.ifscCode ?? existing?.ifscCode ?? "",
    };

    if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
      byId.set(r.id, merged);
      changed = true;
    }
  });

  if (changed) save(WITHDRAWALS_KEY, Array.from(byId.values()));
}

export function addWithdrawalRequest(
  req: Omit<WithdrawalRequest, "id" | "requestedAt" | "status">,
): WithdrawalRequest {
  const current = getWithdrawalRequests();
  const today = new Date().toISOString().slice(0, 10);
  const newReq: WithdrawalRequest = {
    ...req,
    id: `w_${Date.now()}`,
    requestedAt: today,
    status: "Pending",
  };

  save(WITHDRAWALS_KEY, [newReq, ...current]);

  addNotification({
    title: "New Withdrawal Request",
    body: `${req.lawyerName} submitted a payout withdrawal request of ₹${req.amount.toLocaleString("en-IN")}.`,
    role: "admin",
  });

  return newReq;
}

export function approveWithdrawalRequest(id: string): WithdrawalRequest | undefined {
  const current = getWithdrawalRequests();
  const today = new Date().toISOString().slice(0, 10);
  const refId = `TXN_${Date.now().toString().slice(-8)}`;

  let approvedReq: WithdrawalRequest | undefined;

  const updated = current.map((w) => {
    if (w.id !== id) return w;
    approvedReq = {
      ...w,
      status: "Approved" as const,
      processedAt: today,
      referenceId: refId,
    };
    return approvedReq;
  });

  save(WITHDRAWALS_KEY, updated);

  if (approvedReq) {
    addNotification({
      title: "Withdrawal Approved",
      body: `Your payout of ₹${approvedReq.amount.toLocaleString("en-IN")} has been approved and transferred to your bank account (${approvedReq.bankName}).`,
      role: "lawyer",
    });
  }

  return approvedReq;
}

export function rejectWithdrawalRequest(
  id: string,
  reason?: string,
): WithdrawalRequest | undefined {
  const current = getWithdrawalRequests();
  let rejectedReq: WithdrawalRequest | undefined;

  const updated = current.map((w) => {
    if (w.id !== id) return w;
    rejectedReq = {
      ...w,
      status: "Rejected" as const,
      rejectionReason: reason || "Bank details verification mismatch",
    };
    return rejectedReq;
  });

  save(WITHDRAWALS_KEY, updated);

  if (rejectedReq) {
    addNotification({
      title: "Withdrawal Request Rejected",
      body: `Your payout request of ₹${rejectedReq.amount.toLocaleString("en-IN")} was rejected. Reason: ${reason || "Verification mismatch"}.`,
      role: "lawyer",
    });
  }

  return rejectedReq;
}

/* ── DATA MANAGEMENT STORE (CRUD for Categories, Languages, Cities, Courts) ── */

/**
 * Master case taxonomy — the single source of truth for the public "Find a
 * Lawyer" menu (via `getPracticeAreaTree()` / `lawyerPracticeAreas.ts`) and the
 * admin Data Management → Categories tab. Three tiers: category → sub-category
 * → legal services. The nine browse practice areas plus Cyber/Tax/Environmental
 * for internal lawyer/case classification.
 */
export const DEFAULT_CASE_CATEGORIES: CaseCategoryItem[] = [];
export const DEFAULT_LANGUAGES: LanguageItem[] = [];
export const DEFAULT_CITIES: CityItem[] = [];
export const DEFAULT_COURTS: CourtItem[] = [];
export const DEFAULT_STATES: StateItem[] = [];
export const DEFAULT_COURT_LEVELS: CourtLevelItem[] = [];

// --- Case Categories CRUD ---

/** Normalize a stored `subCategories` value to the tier-2/tier-3 shape.
 * Tolerates the pre-v3 `string[]` form and stray malformed entries. */
function normalizeSubCategories(raw: unknown): CaseSubCategoryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry): CaseSubCategoryItem | null => {
      if (typeof entry === "string") {
        return entry.trim() ? { name: entry.trim(), services: [] } : null;
      }
      if (entry && typeof entry === "object") {
        const name = String((entry as { name?: unknown }).name ?? "").trim();
        if (!name) return null;
        const svc = (entry as { services?: unknown }).services;
        const services: string[] = Array.isArray(svc)
          ? svc
              .map((x: unknown) =>
                typeof x === "string"
                  ? x.trim()
                  : String(
                      (x as { name?: unknown; id?: unknown })?.name ||
                        (x as { name?: unknown; id?: unknown })?.id ||
                        "",
                    ).trim(),
              )
              .filter(Boolean)
          : [];
        const id = (entry as { id?: string }).id;
        return { ...(id ? { id } : {}), name, services };
      }
      return null;
    })
    .filter((x): x is CaseSubCategoryItem => x !== null);
}

export function getCaseCategories(): CaseCategoryItem[] {
  const loaded = load<CaseCategoryItem[]>(CASE_CATEGORIES_KEY, []);
  let changed = false;
  const hydrated = loaded.map((cat) => {
    const normalized = normalizeSubCategories(cat.subCategories);
    if (JSON.stringify(normalized) !== JSON.stringify(cat.subCategories ?? [])) {
      changed = true;
      return { ...cat, subCategories: normalized };
    }
    return cat;
  });
  if (changed) {
    save(CASE_CATEGORIES_KEY, hydrated);
  }
  return hydrated;
}

export function getPracticeAreaTree(): {
  category: string;
  case_types: { case_type: string; legal_services: string[] }[];
}[] {
  return getCaseCategories()
    .filter((c) => c.active)
    .map((c) => ({
      category: c.name,
      case_types: normalizeSubCategories(c.subCategories).map((sc) => ({
        case_type: sc.name,
        legal_services: sc.services,
      })),
    }));
}

export function saveCaseCategory(
  item: Omit<CaseCategoryItem, "id"> & { id?: string },
): CaseCategoryItem {
  const current = getCaseCategories();
  const now = new Date().toISOString().slice(0, 10);
  let saved: CaseCategoryItem;

  if (item.id && current.some((c) => c.id === item.id)) {
    saved = { ...item, id: item.id, updatedAt: now } as CaseCategoryItem;
    const next = current.map((c) => (c.id === item.id ? saved : c));
    save(CASE_CATEGORIES_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `cat_${Date.now()}`,
      updatedAt: now,
    } as CaseCategoryItem;
    save(CASE_CATEGORIES_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteCaseCategory(id: string): boolean {
  const current = getCaseCategories();
  const filtered = current.filter((c) => c.id !== id);
  if (filtered.length !== current.length) {
    save(CASE_CATEGORIES_KEY, filtered);
    return true;
  }
  return false;
}

// --- Languages CRUD ---
export function getLanguages(): LanguageItem[] {
  return load<LanguageItem[]>(LANGUAGES_KEY, []);
}

export function saveLanguage(item: Omit<LanguageItem, "id"> & { id?: string }): LanguageItem {
  const current = getLanguages();
  const now = new Date().toISOString().slice(0, 10);
  let saved: LanguageItem;

  if (item.id && current.some((l) => l.id === item.id)) {
    saved = { ...item, id: item.id, updatedAt: now } as LanguageItem;
    const next = current.map((l) => (l.id === item.id ? saved : l));
    save(LANGUAGES_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `lang_${Date.now()}`,
      updatedAt: now,
    } as LanguageItem;
    save(LANGUAGES_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteLanguage(id: string): boolean {
  const current = getLanguages();
  const filtered = current.filter((l) => l.id !== id);
  if (filtered.length !== current.length) {
    save(LANGUAGES_KEY, filtered);
    return true;
  }
  return false;
}

// --- Courts CRUD ---
export function getCourts(): CourtItem[] {
  return load<CourtItem[]>(COURTS_KEY, []);
}

export function saveCourt(item: Omit<CourtItem, "id"> & { id?: string }): CourtItem {
  const current = getCourts();
  const now = new Date().toISOString().slice(0, 10);
  let saved: CourtItem;

  const district = (item.district || item.city || "").trim();

  if (item.id && current.some((c) => c.id === item.id)) {
    saved = {
      ...item,
      id: item.id,
      city: district,
      district,
      updatedAt: now,
    } as CourtItem;
    const next = current.map((c) => (c.id === item.id ? saved : c));
    save(COURTS_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `crt_${Date.now()}`,
      city: district,
      district,
      updatedAt: now,
    } as CourtItem;
    save(COURTS_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteCourt(id: string): boolean {
  const current = getCourts();
  const filtered = current.filter((c) => c.id !== id);
  if (filtered.length !== current.length) {
    save(COURTS_KEY, filtered);
    return true;
  }
  return false;
}

// --- States & Districts CRUD ---
export function getStates(): StateItem[] {
  return load<StateItem[]>(STATES_KEY, []);
}

export function saveState(item: Omit<StateItem, "id"> & { id?: string }): StateItem {
  const current = getStates();
  const now = new Date().toISOString().slice(0, 10);
  let saved: StateItem;

  const rawDistricts = Array.isArray(item.districts)
    ? item.districts
    : typeof item.districts === "string"
      ? (item.districts as string).split(",")
      : [];
  const districts = Array.from(new Set(rawDistricts.map((d) => String(d).trim()).filter(Boolean)));

  if (item.id && current.some((s) => s.id === item.id)) {
    saved = { ...item, id: item.id, districts, updatedAt: now } as StateItem;
    const next = current.map((s) => (s.id === item.id ? saved : s));
    save(STATES_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `st_${Date.now()}`,
      districts,
      updatedAt: now,
    } as StateItem;
    save(STATES_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteState(id: string): boolean {
  const current = getStates();
  const filtered = current.filter((s) => s.id !== id);
  if (filtered.length !== current.length) {
    save(STATES_KEY, filtered);
    return true;
  }
  return false;
}

// --- Districts & Legacy Cities compatibility getters ---
export function getDistricts(): { id: string; name: string; state: string; active: boolean }[] {
  return getStates().flatMap((st) =>
    (st.districts ?? []).map((d) => ({
      id: `${st.id}_${d}`,
      name: d,
      state: st.name,
      active: st.active,
    })),
  );
}

export function getActiveDistricts(): {
  id: string;
  name: string;
  state: string;
  active: boolean;
}[] {
  return getStates()
    .filter((s) => s.active)
    .flatMap((st) =>
      (st.districts ?? []).map((d) => ({
        id: `${st.id}_${d}`,
        name: d,
        state: st.name,
        active: true,
      })),
    );
}

/** Legacy Cities accessor — maps active states' districts into CityItem shape for backwards compatibility. */
export function getCities(): CityItem[] {
  return getDistricts().map((d) => ({
    id: d.id,
    name: d.name,
    state: d.state,
    tier: "Tier 1" as const,
    active: d.active,
  }));
}

export function saveCity(item: Omit<CityItem, "id"> & { id?: string }): CityItem {
  // If a city is saved, ensure it's added to the state's district list
  if (item.state && item.name) {
    const states = getStates();
    const targetState = states.find((s) => s.name.toLowerCase() === item.state.toLowerCase());
    if (targetState) {
      const districts = targetState.districts || [];
      if (!districts.some((d) => d.toLowerCase() === item.name.toLowerCase())) {
        saveState({
          ...targetState,
          districts: [...districts, item.name],
        });
      }
    }
  }
  return {
    id: item.id || `city_${Date.now()}`,
    name: item.name,
    state: item.state,
    tier: item.tier || "Tier 1",
    active: item.active !== false,
  };
}

export function deleteCity(id: string): boolean {
  return true;
}

// --- Court Levels CRUD ---
export function getCourtLevels(): CourtLevelItem[] {
  return load<CourtLevelItem[]>(COURT_LEVELS_KEY, []);
}

export function saveCourtLevel(item: Omit<CourtLevelItem, "id"> & { id?: string }): CourtLevelItem {
  const current = getCourtLevels();
  const now = new Date().toISOString().slice(0, 10);
  let saved: CourtLevelItem;

  if (item.id && current.some((l) => l.id === item.id)) {
    saved = { ...item, id: item.id, updatedAt: now } as CourtLevelItem;
    const next = current.map((l) => (l.id === item.id ? saved : l));
    save(COURT_LEVELS_KEY, next);
  } else {
    saved = {
      ...item,
      id: item.id || `clv_${Date.now()}`,
      updatedAt: now,
    } as CourtLevelItem;
    save(COURT_LEVELS_KEY, [saved, ...current]);
  }
  return saved;
}

export function deleteCourtLevel(id: string): boolean {
  const current = getCourtLevels();
  const filtered = current.filter((l) => l.id !== id);
  if (filtered.length !== current.length) {
    save(COURT_LEVELS_KEY, filtered);
    return true;
  }
  return false;
}

export function resetDataManagementToDefaults() {
  save(CASE_CATEGORIES_KEY, DEFAULT_CASE_CATEGORIES);
  save(LANGUAGES_KEY, DEFAULT_LANGUAGES);
  save(CITIES_KEY, DEFAULT_CITIES);
  save(COURTS_KEY, DEFAULT_COURTS);
  save(STATES_KEY, DEFAULT_STATES);
  save(COURT_LEVELS_KEY, DEFAULT_COURT_LEVELS);
}

/* ── Active-only master entity convenience getters ────────────────────────── */
export function getActiveCaseCategories(): CaseCategoryItem[] {
  return getCaseCategories().filter((c) => c.active);
}

export function getActiveLanguages(): LanguageItem[] {
  return getLanguages().filter((l) => l.active);
}

export function getActiveCities(): CityItem[] {
  return getCities().filter((c) => c.active);
}

export function getActiveCourts(): CourtItem[] {
  return getCourts().filter((c) => c.active);
}

export function getActiveStates(): StateItem[] {
  return getStates().filter((s) => s.active);
}

export function getActiveCourtLevels(): CourtLevelItem[] {
  return getCourtLevels().filter((cl) => cl.active);
}

/* ── Remote Master Data Synchronization ───────────────────────────────────── */
export function mergeRemoteCaseCategories(remote: Partial<CaseCategoryItem>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getCaseCategories();
  const byId = new Map(current.map((c) => [c.id, c]));
  const byName = new Map(current.map((c) => [c.name.toLowerCase(), c]));
  let changed = false;

  remote.forEach((rc) => {
    if (!rc || !rc.name) return;
    const existing = (rc.id ? byId.get(rc.id) : undefined) || byName.get(rc.name.toLowerCase());
    const merged: CaseCategoryItem = {
      id: rc.id || existing?.id || `cat_${Date.now()}`,
      name: rc.name,
      code: rc.code || existing?.code || rc.name.slice(0, 4).toUpperCase(),
      description: rc.description ?? existing?.description ?? "",
      active: rc.active !== false,
      subCategories:
        rc.subCategories && rc.subCategories.length > 0
          ? rc.subCategories
          : (existing?.subCategories ?? []),
      updatedAt: rc.updatedAt || existing?.updatedAt || new Date().toISOString().slice(0, 10),
    };

    if (existing) {
      const idx = current.findIndex((c) => c.id === existing.id);
      if (idx !== -1) {
        current[idx] = merged;
        changed = true;
      }
    } else {
      current.push(merged);
      changed = true;
    }
  });

  if (changed) {
    save(CASE_CATEGORIES_KEY, current);
  }
}

export function mergeRemoteLanguages(remote: Partial<LanguageItem>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getLanguages();
  const byName = new Map(current.map((l) => [l.name.toLowerCase(), l]));
  let changed = false;

  remote.forEach((rl) => {
    if (!rl || !rl.name) return;
    const existing = byName.get(rl.name.toLowerCase());
    if (!existing) {
      current.push({
        id: rl.id || `lang_${Date.now()}`,
        name: rl.name,
        nativeName: rl.nativeName || rl.name,
        code: rl.code || rl.name.slice(0, 2).toLowerCase(),
        active: rl.active !== false,
        updatedAt: rl.updatedAt || new Date().toISOString().slice(0, 10),
      });
      changed = true;
    }
  });

  if (changed) {
    save(LANGUAGES_KEY, current);
  }
}

export function mergeRemoteCourts(remote: Partial<CourtItem>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getCourts();
  const byName = new Map(current.map((c) => [c.name.toLowerCase(), c]));
  let changed = false;

  remote.forEach((rc) => {
    if (!rc || !rc.name) return;
    const existing = byName.get(rc.name.toLowerCase());
    if (!existing) {
      current.push({
        id: rc.id || `court_${Date.now()}`,
        name: rc.name,
        level: rc.level || "District Court",
        state: rc.state || "Telangana",
        city: rc.city,
        district: rc.district,
        active: rc.active !== false,
        updatedAt: rc.updatedAt || new Date().toISOString().slice(0, 10),
      });
      changed = true;
    }
  });

  if (changed) {
    save(COURTS_KEY, current);
  }
}

export function mergeRemoteStates(remote: Partial<StateItem>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getStates();
  const byName = new Map(current.map((s) => [s.name.toLowerCase(), s]));
  let changed = false;

  remote.forEach((rs) => {
    if (!rs || !rs.name) return;
    const existing = byName.get(rs.name.toLowerCase());
    if (existing) {
      if (Array.isArray(rs.districts) && rs.districts.length > 0) {
        const set = new Set([...(existing.districts || []), ...rs.districts]);
        if (set.size > (existing.districts || []).length) {
          existing.districts = Array.from(set);
          changed = true;
        }
      }
    } else {
      current.push({
        id: rs.id || `st_${Date.now()}`,
        name: rs.name,
        code: rs.code || rs.name.slice(0, 2).toUpperCase(),
        districts: rs.districts || [],
        active: rs.active !== false,
        updatedAt: rs.updatedAt || new Date().toISOString().slice(0, 10),
      });
      changed = true;
    }
  });

  if (changed) {
    save(STATES_KEY, current);
  }
}

export function mergeRemoteCourtLevels(remote: Partial<CourtLevelItem>[]): void {
  if (!Array.isArray(remote) || remote.length === 0) return;
  const current = getCourtLevels();
  const byName = new Map(current.map((cl) => [cl.name.toLowerCase(), cl]));
  let changed = false;

  remote.forEach((rcl) => {
    if (!rcl || !rcl.name) return;
    const existing = byName.get(rcl.name.toLowerCase());
    if (!existing) {
      current.push({
        id: rcl.id || `cl_${Date.now()}`,
        name: rcl.name,
        code: rcl.code || rcl.name.slice(0, 2).toUpperCase(),
        active: rcl.active !== false,
        updatedAt: rcl.updatedAt || new Date().toISOString().slice(0, 10),
      });
      changed = true;
    }
  });

  if (changed) {
    save(COURT_LEVELS_KEY, current);
  }
}
