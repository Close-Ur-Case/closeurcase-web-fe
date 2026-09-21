/**
 * Case Management Service
 * Communicates with /v1/cases endpoints for user cases, imported cases, and CNR lookups.
 */

import { apiClient } from "./apiClient";
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
    return apiClient.post<T>(`/cases/user/${caseId}/assign`, { lawyerId });
  },

  /**
   * Import an eCourts case by CNR number
   */
  async importCase<T = Record<string, unknown>>(payload: ImportCasePayload): Promise<T> {
    return apiClient.post<T>("/cases/import", payload);
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
  title: string;
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

  // Category mapping
  const categoryMap: Record<string, LegalCategory> = {
    cat_1: "Civil",
    cat_2: "Corporate",
    cat_3: "Family",
    cat_4: "Labour",
    cat_5: "Property",
    cat_6: "Criminal",
    cat_7: "Consumer",
    cat_8: "Cyber",
    cat_9: "Tax",
    cat_10: "Environmental",
  };
  const category: LegalCategory =
    categoryMap[backend.practiceArea] ||
    (backend.practiceArea as LegalCategory) ||
    "Civil";

  const today = new Date().toISOString().slice(0, 10);
  const createdDate = backend.createdAt ? backend.createdAt.slice(0, 10) : today;
  const updatedDate = backend.updatedAt ? backend.updatedAt.slice(0, 10) : today;

  const files: CaseDocument[] = (backend.documents || []).map((d, i) => ({
    id: d.id || `doc_${i}`,
    name: d.name,
    size: d.size || "1.0 MB",
    uploadedAt: d.uploadedAt || createdDate,
    fileDataUrl: d.fileUrl,
    fileMimeType: d.fileMimeType,
    uploadedBy: "citizen",
  }));

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

  return {
    id: backend.id,
    title: backend.title,
    description: backend.description,
    category,
    citizenId: backend.citizenId,
    citizenName: citizen?.name || "Citizen User",
    lawyerId: backend.lawyerId || undefined,
    lawyerName: lawyer?.name || (backend.lawyerId ? "Assigned Counsel" : undefined),
    status,
    city: citizen?.city || "Hyderabad",
    createdAt: createdDate,
    updatedAt: updatedDate,
    timeline,
    source: backend.cnr ? "ecourt" : "manual",
    isEmergency: Boolean(backend.isEmergency),
    practiceArea: backend.practiceArea,
    specialization: backend.specialization,
    files: { files },
    caseDetails: {
      caseNumber: backend.id,
      cnr: backend.cnr || undefined,
      fillingNumber: undefined,
      registrationNumber: undefined,
      courtName: undefined,
      district: undefined,
      state: undefined,
      firstHearingDate: undefined,
      nextHearingDate: undefined,
      decisionDate: undefined,
      stageOfCase: status,
      natureOfDisposal: undefined,
      coram: undefined,
      bench: undefined,
      stateCode: undefined,
      districtCode: undefined,
      courtCode: undefined,
      caseStatus: status,
      subordinateCourtInfo: null,
      firDetails: null,
      historyOfCaseHearings: [],
      orders: [],
      transferDetails: [],
      interlocutoryApplications: [],
      acts: [],
      caseCategory: category,
      filingDate: createdDate,
      registrationDate: createdDate,
      purposeOfListing: undefined,
      caseType: backend.caseType || "Civil",
      petitioner: citizen?.name || "Petitioner",
      respondent: "Opposing Party",
      petitionerAdvocate: lawyer?.name || undefined,
      respondentAdvocate: undefined,
      judges: [],
      petitioners: [citizen?.name || "Petitioner"],
      petitionerAdvocates: lawyer?.name ? [lawyer.name] : [],
      respondents: ["Opposing Party"],
      respondentAdvocates: [],
      hasOrders: false,
      hasJudgments: false,
      orderCount: 0,
      interimOrderCount: 0,
      judgmentCount: 0,
      hearingCount: 0,
      iaCount: 0,
      taggedMatters: [],
      judgmentOrders: [],
    },
    entityInfo: { dateCreated: createdDate, dateModified: updatedDate },
    descriptions: { enumFields: [], enumLookup: {} },
    caseAiAnalysis: null,
  };
}
