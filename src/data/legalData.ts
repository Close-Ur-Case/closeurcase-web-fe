import rawCategories from "../../case_categories.json";
import rawLocations from "../../locations.json";
import rawLawyers from "../../lawyers.json";
import type { Lawyer, LegalCategory } from "@/types";

/* ─────────────────────────────────────────────────────────────────────────────
   Types & Interfaces for JSON Datasets
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
   1. Case Categories
───────────────────────────────────────────────────────────────────────────── */
export const legalCategoriesData: RawCategoryItem[] = rawCategories as RawCategoryItem[];

export const categoryTitlesList: string[] = legalCategoriesData.map((c) => c.title);

/* Map raw category string to standard title */
export function normalizeCategoryTitle(catRaw: string): string {
  if (!catRaw) return "General Legal Matter";
  const found = legalCategoriesData.find(
    (c) =>
      c.id.toLowerCase() === catRaw.toLowerCase() || c.title.toLowerCase() === catRaw.toLowerCase(),
  );
  if (found) return found.title;

  // Capitalize nicely
  return catRaw
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. Locations (States, Districts, Mandals)
───────────────────────────────────────────────────────────────────────────── */
export const statesData: LocationItem[] = rawLocations.states as LocationItem[];

export const districtsDataMap: Record<string, LocationItem[]> =
  rawLocations.districts as unknown as Record<string, LocationItem[]>;

export const mandalsDataMap: Record<string, LocationItem[]> =
  rawLocations.mandals as unknown as Record<string, LocationItem[]>;

/* Helper: Get districts for a given state title or state ID */
export function getDistrictsForState(stateIdentifier: string): LocationItem[] {
  if (!stateIdentifier) return [];
  const stateObj = statesData.find(
    (s) => s.id === stateIdentifier || s.title.toLowerCase() === stateIdentifier.toLowerCase(),
  );
  const stateId = stateObj ? stateObj.id : stateIdentifier.toLowerCase().replace(/\s+/g, "_");
  return districtsDataMap[stateId] || [];
}

/* Helper: Get mandals for a given district title or district ID */
export function getMandalsForDistrict(districtIdentifier: string): LocationItem[] {
  if (!districtIdentifier) return [];
  // Find key in mandalsDataMap
  const lower = districtIdentifier.toLowerCase().replace(/\s+/g, "_");
  if (mandalsDataMap[lower]) return mandalsDataMap[lower];

  // Try matching by district title across all lists
  for (const list of Object.values(districtsDataMap)) {
    const found = list.find(
      (d) =>
        d.title.toLowerCase() === districtIdentifier.toLowerCase() || d.id === districtIdentifier,
    );
    if (found && mandalsDataMap[found.id]) {
      return mandalsDataMap[found.id];
    }
  }

  return [];
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. Lawyers Dataset
───────────────────────────────────────────────────────────────────────────── */
const rawLawyersList: RawLawyerItem[] = rawLawyers as unknown as RawLawyerItem[];

/* Convert raw lawyer item from lawyers.json into standard Lawyer app type */
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

/* All adapted lawyers */
export const allDatabaseLawyers: Lawyer[] = rawLawyersList.map(adaptRawLawyer);

/* Count of verified Lawyers whose category matches the given category title exactly */
export function getLawyerCountByCategory(categoryTitle: string): number {
  if (!categoryTitle) return 0;
  return allDatabaseLawyers.filter((l) => l.category === categoryTitle).length;
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
  const cMandal = criteria.mandal ? criteria.mandal.toLowerCase() : "";

  const results: { lawyer: Lawyer; raw: RawLawyerItem }[] = [];

  for (let i = 0; i < rawLawyersList.length; i++) {
    const raw = rawLawyersList[i];
    const catTitle = normalizeCategoryTitle(raw.Category).toLowerCase();

    // Category check
    if (cCat && !catTitle.includes(cCat) && !raw.Category.toLowerCase().includes(cCat)) {
      continue;
    }

    // State check
    if (cState && !raw.Address.State.toLowerCase().includes(cState)) {
      continue;
    }

    // District check
    if (cDistrict && !raw.Address.District.toLowerCase().includes(cDistrict)) {
      continue;
    }

    // Mandal check
    if (cMandal && !raw.Address.Mandal.toLowerCase().includes(cMandal)) {
      continue;
    }

    results.push({
      lawyer: adaptRawLawyer(raw, i),
      raw,
    });
  }

  // Fallback: If no exact mandal match found, relax mandal/district filter to return state/category matched lawyers
  if (results.length === 0 && (cCat || cState)) {
    for (let i = 0; i < rawLawyersList.length; i++) {
      const raw = rawLawyersList[i];
      const catTitle = normalizeCategoryTitle(raw.Category).toLowerCase();

      if (cCat && !catTitle.includes(cCat) && !raw.Category.toLowerCase().includes(cCat)) {
        continue;
      }
      if (cState && !raw.Address.State.toLowerCase().includes(cState)) {
        continue;
      }

      results.push({
        lawyer: adaptRawLawyer(raw, i),
        raw,
      });

      if (results.length >= 15) break;
    }
  }

  return results;
}
