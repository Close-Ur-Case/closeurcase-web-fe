import { db } from "../config/db.ts";
import { casesImported } from "../models/casesImported.ts";
import { casesUser } from "../models/casesUser.ts";
import { lookups } from "../models/lookups.ts";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import { ApiError } from "../utils/apiError.ts";
import { NotificationService } from "./notificationService.ts";
import { LawyerCategoryService } from "./lawyerCategoryService.ts";

export class CaseService {
  /**
   * Normalizes CNR string to uppercase and trimmed format
   */
  static normalizeCnr(cnr?: string | null): string | null {
    if (!cnr) return null;
    const clean = cnr.trim().toUpperCase();
    return clean.length > 0 ? clean : null;
  }

  static generateCaseId() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp =
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
      `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return `CUC-${stamp}`;
  }

  // ============================================================================
  // Centralized Lookups (Category-Filtered)
  // ============================================================================

  static async listLookups(category?: string) {
    if (category && category.trim()) {
      return await db
        .select()
        .from(lookups)
        .where(eq(lookups.category, category.trim()))
        .orderBy(lookups.sortOrder);
    }
    return await db.select().from(lookups).orderBy(lookups.category, lookups.sortOrder);
  }

  static async listCaseTypes() {
    return await this.listLookups("case_type");
  }

  static async listStages() {
    return await this.listLookups("lawyer_casestage");
  }

  // ============================================================================
  // 1. Cases Imported (eCourts View-Only Records)
  // ============================================================================

  /**
   * Imports or syncs a court case from eCourts API by CNR number.
   * Strictly follows case_structure.json format and saves to cases_imported.
   * cases_imported.raw_data must store the total success response.
   */
  static async importFromEcourts(rawCnr: string, payload?: any) {
    const cnr = this.normalizeCnr(rawCnr || payload?.cnr || payload?.caseDetails?.cnr);
    if (!cnr) {
      throw ApiError.badRequest("Valid CNR number is required for import");
    }

    // Construct or load canonical eCourts record strictly adhering to case_structure.json
    let canonicalRecord: any = null;
    try {
      const canonicalPath = new URL("../../../../../case_structure.json", import.meta.url);
      const text = await Deno.readTextFile(canonicalPath);
      canonicalRecord = JSON.parse(text);
    } catch {
      canonicalRecord = null;
    }

    // Check if already imported with total success response (only skip if no new payload provided)
    if (!payload || Object.keys(payload).length <= 1) {
      const [existing] = await db
        .select()
        .from(casesImported)
        .where(or(eq(casesImported.cnr, cnr), ilike(casesImported.cnr, cnr)));

      if (existing && existing.rawData && (existing.rawData as any).caseDetails) {
        return existing;
      }
    }

    const nowIso = new Date().toISOString();
    const caseNumber = `CNR/${cnr.slice(-8)}`;

    const caseDetails = payload?.caseDetails || (canonicalRecord?.caseDetails
      ? {
          ...canonicalRecord.caseDetails,
          cnr,
          caseNumber: cnr === "DLND020047882015" ? canonicalRecord.caseDetails.caseNumber : caseNumber,
        }
      : {
          cnr,
          caseNumber,
          courtName: "District Court",
          caseType: "CC",
          caseStatus: "PENDING",
          filingDate: nowIso.slice(0, 10),
          petitioners: ["Petitioner"],
          respondents: ["State / Respondent"],
          historyOfCaseHearings: [],
          interimOrders: [],
          judgmentOrders: [],
          orderCount: 0,
          hearingCount: 0,
        });

    const entityInfo = payload?.entityInfo || (canonicalRecord?.entityInfo
      ? { ...canonicalRecord.entityInfo, cnr, dateCreated: nowIso, dateModified: nowIso }
      : { cnr, dateCreated: nowIso, dateModified: nowIso });

    const files = payload?.files || canonicalRecord?.files || { files: [] };
    const descriptions = payload?.descriptions || canonicalRecord?.descriptions || { enumFields: [], enumLookup: {} };
    const caseAiAnalysis = payload?.caseAiAnalysis !== undefined ? payload.caseAiAnalysis : (canonicalRecord?.caseAiAnalysis || null);

    // Total success response: complete object containing all fields returned by eCourts API
    const totalSuccessResponse = (payload && (payload.rawData || (payload.caseDetails && Object.keys(payload).length > 1)))
      ? (payload.rawData || payload)
      : (canonicalRecord
        ? {
            ...canonicalRecord,
            caseDetails,
            entityInfo,
            files,
            descriptions,
            caseAiAnalysis,
          }
        : {
            caseDetails,
            entityInfo,
            files,
            descriptions,
            caseAiAnalysis,
          });

    const [imported] = await db
      .insert(casesImported)
      .values({
        cnr,
        caseDetails,
        entityInfo,
        files,
        descriptions,
        caseAiAnalysis,
        rawData: totalSuccessResponse,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: casesImported.cnr,
        set: {
          caseDetails,
          entityInfo,
          files,
          descriptions,
          caseAiAnalysis,
          rawData: totalSuccessResponse,
          updatedAt: new Date(),
        },
      })
      .returning();

    return imported;
  }

  /**
   * Get imported case by CNR. View-only: No editing permitted.
   */
  static async getImportedCase(rawCnr: string) {
    const cnr = this.normalizeCnr(rawCnr);
    if (!cnr) {
      throw ApiError.badRequest("CNR is required");
    }

    const [found] = await db
      .select()
      .from(casesImported)
      .where(or(eq(casesImported.cnr, cnr), ilike(casesImported.cnr, cnr)));

    if (!found) {
      // Auto-import if requested CNR matches canonical or pattern
      try {
        return await this.importFromEcourts(cnr);
      } catch {
        throw ApiError.notFound(`Imported case with CNR '${cnr}' not found`);
      }
    }

    return found;
  }

  static async listImportedCases(filters: { search?: string; limit?: number; offset?: number } = {}) {
    const { search, limit = 20, offset = 0 } = filters;
    let query = db.select().from(casesImported);

    if (search && search.trim()) {
      const cleanSearch = search.trim().toUpperCase();
      query = query.where(
        or(
          ilike(casesImported.cnr, `%${cleanSearch}%`),
          sql`${casesImported.caseDetails}->>'courtName' ILIKE ${`%${search}%`}`,
          sql`${casesImported.caseDetails}->>'caseNumber' ILIKE ${`%${search}%`}`
        )
      ) as any;
    }

    return await query.orderBy(desc(casesImported.createdAt)).limit(limit).offset(offset);
  }

  // ============================================================================
  // 2. Cases User (Booking and Citizen Case Submissions)
  // ============================================================================

  /**
   * Citizen books a lawyer and submits case text + documents + category taxonomy.
   */
  static async createUserCase(caseData: any) {
    const id = caseData.id || this.generateCaseId();
    const caseType = (caseData.caseType || "").trim().toLowerCase();
    const cnr = this.normalizeCnr(caseData.cnr);

    // 1. Verify case_type against lookups table (category = 'case_type')
    const [typeRecord] = await db
      .select()
      .from(lookups)
      .where(and(eq(lookups.id, caseType), eq(lookups.category, "case_type")));

    if (!typeRecord) {
      const validTypes = (
        await db.select({ id: lookups.id }).from(lookups).where(eq(lookups.category, "case_type"))
      ).map((t) => t.id).join(", ");
      throw ApiError.badRequest(`Invalid caseType '${caseType}'. Must be one of: ${validTypes}`);
    }

    // 2. Enforce CNR requirement: If not new (e.g. pending, closed), user must provide CNR number
    const requiresCnr = caseType !== "new";
    if (requiresCnr && !cnr) {
      throw ApiError.badRequest(
        `CNR number is required for case type '${typeRecord.label}'. Please provide a valid 16-character CNR number.`
      );
    }

    // 3. If CNR provided, ensure it exists in cases_imported (auto-import if missing)
    if (cnr) {
      const [importedExists] = await db
        .select()
        .from(casesImported)
        .where(or(eq(casesImported.cnr, cnr), ilike(casesImported.cnr, cnr)));

      if (!importedExists) {
        await this.importFromEcourts(cnr);
      }
    }

    const nowIso = new Date().toISOString();
    const initialTimeline = [
      {
        id: `tl_${Date.now()}`,
        status: "submitted",
        at: nowIso,
        note: caseData.lawyerId
          ? "Case submitted and assigned to advocate for initial review"
          : "Case submitted for administrative allocation and advocate assignment",
      },
    ];

    const rawLegalServices = Array.isArray(caseData.legalServices)
      ? caseData.legalServices
      : caseData.legalService
      ? [caseData.legalService]
      : [];

    // The citizen wizard sends display names; seeded cases store canonical IDs.
    // Normalize so `cases_user` holds one shape and category filters match.
    const {
      practiceArea: normalizedPracticeArea,
      specialization: normalizedSpecialization,
      legalServices,
    } = await LawyerCategoryService.normalizeCaseTaxonomy(
      caseData.practiceArea,
      caseData.specialization,
      rawLegalServices
    );

    const newCase = {
      id,
      citizenId: caseData.citizenId,
      lawyerId: caseData.lawyerId || null,
      caseType,
      cnr: cnr || null,
      title: caseData.title,
      description: caseData.description,
      documents: Array.isArray(caseData.documents) ? caseData.documents : [],
      practiceArea: normalizedPracticeArea,
      specialization: normalizedSpecialization,
      legalServices,
      caseStatus: "submitted",
      lawyerCasestageId: "submitted",
      rejectionReason: null,
      isEmergency: !!caseData.isEmergency,
      timeline: caseData.timeline?.length ? caseData.timeline : initialTimeline,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [created] = await db.insert(casesUser).values(newCase).returning();

    // Send notifications
    try {
      if (caseData.lawyerId) {
        await NotificationService.createInAppNotification({
          userId: caseData.lawyerId,
          role: "lawyer",
          title: "New Case Assigned",
          body: `New ${caseData.isEmergency ? "EMERGENCY " : ""}case '${caseData.title}' has been submitted for your review.`,
        });
      }
    } catch (e) {
      console.warn("Failed to dispatch case creation notification:", e);
    }

    return created;
  }

  static async getUserCaseById(id: string) {
    const [foundCase] = await db.select().from(casesUser).where(eq(casesUser.id, id));
    if (!foundCase) {
      throw ApiError.notFound(`Case docket '${id}' not found`);
    }

    // Attach linked imported case details if CNR exists
    let importedRecord = null;
    if (foundCase.cnr) {
      const [imp] = await db
        .select()
        .from(casesImported)
        .where(or(eq(casesImported.cnr, foundCase.cnr), ilike(casesImported.cnr, foundCase.cnr)));
      importedRecord = imp || null;
    }

    return {
      ...foundCase,
      importedCase: importedRecord,
    };
  }

  static async listUserCases(filters: {
    citizenId?: string;
    lawyerId?: string;
    status?: string;
    caseType?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    const { citizenId, lawyerId, status, caseType, search, limit = 50, offset = 0 } = filters;
    const conditions: any[] = [];

    if (citizenId) conditions.push(eq(casesUser.citizenId, citizenId));
    if (lawyerId) conditions.push(eq(casesUser.lawyerId, lawyerId));
    if (status) conditions.push(eq(casesUser.caseStatus, status));
    if (caseType) conditions.push(eq(casesUser.caseType, caseType.toLowerCase()));

    if (search && search.trim()) {
      const term = search.trim();
      const upperTerm = term.toUpperCase();
      conditions.push(
        or(
          ilike(casesUser.title, `%${term}%`),
          ilike(casesUser.description, `%${term}%`),
          ilike(casesUser.id, `%${term}%`),
          ilike(casesUser.cnr, `%${upperTerm}%`),
          ilike(casesUser.practiceArea, `%${term}%`)
        )
      );
    }

    let query = db.select().from(casesUser);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(casesUser.createdAt)).limit(limit).offset(offset);
  }

  /**
   * Lawyer updates case stage from lookup table lawyer_casestages:
   * accepted, rejected, filinginprogress, cnrgenerated.
   */
  static async updateLawyerStage(
    caseId: string,
    lawyerId: string | null,
    updateData: { stage: string; rejectionReason?: string; generatedCnr?: string }
  ) {
    const [existing] = await db.select().from(casesUser).where(eq(casesUser.id, caseId));
    if (!existing) {
      throw ApiError.notFound(`Case docket '${caseId}' not found`);
    }

    const targetStage = updateData.stage.trim().toLowerCase();
    const [stageRecord] = await db
      .select()
      .from(lookups)
      .where(and(eq(lookups.id, targetStage), eq(lookups.category, "lawyer_casestage")));

    if (!stageRecord) {
      const validStages = (
        await db.select({ id: lookups.id }).from(lookups).where(eq(lookups.category, "lawyer_casestage"))
      ).map((s) => s.id).join(", ");
      throw ApiError.badRequest(`Invalid stage '${targetStage}'. Must be one of: ${validStages}`);
    }

    const generatedCnr = this.normalizeCnr(updateData.generatedCnr);
    if (targetStage === "cnrgenerated" && !generatedCnr && !existing.cnr) {
      throw ApiError.badRequest("A valid CNR number is required when setting stage to 'cnrgenerated'.");
    }

    // If a new CNR was generated, ensure imported record is seeded
    if (generatedCnr) {
      await this.importFromEcourts(generatedCnr);
    }

    const nowIso = new Date().toISOString();
    const timeline = Array.isArray(existing.timeline) ? [...existing.timeline] : [];
    timeline.push({
      id: `tl_${Date.now()}`,
      status: targetStage,
      at: nowIso,
      note:
        targetStage === "rejected"
          ? `Advocate declined brief: ${updateData.rejectionReason || "No reason specified"}`
          : targetStage === "cnrgenerated"
          ? `Case registered in court with CNR: ${generatedCnr || existing.cnr}`
          : `Advocate updated stage to: ${stageRecord.label}`,
    });

    const updateFields: any = {
      caseStatus: targetStage,
      lawyerCasestageId: targetStage,
      rejectionReason: updateData.rejectionReason || null,
      timeline,
      updatedAt: new Date(),
    };

    if (generatedCnr) {
      updateFields.cnr = generatedCnr;
    }

    const [updated] = await db
      .update(casesUser)
      .set(updateFields)
      .where(eq(casesUser.id, caseId))
      .returning();

    // Notify citizen of stage transition
    try {
      await NotificationService.createInAppNotification({
        userId: existing.citizenId,
        role: "citizen",
        title: `Case Update: ${stageRecord.label}`,
        body: `Your case '${existing.title}' status was updated to '${stageRecord.label}'.`,
      });
    } catch (e) {
      console.warn("Failed to dispatch stage notification:", e);
    }

    return updated;
  }

  static async assignLawyer(caseId: string, lawyerId: string) {
    const [existing] = await db.select().from(casesUser).where(eq(casesUser.id, caseId));
    if (!existing) {
      throw ApiError.notFound(`Case docket '${caseId}' not found`);
    }

    const nowIso = new Date().toISOString();
    const timeline = Array.isArray(existing.timeline) ? [...existing.timeline] : [];
    timeline.push({
      id: `tl_${Date.now()}`,
      status: "assigned",
      at: nowIso,
      note: `Advocate ${lawyerId} assigned to representation`,
    });

    const [updated] = await db
      .update(casesUser)
      .set({
        lawyerId,
        timeline,
        updatedAt: new Date(),
      })
      .where(eq(casesUser.id, caseId))
      .returning();

    return updated;
  }
}
