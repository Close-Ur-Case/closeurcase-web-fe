/**
 * Backend case-category → `LegalCategory` normalization.
 *
 * The backend's master `case_categories` table (see `supabase/seed.sql`) carries
 * twelve categories keyed `cat_1`…`cat_12`, while this app's `LegalCategory` union
 * has ten broader buckets. Backend payloads refer to a category by id ("cat_1"),
 * display name ("Criminal Defense") or code ("CRIM") depending on the endpoint, so
 * everything funnels through here rather than each mapper inventing its own table.
 */

import type { LegalCategory } from "@/types";

const LEGAL_CATEGORIES: LegalCategory[] = [
  "Criminal",
  "Civil",
  "Property",
  "Family",
  "Consumer",
  "Cyber",
  "Corporate",
  "Labour",
  "Tax",
  "Environmental",
];

/** Backend category id → the closest `LegalCategory`.
 *
 * Nine map cleanly. Three have no direct counterpart and are judgement calls,
 * made from the specializations each one actually contains:
 *  - `cat_4` "Banking & Finance" (Cheque Bounce, Recovery, Banking) → Corporate.
 *    Note this is deliberately *not* Tax: `cat_11` is the real Tax category.
 *  - `cat_6` "Higher Courts" (Supreme Court, High Court, Armed Forces Tribunal)
 *    describes a forum rather than a subject, so it falls back to the generic Civil.
 *  - `cat_7` "International Law" (Immigration, NRI) has no counterpart → Civil.
 */
const ID_TO_CATEGORY: Record<string, LegalCategory> = {
  cat_1: "Criminal",
  cat_2: "Corporate",
  cat_3: "Family",
  cat_4: "Corporate",
  cat_5: "Consumer",
  cat_6: "Civil",
  cat_7: "Civil",
  cat_8: "Labour",
  cat_9: "Property",
  cat_10: "Cyber",
  cat_11: "Tax",
  cat_12: "Environmental",
};

/** Backend display name / code → `LegalCategory`, for endpoints that send either. */
const NAME_TO_CATEGORY: Record<string, LegalCategory> = {
  "criminal defense": "Criminal",
  crim: "Criminal",
  "corporate law": "Corporate",
  corp: "Corporate",
  "family law": "Family",
  fam: "Family",
  "banking & finance": "Corporate",
  "banking and finance": "Corporate",
  bank: "Corporate",
  "consumer law": "Consumer",
  cons: "Consumer",
  "higher courts": "Civil",
  hcrt: "Civil",
  "international law": "Civil",
  intl: "Civil",
  "labour & civil matters": "Labour",
  "labour and civil matters": "Labour",
  lab: "Labour",
  "property law": "Property",
  prop: "Property",
  cyb: "Cyber",
  tax: "Tax",
  env: "Environmental",
};

/**
 * Resolve any backend category reference to a `LegalCategory`.
 *
 * Returns `undefined` when the value can't be resolved, so callers can keep an
 * existing local value instead of silently defaulting and corrupting UI filters.
 */
export function resolveLegalCategory(raw: unknown): LegalCategory | undefined {
  if (typeof raw !== "string") return undefined;
  const value = raw.trim();
  if (!value) return undefined;

  const byId = ID_TO_CATEGORY[value.toLowerCase()];
  if (byId) return byId;

  const exact = LEGAL_CATEGORIES.find((c) => c.toLowerCase() === value.toLowerCase());
  if (exact) return exact;

  return NAME_TO_CATEGORY[value.toLowerCase()];
}

/** Same as `resolveLegalCategory`, but falls back rather than returning undefined. */
export function resolveLegalCategoryOr(
  raw: unknown,
  fallback: LegalCategory = "Civil",
): LegalCategory {
  return resolveLegalCategory(raw) ?? fallback;
}
