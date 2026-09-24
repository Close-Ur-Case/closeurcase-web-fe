export type UserRole = "citizen" | "lawyer" | "admin";

export type CaseStatus =
  | "Pending"
  | "Submitted"
  | "Assigned"
  | "Rejected"
  | "Under Review"
  | "In Progress"
  | "Awaiting Documents"
  | "Resolved"
  | "Closed";

export type LegalCategory =
  | "Criminal"
  | "Civil"
  | "Property"
  | "Family"
  | "Consumer"
  | "Cyber"
  | "Corporate"
  | "Labour"
  | "Tax"
  | "Environmental";

export interface Citizen {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  currentLocation?: string;
  avatarUrl?: string;
  joinedAt: string;
  lastLoginAt: string;
  status: "Active" | "Inactive";
}

export interface LawyerPracticeArea {
  name: string;
}

export interface LawyerAward {
  title: string;
  year: string;
}

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  cities?: string[];
  phone: string;
  category: LegalCategory;
  roleTitle?: string;
  city: string;
  currentLocation?: string;
  /** Neighbourhood/locality within `city` (e.g. "Gachibowli"), used to narrow
   * down the "Find a Lawyer" browse list once a city is picked. */
  area?: string;
  /** ISO date (YYYY-MM-DD) the Lawyer's account was registered. */
  joinedAt: string;
  barId: string;
  experienceYears: number;
  rating: number;
  status: "Pending" | "Approved" | "Rejected" | "Suspended";
  activeCases: number;
  photoUrl?: string;
  /** Data URL of the uploaded ID proof document, captured at registration. */
  idProofUrl?: string;
  idProofFileName?: string;
  officeAddress?: string;
  bio?: string;
  languages?: string[];
  practiceAreas?: (string | LawyerPracticeArea)[];
  specializations?: string[];
  /** Specific legal services offered, one level more granular than
   * `specializations` — e.g. specialization "Divorce" -> legal service
   * "File for Divorce". Mirrors the 3rd tier of the practice-area picker. */
  legalServices?: string[];
  courts?: string[];
  awards?: LawyerAward[];
  ratingCount?: number;
  consultationFee?: number;
  /** Lawyer-controlled presence shown as a green/red dot on their avatar
   * everywhere. Independent of `status` (admin-controlled moderation state) —
   * a `Suspended` lawyer's presence is overridden and locked in the UI. */
  availabilityStatus?: "Online" | "Offline";
  /** Bank account details for withdrawals. `accountNumber` and `ifscCode` are
   * masked in the UI once set and can only be entered once. */
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  password?: string;
}

export type SubscriptionPlanId = "free" | "daily" | "monthly" | "yearly";

/** A citizen's Auto-Assign subscription — created when they pay for a plan
 * on the "Find a Lawyer" wizard's admin-assign step. */
export interface Subscription {
  id: string;
  citizenId: string;
  planId: SubscriptionPlanId;
  planLabel: string;
  amount: number;
  /** ISO date (YYYY-MM-DD) the plan was purchased/started. */
  startedAt: string;
  status: "Active" | "Cancelled" | "Expired";
  /** The case this subscription was purchased for, if any. */
  caseId?: string;
  expiresAt?: string;
}

/** "commission" covers the platform's cut of lawyer consultations and case
 * settlements; "subscription" covers a citizen's Auto-Assign plan purchase. */
export type PaymentSource = "commission" | "subscription";

export type PaymentStatus = "Completed" | "Processing";

export type WithdrawalStatus = "Pending" | "Approved" | "Rejected";

export interface WithdrawalRequest {
  id: string;
  lawyerId: string;
  lawyerName: string;
  amount: number;
  requestedAt: string;
  status: WithdrawalStatus;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  processedAt?: string;
  referenceId?: string;
  rejectionReason?: string;
}

/** A single money movement on the platform — a citizen paying for a
 * consultation or an Auto-Assign subscription, or the platform's commission
 * share of a lawyer's case settlement. Backs both the lawyer and admin
 * Revenue tabs. */
export interface Payment {
  id: string;
  source: PaymentSource;
  /** ISO date (YYYY-MM-DD) the payment was made. */
  date: string;
  status: PaymentStatus;
  citizenId?: string;
  citizenName?: string;
  lawyerId?: string;
  lawyerName?: string;
  caseId?: string;
  caseTitle?: string;
  /** Total amount paid by the citizen. */
  grossAmount: number;
  /** Platform's commission cut of `grossAmount` (0 for subscription payments,
   * which go to the platform in full). */
  platformAmount: number;
  /** Amount credited to the lawyer, i.e. `grossAmount - platformAmount`. */
  lawyerAmount: number;
}

export interface CaseDocument {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
  /** Data URL of the actual uploaded file, when a real file was captured. */
  fileDataUrl?: string;
  fileMimeType?: string;
  uploadedBy?: "citizen" | "lawyer";
}

export interface TimelineEvent {
  id: string;
  status: CaseStatus;
  at: string;
  /** Time of day the status changed, e.g. "3:45 PM" — kept separate from `at` (a bare date). */
  time?: string;
  note?: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface AIReport {
  id?: string;
  caseId: string;
  generatedAt?: string;
  summary: string;
  relevantActs?: string[];
  applicableSections?: { section: string; description: string }[];
  arguments?: string[];
  counterArguments?: string[];
  recommendations?: string[];
  confidenceScore?: number;
  strengthScore?: number;
  strengths?: string[];
  weaknesses?: string[];
  recommendedActions?: string[];
  relevantPrecedents?: string[];
  suggestedTimeline?: { step: string; targetDays: string }[];
}

/** One row of an eCourts case's "Case History" table — mirrors
 * `case_structure.json`'s `caseDetails.historyOfCaseHearings[]` exactly. */
export interface HistoryOfHearing {
  judge: string;
  /** ISO date — the previous hearing's date (or the filing date for the
   * first entry). */
  businessOnDate: string;
  /** ISO date — omitted on the final/disposed entry, which has no future
   * hearing. */
  hearingDate?: string;
  /** Time of day of the hearing, e.g. "11:00 AM" — kept separate from
   * `hearingDate` (a bare date), like `TimelineEvent.time`. Not part of
   * case_structure.json's own shape, but useful when this app schedules
   * the hearing itself rather than importing a historical record. */
  time?: string;
  purposeOfListing: string;
}

export interface InterimOrder {
  orderDate: string;
  description: string;
  orderUrl?: string;
}

export interface JudgmentOrder {
  orderDate: string;
  orderType: string;
  orderUrl?: string;
}

export interface FirDetails {
  caseNumber: string;
  policeStation: string;
  year: string;
}

export interface TaggedMatter {
  type: string;
  caseNumber: string;
}

/** The eCourts-shaped court record for a case — mirrors
 * `case_structure.json`'s `caseDetails` object. Nested (rather than flat on
 * `LegalCase`) so the shape tracks the source JSON exactly. */
export interface CaseDetails {
  caseNumber?: string;
  district?: string;
  state?: string;
  stateCode?: string;
  districtCode?: string;
  courtCode?: string;
  caseTypeSub?: string;
  courtName: string;
  courtNo?: number;
  firDetails?: FirDetails;
  historyOfCaseHearings: HistoryOfHearing[];
  purpose?: string;
  disposalType?: string;
  disposalTypeRaw?: string;
  contestedStatus?: "CONTESTED" | "UNCONTESTED";
  lastHearingDate?: string;
  interimOrders: InterimOrder[];
  /** CNR (Case Number Record) — the unique eCourts identifier. */
  cnr?: string;
  cnrCourtCode?: string;
  cnrCaseNumber?: string;
  cnrYear?: string;
  caseType?: string;
  caseTypeRaw?: string;
  /** eCourts' own case-lifecycle status (e.g. "DISPOSED") — distinct from
   * `LegalCase.status`, this app's own lawyer-workflow pipeline status. */
  caseStatus?: string;
  filingNumber?: string;
  filingDate?: string;
  registrationNumber?: string;
  registrationDate?: string;
  firstHearingDate?: string;
  nextHearingDate?: string;
  decisionDate?: string;
  caseDurationDays?: number;
  filingToFirstHearingDays?: number;
  judges: string[];
  petitioners: string[];
  petitionerAdvocates: string[];
  respondents: string[];
  respondentAdvocates: string[];
  /** Slash-delimited taxonomy path, e.g. "Criminal Law/Other Criminal Matters". */
  caseCategoryFacetPath?: string;
  hasOrders: boolean;
  hasJudgments: boolean;
  orderCount: number;
  interimOrderCount: number;
  judgmentCount: number;
  hearingCount: number;
  iaCount: number;
  taggedMatters: TaggedMatter[];
  judgmentOrders: JudgmentOrder[];
}

/** Compact CNR/date summary — mirrors `case_structure.json`'s `entityInfo`. */
export interface EntityInfo {
  cnr?: string;
  /** ISO datetime. */
  nextDateOfHearing?: string;
  /** ISO datetime. */
  lastDateOfHearing?: string;
  /** ISO datetime. */
  dateCreated: string;
  /** ISO datetime. */
  dateModified: string;
}

/** Enum-code lookups — mirrors `case_structure.json`'s `descriptions`. */
export interface CaseDescriptions {
  enumFields: string[];
  enumLookup: Record<string, Record<string, string>>;
}

export interface LegalCase {
  // Platform / CloseUrCase workflow fields — no case_structure.json
  // equivalent, so these stay flat rather than nesting.
  id: string;
  /** "X vs Y" display title — a platform concept, not part of eCourts data. */
  title: string;
  /** Citizen's own free-text case description. */
  description: string;
  category: LegalCategory;
  citizenId?: string;
  citizenName: string;
  lawyerId?: string;
  lawyerName?: string;
  /** This app's own lawyer-workflow pipeline status. */
  status: CaseStatus;
  city: string;
  createdAt: string;
  updatedAt: string;
  /** Platform status-change log (Pending by Lawyer → Accepted → …). */
  timeline: TimelineEvent[];
  source?: "manual" | "ecourt";
  isEmergency?: boolean;
  emergencyReason?: string;
  /** True when this case originated from a citizen's WhatsApp conversation
   * with the platform, rather than the in-app case creation wizard. */
  viaWhatsApp?: boolean;
  practiceArea?: string;
  specialization?: string;
  legalService?: string;

  // eCourts-shaped nested data — mirrors case_structure.json exactly.
  caseDetails: CaseDetails;
  entityInfo: EntityInfo;
  files: { files: CaseDocument[] };
  descriptions: CaseDescriptions;
  caseAiAnalysis: AIReport | null;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  role?: UserRole | "all";
}

export type VideoCallStatus = "scheduled" | "completed" | "missed" | "cancelled" | "Scheduled";

/** A past video consultation between a citizen and a lawyer. */
export interface VideoCall {
  id: string;
  caseId: string;
  /** Display name of the other party on the call. */
  withName: string;
  /** ISO timestamp of when the call started. */
  at: string;
  /** Present for completed calls. */
  durationSeconds?: number;
  status: VideoCallStatus;
  /** Which dashboard this call appears on. */
  role: UserRole;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  type: "Act" | "Rule" | "Regulation" | "Amendment" | "Judgement" | "Order";
  category: LegalCategory;
  uploadedAt: string;
  size: string;
  fileSize?: string;
  summary?: string;
  tags?: string[];
  status?: string;
  /** Data URL of the actual uploaded file, when a real file was selected on upload. */
  fileDataUrl?: string;
  fileName?: string;
  fileMimeType?: string;
}

/** A Lawyer's own personal reference document — separate from the admin-
 * curated, shared `KnowledgeItem` index ("Global Docs"). */
export interface LawyerDocument {
  id: string;
  lawyerId: string;
  title: string;
  uploadedAt: string;
  size: string;
  fileDataUrl?: string;
  fileName?: string;
  fileMimeType?: string;
}

/* ── Admin Data Management Master Interfaces ─────────────────────────────── */

/** Tier-2 of the case taxonomy — a case type / specialization under a category
 * (e.g. "Anticipatory Bail" under "Criminal Defense"), carrying its tier-3
 * legal services (e.g. "File Anticipatory Bail Application"). */
export interface CaseServiceItem {
  id: string;
  name: string;
}

export interface CaseSubCategoryItem {
  id?: string;
  name: string;
  services: string[];
  serviceItems?: CaseServiceItem[];
}

export interface CaseCategoryItem {
  id: string;
  name: string;
  code: string;
  description: string;
  subCategories?: CaseSubCategoryItem[];
  active: boolean;
  updatedAt?: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  nativeName: string;
  code: string;
  active: boolean;
  updatedAt?: string;
}

export interface CityItem {
  id: string;
  name: string;
  state: string;
  tier: "Tier 1" | "Tier 2" | "Tier 3";
  active: boolean;
  updatedAt?: string;
}

export interface DistrictItem {
  id: string;
  name: string;
  state: string;
  active: boolean;
  updatedAt?: string;
}

export interface CourtItem {
  id: string;
  name: string;
  /** One of the managed Court Level names (see `CourtLevelItem`) — a plain
   * string rather than a fixed union so levels can be added/removed by admins. */
  level: string;
  state: string;
  city?: string;
  district?: string;
  active: boolean;
  updatedAt?: string;
}

export interface StateItem {
  id: string;
  name: string;
  /** Short code, e.g. "TS", "AP", "MH". */
  code: string;
  /** Districts belonging to this State / UT. */
  districts?: string[];
  active: boolean;
  updatedAt?: string;
}

export interface CourtLevelItem {
  id: string;
  name: string;
  /** Short code, e.g. "SC", "HC", "DC", "TRB". */
  code: string;
  active: boolean;
  updatedAt?: string;
}
