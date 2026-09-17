import { db } from "../config/db.ts";
import { languages } from "../models/masterData.ts";
import { lawyers } from "../models/users.ts";
import { eq, inArray } from "drizzle-orm";

export interface LinkedLanguageDetail {
  id: string;
  name: string;
  nativeName: string;
  code: string;
  active: boolean;
}

export class LawyerLanguageService {
  /**
   * Resolves an array of language identifiers (names, codes, or IDs) into an array of canonical language IDs
   * from public.languages. If a language doesn't exist yet, it dynamically registers it into languages table.
   */
  static async resolveLanguageIds(inputLanguages: string[] = []): Promise<{
    languageIds: string[];
    details: LinkedLanguageDetail[];
  }> {
    if (!inputLanguages || !Array.isArray(inputLanguages)) {
      return { languageIds: [], details: [] };
    }

    const cleanInputs = Array.from(
      new Set(
        inputLanguages
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      )
    );

    if (cleanInputs.length === 0) {
      return { languageIds: [], details: [] };
    }

    const allMasterLanguages = await db.select().from(languages);
    const resolvedList: LinkedLanguageDetail[] = [];

    for (const input of cleanInputs) {
      const lower = input.toLowerCase();
      let matched = allMasterLanguages.find(
        (l) =>
          l.id.toLowerCase() === lower ||
          l.name.toLowerCase() === lower ||
          l.code.toLowerCase() === lower ||
          l.nativeName.toLowerCase() === lower
      );

      // If not in master languages table, dynamically create it to guarantee valid language ID
      if (!matched) {
        const dynamicId = `lang_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const [created] = await db
          .insert(languages)
          .values({
            id: dynamicId,
            name: input,
            nativeName: input,
            code: input.slice(0, 4).toLowerCase(),
            active: true,
          })
          .returning();
        matched = created;
        allMasterLanguages.push(created);
      }

      if (matched && !resolvedList.some((r) => r.id === matched!.id)) {
        resolvedList.push({
          id: matched.id,
          name: matched.name,
          nativeName: matched.nativeName,
          code: matched.code,
          active: matched.active,
        });
      }
    }

    return {
      languageIds: resolvedList.map((l) => l.id),
      details: resolvedList,
    };
  }

  /**
   * Expands an array of language IDs (e.g. ["lang_en", "lang_te"]) into full language objects from public.languages
   */
  static async expandLanguageIds(languageIds: string[] = []): Promise<LinkedLanguageDetail[]> {
    if (!languageIds || !Array.isArray(languageIds) || languageIds.length === 0) {
      return [];
    }

    const rows = await db
      .select({
        id: languages.id,
        name: languages.name,
        nativeName: languages.nativeName,
        code: languages.code,
        active: languages.active,
      })
      .from(languages)
      .where(inArray(languages.id, languageIds));

    // Preserve the original order of languageIds
    const map = new Map(rows.map((r) => [r.id, r]));
    const ordered: LinkedLanguageDetail[] = [];
    for (const id of languageIds) {
      const found = map.get(id);
      if (found) ordered.push(found);
    }
    return ordered;
  }

  /**
   * Retrieves all expanded language details for a given lawyer by reading their languages array of IDs
   */
  static async getLanguagesForLawyer(lawyerId: string): Promise<LinkedLanguageDetail[]> {
    const [lawyer] = await db
      .select({ languages: lawyers.languages })
      .from(lawyers)
      .where(eq(lawyers.id, lawyerId));

    if (!lawyer || !Array.isArray(lawyer.languages)) {
      return [];
    }

    return this.expandLanguageIds(lawyer.languages as string[]);
  }

  /**
   * Synchronizes a lawyer's languages array of IDs directly on public.lawyers table
   */
  static async syncLawyerLanguages(lawyerId: string, inputLanguages: string[] = []): Promise<{
    languageIds: string[];
    linkedLanguages: LinkedLanguageDetail[];
  }> {
    const { languageIds, details } = await this.resolveLanguageIds(inputLanguages);

    await db
      .update(lawyers)
      .set({
        languages: languageIds,
        updatedAt: new Date(),
      })
      .where(eq(lawyers.id, lawyerId));

    return {
      languageIds,
      linkedLanguages: details,
    };
  }
}
