import { db } from "../config/db.ts";
import { cases } from "../models/cases.ts";
import { caseHearings } from "../models/hearings.ts";
import { caseOrders } from "../models/orders.ts";
import { caseNotes } from "../models/notes.ts";
import { caseDocuments } from "../models/documents.ts";
import { eq, desc, and, or, ilike } from "drizzle-orm";
import { ApiError } from "../utils/apiError.ts";
import { NotificationService } from "./notificationService.ts";

export class CaseService {
  static generateCaseId() {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp =
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
      `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    return `CUC ID - ${stamp}`;
  }

  static async createCase(caseData: any) {
    const id = caseData.id || this.generateCaseId();
    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);
    const timeStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    // Canonical CNR handling — eCourts unique 16-char identifier
    const cnr = (caseData.cnr || caseData.caseDetails?.cnr || caseData.entityInfo?.cnr || "").trim() || null;

    if (cnr) {
      const [existing] = await db.select().from(cases).where(eq(cases.cnr, cnr));
      if (existing) {
        throw ApiError.conflict(`A case with CNR number '${cnr}' already exists (Case ID: ${existing.id})`);
      }
    }

    const initialTimeline = [
      {
        id: `tl_${Date.now()}`,
        status: caseData.status || "Pending",
        at: today,
        time: timeStr,
        note: caseData.lawyerName
          ? `Case filed and assigned to ${caseData.lawyerName}`
          : "Case submitted for administrative review and lawyer matching",
      },
    ];

    const caseDetails = {
      ...(caseData.caseDetails || {}),
      ...(cnr ? { cnr } : {}),
    };

    const entityInfo = {
      ...(caseData.entityInfo || { dateCreated: nowIso, dateModified: nowIso }),
      ...(cnr ? { cnr } : {}),
    };

    const newCase = {
      id,
      cnr,
      title: caseData.title || (caseDetails.petitioners?.[0] ? `${caseDetails.petitioners[0]} vs ${caseDetails.respondents?.[0] || "State"}` : "Court Matter"),
      description: caseData.description || `Case matter ${cnr || id}`,
      category: caseData.category || "Civil",
      citizenId: caseData.citizenId || null,
      citizenName: caseData.citizenName || caseDetails.petitioners?.[0] || "Citizen",
      lawyerId: caseData.lawyerId || null,
      lawyerName: caseData.lawyerName || null,
      status: caseData.status || "Pending",
      city: caseData.city || caseDetails.district || "Hyderabad",
      source: caseData.source || (cnr ? "ecourt" : "manual"),
      isEmergency: !!caseData.isEmergency,
      emergencyReason: caseData.emergencyReason || null,
      viaWhatsApp: !!caseData.viaWhatsApp,
      practiceArea: caseData.practiceArea || caseDetails.caseCategoryFacetPath || null,
      specialization: caseData.specialization || caseDetails.purpose || null,
      legalService: caseData.legalService || null,
      caseDetails,
      entityInfo,
      files: caseData.files || { files: [] },
      descriptions: caseData.descriptions || { enumFields: [], enumLookup: {} },
      caseAiAnalysis: caseData.caseAiAnalysis || null,
      timeline: caseData.timeline?.length ? caseData.timeline : initialTimeline,
      createdAt: caseData.createdAt || today,
      updatedAt: caseData.updatedAt || today,
    };

    const [created] = await db.insert(cases).values(newCase).returning();

    // Relational sync for hearings from caseDetails if present
    if (Array.isArray(caseDetails.historyOfCaseHearings) && caseDetails.historyOfCaseHearings.length > 0) {
      for (const [idx, h] of caseDetails.historyOfCaseHearings.entries()) {
        await db.insert(caseHearings).values({
          id: `h_${id}_${idx + 1}`,
          caseId: id,
          judge: h.judge || "",
          businessOnDate: h.businessOnDate || today,
          hearingDate: h.hearingDate || null,
          time: h.time || null,
          purposeOfListing: h.purposeOfListing || "Listing",
        }).onConflictDoNothing();
      }
    }

    // Relational sync for interim orders and judgment orders
    if (Array.isArray(caseDetails.interimOrders) && caseDetails.interimOrders.length > 0) {
      for (const [idx, o] of caseDetails.interimOrders.entries()) {
        await db.insert(caseOrders).values({
          id: `ord_int_${id}_${idx + 1}`,
          caseId: id,
          orderDate: o.orderDate || today,
          orderType: "INTERIM",
          description: o.description || "Interim Order",
          orderUrl: o.orderUrl || null,
        }).onConflictDoNothing();
      }
    }

    if (Array.isArray(caseDetails.judgmentOrders) && caseDetails.judgmentOrders.length > 0) {
      for (const [idx, o] of caseDetails.judgmentOrders.entries()) {
        await db.insert(caseOrders).values({
          id: `ord_jdg_${id}_${idx + 1}`,
          caseId: id,
          orderDate: o.orderDate || today,
          orderType: "JUDGMENT",
          description: o.orderType || "Final Order / Judgment",
          orderUrl: o.orderUrl || null,
        }).onConflictDoNothing();
      }
    }

    await NotificationService.createInAppNotification({
      title: "New Case Created",
      body: `Your case "${created.title}" (${created.id}) has been filed successfully.`,
      role: "citizen",
    });

    return created;
  }

  static async getCaseById(id: string) {
    const [foundCase] = await db.select().from(cases).where(eq(cases.id, id));
    if (!foundCase) throw ApiError.notFound(`Case with ID '${id}' not found`);

    const hearings = await db.select().from(caseHearings).where(eq(caseHearings.caseId, id));
    const orders = await db.select().from(caseOrders).where(eq(caseOrders.caseId, id));
    const notes = await db.select().from(caseNotes).where(eq(caseNotes.caseId, id));
    const documents = await db.select().from(caseDocuments).where(eq(caseDocuments.caseId, id));

    return { ...foundCase, hearings, orders, notes, documents };
  }

  static async getCaseByCnr(cnr: string) {
    const cleanCnr = cnr.trim();
    const [foundCase] = await db.select().from(cases).where(eq(cases.cnr, cleanCnr));
    if (!foundCase) throw ApiError.notFound(`Case with CNR '${cleanCnr}' not found`);

    const hearings = await db.select().from(caseHearings).where(eq(caseHearings.caseId, foundCase.id));
    const orders = await db.select().from(caseOrders).where(eq(caseOrders.caseId, foundCase.id));
    const notes = await db.select().from(caseNotes).where(eq(caseNotes.caseId, foundCase.id));
    const documents = await db.select().from(caseDocuments).where(eq(caseDocuments.caseId, foundCase.id));

    return { ...foundCase, hearings, orders, notes, documents };
  }

  static async listCases({ citizenId, lawyerId, status, category, cnr, search, limit = 50, offset = 0 }: any) {
    let query = db.select().from(cases);
    const conditions = [];

    if (cnr) conditions.push(eq(cases.cnr, cnr.trim()));
    if (citizenId) conditions.push(eq(cases.citizenId, citizenId));
    if (lawyerId) conditions.push(eq(cases.lawyerId, lawyerId));
    if (status) conditions.push(eq(cases.status, status));
    if (category) conditions.push(eq(cases.category, category));
    if (search) {
      conditions.push(
        or(
          ilike(cases.title, `%${search}%`),
          ilike(cases.description, `%${search}%`),
          ilike(cases.id, `%${search}%`),
          ilike(cases.cnr, `%${search}%`),
          ilike(cases.citizenName, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return query.orderBy(desc(cases.createdAt)).limit(limit).offset(offset);
  }

  static async updateCaseStatus(id: string, newStatus: string, note?: string) {
    const [existing] = await db.select().from(cases).where(eq(cases.id, id));
    if (!existing) throw ApiError.notFound(`Case '${id}' not found`);

    const today = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const updatedTimeline = [
      ...((existing.timeline as any[]) || []),
      {
        id: `tl_${Date.now()}`,
        status: newStatus,
        at: today,
        time: timeStr,
        note: note || `Status updated to ${newStatus}`,
      },
    ];

    const [updated] = await db
      .update(cases)
      .set({
        status: newStatus,
        timeline: updatedTimeline,
        updatedAt: today,
        dbUpdatedAt: new Date(),
      })
      .where(eq(cases.id, id))
      .returning();

    return updated;
  }

  static async assignLawyer(id: string, lawyerId?: string, lawyerName?: string) {
    const [existing] = await db.select().from(cases).where(eq(cases.id, id));
    if (!existing) throw ApiError.notFound(`Case '${id}' not found`);

    const today = new Date().toISOString().slice(0, 10);
    const timeStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

    const updatedTimeline = [
      ...((existing.timeline as any[]) || []),
      {
        id: `tl_${Date.now()}`,
        status: existing.status === "Pending" ? "Assigned" : existing.status,
        at: today,
        time: timeStr,
        note: lawyerName ? `Assigned to ${lawyerName}` : "Lawyer unassigned",
      },
    ];

    const [updated] = await db
      .update(cases)
      .set({
        lawyerId: lawyerId || null,
        lawyerName: lawyerName || null,
        status: existing.status === "Pending" && lawyerId ? "Assigned" : existing.status,
        timeline: updatedTimeline,
        updatedAt: today,
        dbUpdatedAt: new Date(),
      })
      .where(eq(cases.id, id))
      .returning();

    return updated;
  }
}
