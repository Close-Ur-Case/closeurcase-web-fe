/**
 * Case Management Service
 * Communicates with /v1/cases endpoints for user cases, imported cases, and CNR lookups.
 */

import { apiClient } from "./apiClient";
import { resolveLegalCategoryOr } from "@/lib/caseCategories";
import type {
  CreateUserCasePayload,
  UpdateLawyerCaseStagePayload,
  ImportCasePayload,
} from "@/types/api";
import type {
  LegalCase,
  CaseStatus,
  LegalCategory,
  CaseDocument,
  TimelineEvent,
  Citizen,
  Lawyer,
  CaseDetails,
  EntityInfo,
  HistoryOfHearing,
  InterimOrder,
  JudgmentOrder,
  AIReport,
} from "@/types";

export interface ListCasesParams {
  citizenId?: string;
  lawyerId?: string;
  status?: string;
  caseType?: string;
  search?: string;
  limit?: number;
  offset?: number;
  [key: string]: string | number | boolean | undefined | null;
}

export interface CaseTypeLookup {
  id: string;
  name: string;
  code: string;
  sortOrder?: number;
}

export interface CaseStageLookup {
  id: string;
  name: string;
  code: string;
  sortOrder?: number;
}

export const caseService = {
  /**
   * List user cases with optional filtering
   */
  async listUserCases<T = Record<string, unknown>>(params?: ListCasesParams): Promise<T[]> {
    return apiClient.get<T[]>("/cases/user", {
      params,
    });
  },

  /**
   * Get single user case details by ID
   */
  async getUserCase<T = Record<string, unknown>>(id: string): Promise<T> {
    return apiClient.get<T>(`/cases/user/${id}`);
  },

  /**
   * Create a new user case and book advocate
   */
  async createUserCase<T = Record<string, unknown>>(payload: CreateUserCasePayload): Promise<T> {
    return apiClient.post<T>("/cases/user", payload);
  },

  /**
   * Update lawyer workflow stage for a case
   */
  async updateCaseStage<T = Record<string, unknown>>(
    id: string,
    payload: UpdateLawyerCaseStagePayload,
  ): Promise<T> {
    return apiClient.patch<T>(`/cases/user/${id}/stage`, payload);
  },

  /**
   * Assign or reassign a lawyer to a case
   */
  async assignLawyer<T = Record<string, unknown>>(caseId: string, lawyerId: string): Promise<T> {
    return apiClient.patch<T>(`/cases/${caseId}/assign-lawyer`, { lawyerId });
  },

  /**
   * Update case details (title, CNR, documents, timeline, notes, status)
   */
  async updateCase<T = Record<string, unknown>>(
    id: string,
    payload: Partial<BackendUserCase> & Record<string, unknown>,
  ): Promise<T> {
    return apiClient.patch<T>(`/cases/user/${id}`, payload);
  },

  /**
   * Permanently delete a case docket
   */
  async deleteCase<T = Record<string, unknown>>(id: string): Promise<T> {
    return apiClient.delete<T>(`/cases/user/${id}`);
  },

  /**
   * Import an eCourts case by CNR number
   */
  async importCase<T = Record<string, unknown>>(payload: ImportCasePayload): Promise<T> {
    return apiClient.post<T>("/cases/imported/import", payload);
  },

  /**
   * Get view-only imported eCourts case by CNR
   */
  async getImportedCase<T = Record<string, unknown>>(cnr: string): Promise<T> {
    return apiClient.get<T>(`/cases/imported/${cnr}`);
  },

  /**
   * Get case types lookup
   */
  async getCaseTypes(): Promise<CaseTypeLookup[]> {
    return apiClient.get<CaseTypeLookup[]>("/cases/types");
  },

  /**
   * Get lawyer case stages lookup
   */
  async getStages(): Promise<CaseStageLookup[]> {
    return apiClient.get<CaseStageLookup[]>("/cases/stages");
  },
};

export interface BackendUserCaseDocument {
  id?: string;
  name: string;
  fileUrl: string;
  size?: string;
  fileMimeType?: string;
  uploadedAt?: string;
}

export interface BackendUserCaseTimelineEvent {
  id?: string;
  status: string;
  at: string;
  time?: string;
  note: string;
}

export interface BackendUserCase {
  id: string;
  citizenId: string;
  lawyerId: string | null;
  caseType: string;
  cnr: string | null;
  petitioner?: string;
  respondent?: string | null;
  title?: string;
  description: string;
  documents?: BackendUserCaseDocument[];
  practiceArea: string;
  specialization?: string;
  legalServices?: string[];
  caseStatus: string;
  lawyerCasestageId: string;
  rejectionReason: string | null;
  isEmergency?: boolean;
  timeline?: BackendUserCaseTimelineEvent[];
  notes?: Array<{ id: string; author: string; text: string; createdAt: string }>;
  importedCase?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function mapBackendCaseToLegalCase(
  backend: BackendUserCase,
  citizensList?: Citizen[],
  lawyersList?: Lawyer[],
): LegalCase {
  const citizen = citizensList?.find((c) => c.id === backend.citizenId);
  const lawyer = lawyersList?.find((l) => l.id === backend.lawyerId);

  // Status mapping
  const rawStatus = (backend.lawyerCasestageId || backend.caseStatus || "submitted").toLowerCase();
  let status: CaseStatus = "Submitted";
  if (rawStatus === "accepted") {
    status = "Assigned";
  } else if (rawStatus === "filinginprogress") {
    status = "In Progress";
  } else if (rawStatus === "cnrgenerated") {
    status = "Assigned";
  } else if (rawStatus === "rejected") {
    status = "Rejected";
  } else if (rawStatus === "closed") {
    status = "Closed";
  }

  // Category mapping — shared with the lawyer merge so both agree on what a
  // backend `cat_N` means. The previous inline table here was mis-keyed.
  const category: LegalCategory = resolveLegalCategoryOr(backend.practiceArea);

  const today = new Date().toISOString().slice(0, 10);
  const createdDate = backend.createdAt ? backend.createdAt.slice(0, 10) : today;
  const updatedDate = backend.updatedAt ? backend.updatedAt.slice(0, 10) : today;

  // Unpack linked eCourts docket details if available
  const rawImp = backend.importedCase?.rawData || backend.importedCase || {};
  const imp = (typeof rawImp === "object" && rawImp !== null ? rawImp : {}) as Record<
    string,
    unknown
  >;
  const impCaseDetails = (imp.caseDetails || imp.case_details || {}) as Record<
    string,
    unknown
  > as Partial<CaseDetails> & Record<string, unknown>;
  const impEntityInfo = (imp.entityInfo || imp.entity_info || {}) as Record<
    string,
    unknown
  > as Partial<EntityInfo>;
  const impFilesObj = imp.files as { files?: Array<Record<string, unknown>> } | undefined;
  const impFiles = Array.isArray(imp.files)
    ? (imp.files as Array<Record<string, unknown>>)
    : Array.isArray(impFilesObj?.files)
      ? impFilesObj.files
      : [];
  const impDescriptions = (imp.descriptions || { enumFields: [], enumLookup: {} }) as {
    enumFields: string[];
    enumLookup: Record<string, Record<string, string>>;
  };
  const impAiAnalysis = (imp.caseAiAnalysis || imp.case_ai_analysis || null) as AIReport | null;

  // Files: merge user documents and eCourts imported files
  const baseFiles: CaseDocument[] = (backend.documents || []).map((d, i) => ({
    id: d.id || `doc_${i}`,
    name: d.name,
    size: d.size || "1.0 MB",
    uploadedAt: d.uploadedAt || createdDate,
    fileDataUrl: d.fileUrl,
    fileMimeType: d.fileMimeType,
    uploadedBy: "citizen",
  }));

  const extraFiles: CaseDocument[] = Array.isArray(impFiles)
    ? impFiles.map((f, i) => ({
        id: (f.id as string) || `imp_doc_${i}`,
        name: (f.name as string) || (f.fileName as string) || `Court Document ${i + 1}`,
        size: (f.size as string) || "1.5 MB",
        uploadedAt: (f.uploadedAt as string) || createdDate,
        fileDataUrl: (f.fileDataUrl as string) || (f.fileUrl as string) || (f.url as string),
        fileMimeType: (f.fileMimeType as string) || "application/pdf",
        uploadedBy: "citizen" as const,
      }))
    : [];

  const filesMap = new Map<string, CaseDocument>();
  [...baseFiles, ...extraFiles].forEach((f) => {
    if (f.name) filesMap.set(f.name.toLowerCase(), f);
  });
  const files: CaseDocument[] = Array.from(filesMap.values());

  const timeline: TimelineEvent[] = (backend.timeline || []).map((t, i) => ({
    id: t.id || `t_${i}`,
    status: (t.status === "accepted"
      ? "Assigned"
      : t.status === "filinginprogress"
        ? "In Progress"
        : t.status === "rejected"
          ? "Rejected"
          : "Submitted") as CaseStatus,
    at: t.at ? t.at.slice(0, 10) : createdDate,
    time: t.time || "12:00 PM",
    note: t.note,
  }));

  const rawHearings = (impCaseDetails.historyOfCaseHearings || []) as Array<
    Partial<HistoryOfHearing> & Record<string, unknown>
  >;
  const historyOfCaseHearings: HistoryOfHearing[] = Array.isArray(rawHearings)
    ? rawHearings.map((h) => ({
        judge: String(h.judge || ""),
        businessOnDate: String(h.businessOnDate || h.hearingDate || createdDate),
        hearingDate: h.hearingDate ? String(h.hearingDate) : undefined,
        time: h.time ? String(h.time) : undefined,
        purposeOfListing: String(h.purposeOfListing || h.purpose || "Hearing"),
      }))
    : [];

  const rawInterimOrders = (impCaseDetails.interimOrders || []) as Array<
    Partial<InterimOrder> & Record<string, unknown>
  >;
  const interimOrders: InterimOrder[] = Array.isArray(rawInterimOrders)
    ? rawInterimOrders.map((o) => ({
        orderDate: String(o.orderDate || createdDate),
        description: String(o.description || "Court Order"),
        orderUrl: o.orderUrl ? String(o.orderUrl) : o.url ? String(o.url) : undefined,
      }))
    : [];

  const rawJudgmentOrders = (impCaseDetails.judgmentOrders || []) as Array<
    Partial<JudgmentOrder> & Record<string, unknown>
  >;
  const judgmentOrders: JudgmentOrder[] = Array.isArray(rawJudgmentOrders)
    ? rawJudgmentOrders.map((j) => ({
        orderDate: String(j.orderDate || createdDate),
        orderType: String(j.orderType || "Final Judgment"),
        orderUrl: j.orderUrl ? String(j.orderUrl) : j.url ? String(j.url) : undefined,
      }))
    : [];

  const petitioners: string[] =
    Array.isArray(impCaseDetails.petitioners) && impCaseDetails.petitioners.length > 0
      ? (impCaseDetails.petitioners as string[])
      : backend.petitioner
        ? [backend.petitioner]
        : [citizen?.name || "Petitioner"];

  const petitionerAdvocates: string[] =
    Array.isArray(impCaseDetails.petitionerAdvocates) &&
    impCaseDetails.petitionerAdvocates.length > 0
      ? (impCaseDetails.petitionerAdvocates as string[])
      : lawyer?.name
        ? [lawyer.name]
        : [];

  const respondents: string[] =
    Array.isArray(impCaseDetails.respondents) && impCaseDetails.respondents.length > 0
      ? (impCaseDetails.respondents as string[])
      : backend.respondent
        ? [backend.respondent]
        : ["Opposing Party"];

  const respondentAdvocates: string[] = Array.isArray(impCaseDetails.respondentAdvocates)
    ? (impCaseDetails.respondentAdvocates as string[])
    : [];

  const orderCount =
    (typeof impCaseDetails.orderCount === "number" ? impCaseDetails.orderCount : undefined) ??
    interimOrders.length + judgmentOrders.length;
  const interimOrderCount =
    (typeof impCaseDetails.interimOrderCount === "number"
      ? impCaseDetails.interimOrderCount
      : undefined) ?? interimOrders.length;
  const judgmentCount =
    (typeof impCaseDetails.judgmentCount === "number" ? impCaseDetails.judgmentCount : undefined) ??
    judgmentOrders.length;
  const hearingCount =
    (typeof impCaseDetails.hearingCount === "number" ? impCaseDetails.hearingCount : undefined) ??
    historyOfCaseHearings.length;

  const caseDetails: CaseDetails = {
    caseNumber: impCaseDetails.caseNumber || backend.id,
    cnr: backend.cnr || impCaseDetails.cnr || undefined,
    courtName: impCaseDetails.courtName || "",
    caseType: impCaseDetails.caseType || backend.caseType || "Civil",
    district: impCaseDetails.district,
    state: impCaseDetails.state,
    stateCode: impCaseDetails.stateCode,
    districtCode: impCaseDetails.districtCode,
    courtCode: impCaseDetails.courtCode ? String(impCaseDetails.courtCode) : undefined,
    courtNo: impCaseDetails.courtNo,
    caseTypeSub: impCaseDetails.caseTypeSub,
    firDetails: impCaseDetails.firDetails,
    historyOfCaseHearings,
    purpose: impCaseDetails.purpose,
    disposalType: impCaseDetails.disposalType,
    disposalTypeRaw: impCaseDetails.disposalTypeRaw,
    contestedStatus: impCaseDetails.contestedStatus,
    lastHearingDate: impCaseDetails.lastHearingDate,
    firstHearingDate: impCaseDetails.firstHearingDate,
    nextHearingDate: impCaseDetails.nextHearingDate,
    decisionDate: impCaseDetails.decisionDate,
    caseDurationDays: impCaseDetails.caseDurationDays,
    filingToFirstHearingDays: impCaseDetails.filingToFirstHearingDays,
    filingNumber: impCaseDetails.filingNumber,
    filingDate: impCaseDetails.filingDate || createdDate,
    registrationNumber: impCaseDetails.registrationNumber,
    registrationDate: impCaseDetails.registrationDate || createdDate,
    judges: Array.isArray(impCaseDetails.judges) ? impCaseDetails.judges : [],
    petitioners,
    petitionerAdvocates,
    respondents,
    respondentAdvocates,
    interimOrders,
    judgmentOrders,
    hasOrders: Boolean(impCaseDetails.hasOrders || orderCount > 0),
    hasJudgments: Boolean(impCaseDetails.hasJudgments || judgmentCount > 0),
    orderCount,
    interimOrderCount,
    judgmentCount,
    hearingCount,
    iaCount: impCaseDetails.iaCount ?? 0,
    taggedMatters: Array.isArray(impCaseDetails.taggedMatters) ? impCaseDetails.taggedMatters : [],
    caseCategoryFacetPath: impCaseDetails.caseCategoryFacetPath,
  };

  const entityInfo: EntityInfo = {
    cnr: backend.cnr || impEntityInfo.cnr,
    nextDateOfHearing: impEntityInfo.nextDateOfHearing,
    lastDateOfHearing: impEntityInfo.lastDateOfHearing,
    dateCreated: impEntityInfo.dateCreated || createdDate,
    dateModified: impEntityInfo.dateModified || updatedDate,
  };

  const computedTitle =
    backend.title ||
    (backend.petitioner
      ? `${backend.petitioner}${backend.respondent ? ` vs ${backend.respondent}` : ""}`
      : "Untitled Case");

  return {
    id: backend.id,
    title: computedTitle,
    description: backend.description,
    category,
    citizenId: backend.citizenId,
    citizenName: citizen?.name || backend.petitioner || "Citizen User",
    lawyerId: backend.lawyerId || undefined,
    lawyerName: lawyer?.name || (backend.lawyerId ? "Assigned Counsel" : undefined),
    status,
    city: citizen?.city || impCaseDetails.district || "Hyderabad",
    createdAt: createdDate,
    updatedAt: updatedDate,
    timeline,
    source: backend.cnr ? "ecourt" : "manual",
    isEmergency: Boolean(backend.isEmergency),
    practiceArea: backend.practiceArea,
    specialization: backend.specialization,
    files: { files },
    caseDetails,
    entityInfo,
    descriptions: impDescriptions,
    caseAiAnalysis: impAiAnalysis,
  };
}
