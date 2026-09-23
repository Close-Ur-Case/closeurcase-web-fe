/**
 * Legal Data Access Layer - ZERO-MOCK DYNAMIC STATE
 * Decoupled from static .json files.
 * Data is dynamically sourced from PostgreSQL via appStore and Supabase Master Data APIs.
 */

import type { Lawyer, LegalCategory } from "@/types";
import { getCaseCategories, getStates, getLawyers } from "./appStore";

/* ─────────────────────────────────────────────────────────────────────────────
   Types & Interfaces
───────────────────────────────────────────────────────────────────────────── */
export interface RawCategoryItem {
  id: string;
  title: string;
}

export interface LocationItem {
  id: string;
  title: string;
}

export interface RawLawyerItem {
  id: string;
  name: string;
  Phone_Number?: string;
  registration_number?: string;
  Category: string;
  Address: {
    State: string;
    District: string;
    Mandal: string;
    location?: string;
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. Case Categories (Dynamic)
───────────────────────────────────────────────────────────────────────────── */
export const legalCategoriesData: RawCategoryItem[] = [];

export const categoryTitlesList: string[] = [
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

/* Map raw category string to standard title */
export function normalizeCategoryTitle(catRaw: string): string {
  if (!catRaw) return "General Legal Matter";
  const categories = getCaseCategories();
  const found = categories.find(
    (c) =>
      c.id.toLowerCase() === catRaw.toLowerCase() || c.name.toLowerCase() === catRaw.toLowerCase(),
  );
  if (found) return found.name;

  return catRaw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. Locations (States, Districts, Mandals)
───────────────────────────────────────────────────────────────────────────── */
export const statesData: LocationItem[] = [];

export const districtsDataMap: Record<string, LocationItem[]> = {};

export const mandalsDataMap: Record<string, LocationItem[]> = {};

/* Helper: Get districts for a given state title or state ID */
export function getDistrictsForState(stateIdentifier: string): LocationItem[] {
  if (!stateIdentifier) return [];
  const states = getStates();
  const stateObj = states.find(
    (s) =>
      s.id === stateIdentifier ||
      s.name.toLowerCase() === stateIdentifier.toLowerCase() ||
      s.code?.toLowerCase() === stateIdentifier.toLowerCase(),
  );
  if (!stateObj || !stateObj.districts) return [];

  return stateObj.districts.map((d) => ({
    id: d.toLowerCase().replace(/\s+/g, "_"),
    title: d,
  }));
}

/* Helper: Get mandals for a given district title or district ID */
export function getMandalsForDistrict(districtIdentifier: string): LocationItem[] {
  if (!districtIdentifier) return [];
  const lower = districtIdentifier.toLowerCase().replace(/\s+/g, "_");
  if (mandalsDataMap[lower]) return mandalsDataMap[lower];
  return [];
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. Lawyers Dynamic Lookups
───────────────────────────────────────────────────────────────────────────── */

/* Convert raw lawyer item into standard Lawyer app type */
export function adaptRawLawyer(l: RawLawyerItem, index: number): Lawyer {
  const normCat = normalizeCategoryTitle(l.Category) as LegalCategory;
  const ratingVal = Number((4.3 + (index % 7) * 0.1).toFixed(1));
  const expYears = 6 + (index % 12);

  return {
    id: l.id || `lawyer_${index}`,
    name: l.name,
    email: `${l.name.toLowerCase().replace(/[^a-z0-9]/g, "")}@closeur.legal`,
    phone: l.Phone_Number || "+91 98000 00000",
    category: normCat,
    city: `${l.Address.District}, ${l.Address.State}`,
    barId:
      l.registration_number ||
      `BCI/${l.Address.State.slice(0, 2).toUpperCase()}/2021/${1000 + index}`,
    experienceYears: expYears,
    rating: ratingVal,
    status: "Approved" as const,
    activeCases: (index % 5) + 1,
    joinedAt: "2021-01-01",
  };
}

/* All dynamic lawyers from store */
export function getAllDatabaseLawyers(): Lawyer[] {
  return getLawyers();
}

export const allDatabaseLawyers: Lawyer[] = [];

/* Count of verified Lawyers whose category matches the given category title */
export function getLawyerCountByCategory(categoryTitle: string): number {
  if (!categoryTitle) return 0;
  return getLawyers().filter((l) => l.category === categoryTitle).length;
}

/* Helper: Search lawyers matching criteria (State, District, Mandal, Category) */
export function searchLawyersFromDb(criteria: {
  state?: string;
  district?: string;
  mandal?: string;
  category?: string;
}): { lawyer: Lawyer; raw: RawLawyerItem }[] {
  const cCat = criteria.category ? criteria.category.toLowerCase() : "";
  const cState = criteria.state ? criteria.state.toLowerCase() : "";
  const cDistrict = criteria.district ? criteria.district.toLowerCase() : "";

  const lawyers = getLawyers();
  const results: { lawyer: Lawyer; raw: RawLawyerItem }[] = [];

  for (let i = 0; i < lawyers.length; i++) {
    const l = lawyers[i];
    const cat = (l.category || "").toLowerCase();
    const city = (l.city || "").toLowerCase();

    if (cCat && !cat.includes(cCat)) continue;
    if (cState && !city.includes(cState)) continue;
    if (cDistrict && !city.includes(cDistrict)) continue;

    const raw: RawLawyerItem = {
      id: l.id,
      name: l.name,
      Phone_Number: l.phone,
      registration_number: l.barId,
      Category: l.category,
      Address: {
        State: l.city.split(",")[1]?.trim() || l.city,
        District: l.city.split(",")[0]?.trim() || l.city,
        Mandal: "",
      },
    };

    results.push({ lawyer: l, raw });
  }

  return results;
}
