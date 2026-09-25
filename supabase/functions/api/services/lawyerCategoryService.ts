import { db } from "../config/db.ts";
import { caseCategories, caseSpecializations, legalServices } from "../models/masterData.ts";
import { eq } from "drizzle-orm";

export interface LawyerServiceDetail {
  id: string;
  name: string;
}

export interface LawyerSpecializationDetail {
  id: string;
  name: string;
  services: LawyerServiceDetail[];
}

export interface LawyerCategoryDetail {
  categoryId: string;
  categoryName: string;
  code: string;
  specializations: LawyerSpecializationDetail[];
}

export class LawyerCategoryService {
  /**
   * Lenient counterpart to `validateAndNormalize`, for citizen case filing.
   *
   * The case wizard sends display names ("Criminal Defense", "Anticipatory Bail",
   * "File Anticipatory Bail Application") while seeded cases store canonical IDs
   * (cat_1 / spec_1_1 / srv_1_1_1), so `cases_user` ends up holding both shapes
   * and category filters miss rows. This resolves names to IDs the same way.
   *
   * Unlike `validateAndNormalize` it never throws: an unrecognised value is kept
   * verbatim rather than rejecting the filing. Registration keeps the strict path
   * because a lawyer's practice areas must be valid; a citizen describing their
   * own matter should not be blocked by taxonomy drift.
   */
  static async normalizeCaseTaxonomy(
    practiceArea?: string | null,
    specialization?: string | null,
    legalServicesInput: string[] = []
  ): Promise<{
    practiceArea: string;
    specialization: string;
    legalServices: string[];
  }> {
    const [allCategories, allSpecs, allServices] = await Promise.all([
      db.select().from(caseCategories),
      db.select().from(caseSpecializations),
      db.select().from(legalServices),
    ]);

    const area = (practiceArea || "").trim();
    const spec = (specialization || "").trim();
    const services = (legalServicesInput || [])
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);

    const matchedCategory = area
      ? allCategories.find(
          (c) =>
            c.id.toLowerCase() === area.toLowerCase() ||
            (c.code || "").toLowerCase() === area.toLowerCase() ||
            c.name.toLowerCase() === area.toLowerCase()
        )
      : undefined;

    const matchedSpec = spec
      ? allSpecs.find(
          (sp) =>
            sp.id.toLowerCase() === spec.toLowerCase() ||
            sp.name.toLowerCase() === spec.toLowerCase()
        )
      : undefined;

    const normalizedServices = services.map((srv) => {
      const match = allServices.find(
        (s) =>
          s.id.toLowerCase() === srv.toLowerCase() || s.name.toLowerCase() === srv.toLowerCase()
      );
      return match ? match.id : srv;
    });

    return {
      // Fall back to the specialization's own parent when only the spec resolved.
      practiceArea: matchedCategory?.id || matchedSpec?.categoryId || area,
      specialization: matchedSpec?.id || spec,
      legalServices: Array.from(new Set(normalizedServices)),
    };
  }

  /**
   * Validates and normalizes practice_areas, specializations, and legal_services against normalized master tables:
   * 1. case_categories
   * 2. case_specializations
   * 3. legal_services
   *
   * Accepts IDs, display names, or codes; strictly returns canonical ID arrays:
   *   - practiceAreas: ["cat_1", "cat_6"]
   *   - specializations: ["spec_1_1", "spec_1_2"]
   *   - legalServices: ["srv_1_1_1", "srv_1_1_2"]
   */
  static async validateAndNormalize(
    practiceAreas: string[] = [],
    specializations: string[] = [],
    legalServicesInput: string[] = []
  ): Promise<{
    practiceAreas: string[];
    specializations: string[];
    legalServices: string[];
    primaryCategory: string;
  }> {
    const [allCategories, allSpecs, allServices] = await Promise.all([
      db.select().from(caseCategories).where(eq(caseCategories.active, true)),
      db.select().from(caseSpecializations).where(eq(caseSpecializations.active, true)),
      db.select().from(legalServices).where(eq(legalServices.active, true)),
    ]);

    const cleanAreas = Array.from(
      new Set((practiceAreas || []).map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean))
    );
    const cleanSpecs = Array.from(
      new Set((specializations || []).map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean))
    );
    const cleanServices = Array.from(
      new Set((legalServicesInput || []).map((s) => (typeof s === "string" ? s.trim() : "")).filter(Boolean))
    );

    const validCategoryOptions = allCategories.map((c) => `${c.name} (${c.id})`);
    const normalizedAreaIds: string[] = [];

    const categoryAliases: Record<string, string[]> = {
      cat_1: ["criminal", "criminal defense", "criminal law", "crim"],
      cat_2: ["corporate", "corporate law", "company law", "corp"],
      cat_3: ["family", "family law", "matrimonial", "divorce", "fam"],
      cat_4: ["banking", "finance", "banking & finance", "bank"],
      cat_5: ["consumer", "consumer law", "consumer court", "cons"],
      cat_6: ["higher courts", "high court", "supreme court", "hcrt"],
      cat_7: ["international", "international law", "intl"],
      cat_8: [
        "labour",
        "civil",
        "civil law",
        "labour & civil matters",
        "labour law",
        "civil matters",
        "lab",
      ],
      cat_9: ["property", "property law", "real estate", "prop"],
      cat_10: ["cyber", "cyber law", "it law", "technology", "cyb"],
      cat_11: ["tax", "taxation", "tax law", "gst", "income tax"],
      cat_12: ["environmental", "environment", "environmental law", "env"],
    };

    // 1. Resolve Practice Areas to Category IDs (cat_X)
    for (const area of cleanAreas) {
      let match = allCategories.find(
        (c) =>
          c.id.toLowerCase() === area.toLowerCase() ||
          c.code.toLowerCase() === area.toLowerCase() ||
          c.name.toLowerCase() === area.toLowerCase()
      );

      // Check alias mapping
      if (!match) {
        const areaLower = area.toLowerCase();
        for (const [catId, aliases] of Object.entries(categoryAliases)) {
          if (aliases.some((al) => areaLower.includes(al) || al.includes(areaLower))) {
            match = allCategories.find((c) => c.id === catId);
            if (match) break;
          }
        }
      }

      // Check substring in category name
      if (!match) {
        match = allCategories.find(
          (c) =>
            c.name.toLowerCase().includes(area.toLowerCase()) ||
            area.toLowerCase().includes(c.name.toLowerCase())
        );
      }

      // Check if area was a specialization name
      if (!match) {
        const specMatch = allSpecs.find(
          (sp) =>
            sp.id.toLowerCase() === area.toLowerCase() ||
            sp.name.toLowerCase() === area.toLowerCase() ||
            sp.name.toLowerCase().includes(area.toLowerCase())
        );
        if (specMatch) {
          match = allCategories.find((c) => c.id === specMatch.categoryId);
        }
      }

      if (match && !normalizedAreaIds.includes(match.id)) {
        normalizedAreaIds.push(match.id);
      }
    }

    if (normalizedAreaIds.length === 0 && allCategories.length > 0) {
      const fallbackCat = allCategories.find((c) => c.id === "cat_8") || allCategories[0];
      if (fallbackCat) normalizedAreaIds.push(fallbackCat.id);
    }

    // 2. Resolve Specializations to Specialization IDs (spec_X_Y)
    const normalizedSpecIds: string[] = [];
    for (const spec of cleanSpecs) {
      let match = allSpecs.find(
        (sp) =>
          sp.id.toLowerCase() === spec.toLowerCase() ||
          sp.name.toLowerCase() === spec.toLowerCase()
      );

      if (!match) {
        match = allSpecs.find(
          (sp) =>
            sp.name.toLowerCase().includes(spec.toLowerCase()) ||
            spec.toLowerCase().includes(sp.name.toLowerCase())
        );
      }

      if (match) {
        if (!normalizedSpecIds.includes(match.id)) {
          normalizedSpecIds.push(match.id);
        }
        // Ensure parent category ID is included
        if (!normalizedAreaIds.includes(match.categoryId)) {
          normalizedAreaIds.push(match.categoryId);
        }
      } else {
        // Dynamically register into case_specializations to satisfy trigger
        const parentCatId = normalizedAreaIds[0] || allCategories[0]?.id || "cat_8";
        const dynamicSpecId = `spec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        try {
          const [newSpec] = await db
            .insert(caseSpecializations)
            .values({
              id: dynamicSpecId,
              categoryId: parentCatId,
              name: spec,
              active: true,
            })
            .returning();
          if (newSpec && !normalizedSpecIds.includes(newSpec.id)) {
            normalizedSpecIds.push(newSpec.id);
          }
        } catch {
          // If insert fails, skip to prevent DB trigger exception
        }
      }
    }

    // 3. Resolve Legal Services to Service IDs (srv_X_Y_Z)
    const normalizedServiceIds: string[] = [];
    for (const srv of cleanServices) {
      let match = allServices.find(
        (s) =>
          s.id.toLowerCase() === srv.toLowerCase() ||
          s.name.toLowerCase() === srv.toLowerCase()
      );

      if (!match) {
        match = allServices.find(
          (s) =>
            s.name.toLowerCase().includes(srv.toLowerCase()) ||
            srv.toLowerCase().includes(s.name.toLowerCase())
        );
      }

      if (match) {
        if (!normalizedServiceIds.includes(match.id)) {
          normalizedServiceIds.push(match.id);
        }
        // Ensure parent specialization and category are included
        if (!normalizedSpecIds.includes(match.specializationId)) {
          normalizedSpecIds.push(match.specializationId);
        }
        if (!normalizedAreaIds.includes(match.categoryId)) {
          normalizedAreaIds.push(match.categoryId);
        }
      } else {
        // Dynamically register into legal_services to satisfy trigger
        const parentCatId = normalizedAreaIds[0] || allCategories[0]?.id || "cat_8";
        const parentSpecId = normalizedSpecIds[0] || allSpecs[0]?.id || "spec_8_1";
        const dynamicSrvId = `srv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        try {
          const [newSrv] = await db
            .insert(legalServices)
            .values({
              id: dynamicSrvId,
              categoryId: parentCatId,
              specializationId: parentSpecId,
              name: srv,
              active: true,
            })
            .returning();
          if (newSrv && !normalizedServiceIds.includes(newSrv.id)) {
            normalizedServiceIds.push(newSrv.id);
          }
        } catch {
          // If insert fails, skip to prevent DB trigger exception
        }
      }
    }

    // Primary category display name for lawyers.category column
    const primaryCat = normalizedAreaIds.length > 0
      ? allCategories.find((c) => c.id === normalizedAreaIds[0])
      : null;
    const primaryCategory = primaryCat ? primaryCat.name : "General";

    return {
      practiceAreas: normalizedAreaIds,
      specializations: normalizedSpecIds,
      legalServices: normalizedServiceIds,
      primaryCategory,
    };
  }

  /**
   * Resolves lawyer's practice_areas, specializations, and legal_services IDs into an enriched 3-tier hierarchy.
   */
  static async getCategoriesForLawyer(
    practiceAreas: string[] = [],
    specializations: string[] = [],
    legalServicesInput: string[] = []
  ): Promise<LawyerCategoryDetail[]> {
    if (
      (!practiceAreas || practiceAreas.length === 0) &&
      (!specializations || specializations.length === 0) &&
      (!legalServicesInput || legalServicesInput.length === 0)
    ) {
      return [];
    }

    const [allCategories, allSpecs, allServices] = await Promise.all([
      db.select().from(caseCategories).where(eq(caseCategories.active, true)),
      db.select().from(caseSpecializations).where(eq(caseSpecializations.active, true)).orderBy(caseSpecializations.displayOrder),
      db.select().from(legalServices).where(eq(legalServices.active, true)).orderBy(legalServices.displayOrder),
    ]);

    // Build lookup sets
    const areaSet = new Set((practiceAreas || []).map((a) => a.toLowerCase()));
    const specSet = new Set((specializations || []).map((s) => s.toLowerCase()));
    const srvSet = new Set((legalServicesInput || []).map((s) => s.toLowerCase()));

    // Determine relevant categories
    let relevantCats = allCategories;
    if (areaSet.size > 0) {
      relevantCats = allCategories.filter(
        (c) =>
          areaSet.has(c.id.toLowerCase()) ||
          areaSet.has(c.code.toLowerCase()) ||
          areaSet.has(c.name.toLowerCase())
      );
    } else if (specSet.size > 0) {
      const parentCatIds = new Set(
        allSpecs.filter((sp) => specSet.has(sp.id.toLowerCase()) || specSet.has(sp.name.toLowerCase())).map((sp) => sp.categoryId)
      );
      relevantCats = allCategories.filter((c) => parentCatIds.has(c.id));
    }

    const details: LawyerCategoryDetail[] = [];

    for (const cat of relevantCats) {
      let catSpecs = allSpecs.filter((sp) => sp.categoryId === cat.id);

      if (specSet.size > 0) {
        catSpecs = catSpecs.filter(
          (sp) => specSet.has(sp.id.toLowerCase()) || specSet.has(sp.name.toLowerCase())
        );
      }

      const builtSpecializations: LawyerSpecializationDetail[] = [];

      for (const sp of catSpecs) {
        let spServices = allServices.filter((s) => s.specializationId === sp.id);

        if (srvSet.size > 0) {
          spServices = spServices.filter(
            (s) => srvSet.has(s.id.toLowerCase()) || srvSet.has(s.name.toLowerCase())
          );
        }

        const mappedServices: LawyerServiceDetail[] = spServices.map((s) => ({
          id: s.id,
          name: s.name,
        }));

        builtSpecializations.push({
          id: sp.id,
          name: sp.name,
          services: mappedServices,
        });
      }

      if (builtSpecializations.length > 0 || specSet.size === 0) {
        details.push({
          categoryId: cat.id,
          categoryName: cat.name,
          code: cat.code,
          specializations: builtSpecializations,
        });
      }
    }

    return details;
  }

  /**
   * Helper to resolve Category query inputs (IDs or names) to target IDs and fallback terms.
   */
  static async resolveCategoryQuery(inputs: string[]): Promise<{ ids: string[]; terms: string[]; allTokens: string[] }> {
    const allCategories = await db
      .select()
      .from(caseCategories)
      .where(eq(caseCategories.active, true));

    const ids: string[] = [];
    const terms: string[] = [];
    const allTokens: string[] = [];

    for (const input of inputs) {
      if (input) allTokens.push(input);
      const match = allCategories.find(
        (c) =>
          c.id.toLowerCase() === input.toLowerCase() ||
          c.code.toLowerCase() === input.toLowerCase() ||
          c.name.toLowerCase() === input.toLowerCase()
      );
      if (match) {
        if (!ids.includes(match.id)) ids.push(match.id);
        if (!allTokens.includes(match.id)) allTokens.push(match.id);
        if (!allTokens.includes(match.name)) allTokens.push(match.name);
        if (match.code && !allTokens.includes(match.code)) allTokens.push(match.code);
      } else {
        terms.push(input);
      }
    }

    return { ids, terms, allTokens: Array.from(new Set(allTokens.filter(Boolean))) };
  }

  /**
   * Helper to resolve Specialization query inputs (IDs or names) to target IDs and fallback terms.
   */
  static async resolveSpecializationQuery(inputs: string[]): Promise<{ ids: string[]; terms: string[]; allTokens: string[] }> {
    const allSpecs = await db
      .select()
      .from(caseSpecializations)
      .where(eq(caseSpecializations.active, true));

    const ids: string[] = [];
    const terms: string[] = [];
    const allTokens: string[] = [];

    for (const input of inputs) {
      if (input) allTokens.push(input);
      const match = allSpecs.find(
        (sp) =>
          sp.id.toLowerCase() === input.toLowerCase() ||
          sp.name.toLowerCase() === input.toLowerCase()
      );
      if (match) {
        if (!ids.includes(match.id)) ids.push(match.id);
        if (!allTokens.includes(match.id)) allTokens.push(match.id);
        if (!allTokens.includes(match.name)) allTokens.push(match.name);
      } else {
        terms.push(input);
      }
    }

    return { ids, terms, allTokens: Array.from(new Set(allTokens.filter(Boolean))) };
  }

  /**
   * Helper to resolve Legal Service query inputs (IDs or names) to target IDs and fallback terms.
   */
  static async resolveLegalServiceQuery(inputs: string[]): Promise<{ ids: string[]; terms: string[]; allTokens: string[] }> {
    const allServices = await db
      .select()
      .from(legalServices)
      .where(eq(legalServices.active, true));

    const ids: string[] = [];
    const terms: string[] = [];
    const allTokens: string[] = [];

    for (const input of inputs) {
      if (input) allTokens.push(input);
      const match = allServices.find(
        (s) =>
          s.id.toLowerCase() === input.toLowerCase() ||
          s.name.toLowerCase() === input.toLowerCase()
      );
      if (match) {
        if (!ids.includes(match.id)) ids.push(match.id);
        if (!allTokens.includes(match.id)) allTokens.push(match.id);
        if (!allTokens.includes(match.name)) allTokens.push(match.name);
      } else {
        terms.push(input);
      }
    }

    return { ids, terms, allTokens: Array.from(new Set(allTokens.filter(Boolean))) };
  }

  /**
   * Searches master tables for any category, specialization, or service matching keyword.
   * Returns matching canonical IDs to augment free-text search.
   */
  static async findTaxonomyIdsForKeyword(keyword: string): Promise<{
    categoryIds: string[];
    specializationIds: string[];
    serviceIds: string[];
  }> {
    const term = keyword.trim().toLowerCase();
    if (!term) return { categoryIds: [], specializationIds: [], serviceIds: [] };

    const [allCategories, allSpecs, allServices] = await Promise.all([
      db.select().from(caseCategories).where(eq(caseCategories.active, true)),
      db.select().from(caseSpecializations).where(eq(caseSpecializations.active, true)),
      db.select().from(legalServices).where(eq(legalServices.active, true)),
    ]);

    const categoryIds: string[] = [];
    const specializationIds: string[] = [];
    const serviceIds: string[] = [];

    for (const cat of allCategories) {
      if (
        cat.id.toLowerCase().includes(term) ||
        cat.name.toLowerCase().includes(term) ||
        cat.code.toLowerCase().includes(term)
      ) {
        if (!categoryIds.includes(cat.id)) categoryIds.push(cat.id);
      }
    }

    for (const sp of allSpecs) {
      if (sp.id.toLowerCase().includes(term) || sp.name.toLowerCase().includes(term)) {
        if (!specializationIds.includes(sp.id)) specializationIds.push(sp.id);
        if (!categoryIds.includes(sp.categoryId)) categoryIds.push(sp.categoryId);
      }
    }

    for (const s of allServices) {
      if (s.id.toLowerCase().includes(term) || s.name.toLowerCase().includes(term)) {
        if (!serviceIds.includes(s.id)) serviceIds.push(s.id);
        if (!specializationIds.includes(s.specializationId)) specializationIds.push(s.specializationId);
        if (!categoryIds.includes(s.categoryId)) categoryIds.push(s.categoryId);
      }
    }

    return { categoryIds, specializationIds, serviceIds };
  }
}
