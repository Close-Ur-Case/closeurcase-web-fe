export interface CourtOption {
  id: string;
  name: string;
  level: "Supreme Court" | "High Court" | "District Court" | "Tribunal";
}

import { INDIAN_COURTS_RAW } from "./indianCourtsRaw";
export { INDIAN_COURTS_RAW };

import { getCities, getLanguages, getCourts } from "@/data/appStore";

// Deduplicated & alphabetically sorted fallback list of Indian Courts
const RAW_FALLBACK_COURTS: string[] = Array.from(
  new Set(INDIAN_COURTS_RAW.map((c) => c.trim()).filter(Boolean)),
).sort((a, b) => a.localeCompare(b));

// Fallback Indian Cities
const RAW_FALLBACK_CITIES: string[] = [
  "Hyderabad",
  "Visakhapatnam",
  "Vijayawada",
  "Guntur",
  "Tirupati",
  "Warangal",
  "Bengaluru",
  "Mysuru",
  "Mangaluru",
  "Hubli-Dharwad",
  "Chennai",
  "Coimbatore",
  "Madurai",
  "Salem",
  "Tiruchirappalli",
  "Mumbai",
  "Pune",
  "Nagpur",
  "Nashik",
  "Aurangabad",
  "Navi Mumbai",
  "Thane",
  "Delhi / New Delhi",
  "Gurugram",
  "Noida",
  "Faridabad",
  "Ghaziabad",
  "Kolkata",
  "Howrah",
  "Siliguri",
  "Asansol",
  "Ahmedabad",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Jaipur",
  "Jodhpur",
  "Udaipur",
  "Kota",
  "Bikaner",
  "Lucknow",
  "Kanpur",
  "Varanasi",
  "Agra",
  "Prayagraj (Allahabad)",
  "Meerut",
  "Bareilly",
  "Bhopal",
  "Indore",
  "Gwalior",
  "Jabalpur",
  "Chandigarh",
  "Ludhiana",
  "Amritsar",
  "Jalandhar",
  "Patna",
  "Gaya",
  "Muzaffarpur",
  "Bhagalpur",
  "Ranchi",
  "Jamshedpur",
  "Dhanbad",
  "Bhubaneswar",
  "Cuttack",
  "Rourkela",
  "Kochi",
  "Thiruvananthapuram",
  "Kozhikode",
  "Thrissur",
  "Guwahati",
  "Raipur",
  "Dehradun",
  "Shimla",
  "Jammu",
  "Srinagar",
  "Panaji",
  "Puducherry",
];

// Fallback Indian Languages
const RAW_FALLBACK_LANGUAGES: string[] = [
  "English",
  "Telugu",
  "Hindi",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Odia",
  "Punjabi",
  "Urdu",
  "Assamese",
  "Maithili",
  "Sanskrit",
  "Konkani",
  "Manipuri",
  "Nepali",
  "Sindhi",
  "Kashmiri",
  "Dogri",
  "Bodo",
  "Santhali",
  "Marwari",
];

const RAW_FALLBACK_COURT_OPTIONS: CourtOption[] = RAW_FALLBACK_COURTS.slice(0, 10).map(
  (name, idx) => ({
    id: `c_${idx}`,
    name,
    level: name.includes("Supreme")
      ? "Supreme Court"
      : name.includes("High Court")
        ? "High Court"
        : name.includes("Tribunal")
          ? "Tribunal"
          : "District Court",
  }),
);

export function getManagedCourtsList(): string[] {
  try {
    const active = getCourts()
      .filter((c) => c.active)
      .map((c) => c.name);
    return active.length > 0 ? active : RAW_FALLBACK_COURTS;
  } catch {
    return RAW_FALLBACK_COURTS;
  }
}

export function getManagedCitiesList(): string[] {
  try {
    const active = getCities()
      .filter((c) => c.active)
      .map((c) => c.name);
    return active.length > 0 ? active : RAW_FALLBACK_CITIES;
  } catch {
    return RAW_FALLBACK_CITIES;
  }
}

export function getManagedLanguagesList(): string[] {
  try {
    const active = getLanguages()
      .filter((l) => l.active)
      .map((l) => l.name);
    return active.length > 0 ? active : RAW_FALLBACK_LANGUAGES;
  } catch {
    return RAW_FALLBACK_LANGUAGES;
  }
}

export function getManagedCourtOptions(): CourtOption[] {
  try {
    const active = getCourts().filter((c) => c.active);
    if (active.length > 0) {
      return active.map((c) => ({
        id: c.id,
        name: c.name,
        level: (c.level as CourtOption["level"]) || "District Court",
      }));
    }
  } catch {
    // localStorage may be unavailable (SSR, private mode) — fall through to the fallback below.
  }
  return RAW_FALLBACK_COURT_OPTIONS;
}

/**
 * Dynamic proxy for INDIAN_COURTS sourced from Admin Data Management.
 */
export const INDIAN_COURTS: string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = getManagedCourtsList();
    const val = Reflect.get(list, prop);
    return typeof val === "function" ? val.bind(list) : val;
  },
  has(_target, prop) {
    return Reflect.has(getManagedCourtsList(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getManagedCourtsList());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getManagedCourtsList(), prop);
  },
});

/**
 * Dynamic proxy for INDIAN_CITIES sourced from Admin Data Management.
 */
export const INDIAN_CITIES: string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = getManagedCitiesList();
    const val = Reflect.get(list, prop);
    return typeof val === "function" ? val.bind(list) : val;
  },
  has(_target, prop) {
    return Reflect.has(getManagedCitiesList(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getManagedCitiesList());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getManagedCitiesList(), prop);
  },
});

export const INDIAN_DISTRICTS: string[] = INDIAN_CITIES;

/**
 * Dynamic proxy for INDIAN_LANGUAGES sourced from Admin Data Management.
 */
export const INDIAN_LANGUAGES: string[] = new Proxy([] as string[], {
  get(_target, prop) {
    const list = getManagedLanguagesList();
    const val = Reflect.get(list, prop);
    return typeof val === "function" ? val.bind(list) : val;
  },
  has(_target, prop) {
    return Reflect.has(getManagedLanguagesList(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getManagedLanguagesList());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getManagedLanguagesList(), prop);
  },
});

/**
 * Dynamic proxy for courts list sourced from Admin Data Management.
 */
export const courts: CourtOption[] = new Proxy([] as CourtOption[], {
  get(_target, prop) {
    const list = getManagedCourtOptions();
    const val = Reflect.get(list, prop);
    return typeof val === "function" ? val.bind(list) : val;
  },
  has(_target, prop) {
    return Reflect.has(getManagedCourtOptions(), prop);
  },
  ownKeys() {
    return Reflect.ownKeys(getManagedCourtOptions());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getManagedCourtOptions(), prop);
  },
});

export function searchCourts(query: string): string[] {
  const list = getManagedCourtsList();
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((c) => c.toLowerCase().includes(q));
}
