import type { CourtItem } from "@/types";

const STATE_NAMES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman & Nicobar Islands",
  "Chandigarh",
  "Dadra & Nagar Haveli and Daman & Diu",
  "Delhi",
  "Jammu & Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const CITY_OR_DISTRICT_TO_STATE: Record<string, { state: string; district: string }> = {
  hyderabad: { state: "Telangana", district: "Hyderabad" },
  secunderabad: { state: "Telangana", district: "Hyderabad" },
  warangal: { state: "Telangana", district: "Warangal" },
  karimnagar: { state: "Telangana", district: "Karimnagar" },
  nizamabad: { state: "Telangana", district: "Nizamabad" },
  khammam: { state: "Telangana", district: "Khammam" },
  suryapet: { state: "Telangana", district: "Suryapet" },
  nalgonda: { state: "Telangana", district: "Nalgonda" },
  mahbubnagar: { state: "Telangana", district: "Mahbubnagar" },
  adilabad: { state: "Telangana", district: "Adilabad" },

  visakhapatnam: { state: "Andhra Pradesh", district: "Visakhapatnam" },
  amaravati: { state: "Andhra Pradesh", district: "Guntur" },
  vijayawada: { state: "Andhra Pradesh", district: "Krishna" },
  guntur: { state: "Andhra Pradesh", district: "Guntur" },
  tirupati: { state: "Andhra Pradesh", district: "Tirupati" },
  kurnool: { state: "Andhra Pradesh", district: "Kurnool" },
  nellore: { state: "Andhra Pradesh", district: "Nellore" },
  kadapa: { state: "Andhra Pradesh", district: "YSR Kadapa" },
  kakinada: { state: "Andhra Pradesh", district: "Kakinada" },

  bengaluru: { state: "Karnataka", district: "Bengaluru Urban" },
  bangalore: { state: "Karnataka", district: "Bengaluru Urban" },
  mysuru: { state: "Karnataka", district: "Mysuru" },
  mysore: { state: "Karnataka", district: "Mysuru" },
  mangaluru: { state: "Karnataka", district: "Dakshina Kannada" },
  mangalore: { state: "Karnataka", district: "Dakshina Kannada" },
  hubli: { state: "Karnataka", district: "Dharwad" },
  dharwad: { state: "Karnataka", district: "Dharwad" },
  bagalkot: { state: "Karnataka", district: "Bagalkot" },
  belagavi: { state: "Karnataka", district: "Belagavi" },
  belgaum: { state: "Karnataka", district: "Belagavi" },

  mumbai: { state: "Maharashtra", district: "Mumbai City" },
  bombay: { state: "Maharashtra", district: "Mumbai City" },
  pune: { state: "Maharashtra", district: "Pune" },
  nagpur: { state: "Maharashtra", district: "Nagpur" },
  nashik: { state: "Maharashtra", district: "Nashik" },
  aurangabad: { state: "Maharashtra", district: "Chhatrapati Sambhajinagar" },
  kolhapur: { state: "Maharashtra", district: "Kolhapur" },
  thane: { state: "Maharashtra", district: "Thane" },
  alibag: { state: "Maharashtra", district: "Raigad" },
  vasai: { state: "Maharashtra", district: "Palghar" },
  belapur: { state: "Maharashtra", district: "Thane" },
  vashi: { state: "Maharashtra", district: "Thane" },
  andheri: { state: "Maharashtra", district: "Mumbai Suburban" },
  chalisgaon: { state: "Maharashtra", district: "Jalgaon" },

  "new delhi": { state: "Delhi", district: "New Delhi" },
  delhi: { state: "Delhi", district: "New Delhi" },

  chennai: { state: "Tamil Nadu", district: "Chennai" },
  madras: { state: "Tamil Nadu", district: "Chennai" },
  egmore: { state: "Tamil Nadu", district: "Chennai" },
  coimbatore: { state: "Tamil Nadu", district: "Coimbatore" },
  madurai: { state: "Tamil Nadu", district: "Madurai" },
  salem: { state: "Tamil Nadu", district: "Salem" },
  tiruchirappalli: { state: "Tamil Nadu", district: "Tiruchirappalli" },

  kolkata: { state: "West Bengal", district: "Kolkata" },
  calcutta: { state: "West Bengal", district: "Kolkata" },
  jalpaiguri: { state: "West Bengal", district: "Jalpaiguri" },
  alipurduar: { state: "West Bengal", district: "Alipurduar" },
  bankura: { state: "West Bengal", district: "Bankura" },
  bangaon: { state: "West Bengal", district: "North 24 Parganas" },
  basirhat: { state: "West Bengal", district: "North 24 Parganas" },
  kalyani: { state: "West Bengal", district: "Nadia" },
  howrah: { state: "West Bengal", district: "Howrah" },
  asansol: { state: "West Bengal", district: "Paschim Bardhaman" },
  siliguri: { state: "West Bengal", district: "Darjeeling" },

  ahmedabad: { state: "Gujarat", district: "Ahmedabad" },
  surat: { state: "Gujarat", district: "Surat" },
  vadodara: { state: "Gujarat", district: "Vadodara" },
  rajkot: { state: "Gujarat", district: "Rajkot" },
  vapi: { state: "Gujarat", district: "Valsad" },

  jaipur: { state: "Rajasthan", district: "Jaipur" },
  jodhpur: { state: "Rajasthan", district: "Jodhpur" },
  ajmer: { state: "Rajasthan", district: "Ajmer" },
  bikaner: { state: "Rajasthan", district: "Bikaner" },
  udaipur: { state: "Rajasthan", district: "Udaipur" },
  kota: { state: "Rajasthan", district: "Kota" },
  bhilwara: { state: "Rajasthan", district: "Bhilwara" },
  makrana: { state: "Rajasthan", district: "Nagaur" },
  kotputali: { state: "Rajasthan", district: "Kotputli-Behror" },

  lucknow: { state: "Uttar Pradesh", district: "Lucknow" },
  allahabad: { state: "Uttar Pradesh", district: "Prayagraj" },
  prayagraj: { state: "Uttar Pradesh", district: "Prayagraj" },
  kanpur: { state: "Uttar Pradesh", district: "Kanpur Nagar" },
  varanasi: { state: "Uttar Pradesh", district: "Varanasi" },
  agra: { state: "Uttar Pradesh", district: "Agra" },
  meerut: { state: "Uttar Pradesh", district: "Meerut" },
  noida: { state: "Uttar Pradesh", district: "Gautam Buddha Nagar" },
  ghaziabad: { state: "Uttar Pradesh", district: "Ghaziabad" },
  bareilly: { state: "Uttar Pradesh", district: "Bareilly" },
  baghpat: { state: "Uttar Pradesh", district: "Baghpat" },
  iglas: { state: "Uttar Pradesh", district: "Aligarh" },

  kochi: { state: "Kerala", district: "Ernakulam" },
  ernakulam: { state: "Kerala", district: "Ernakulam" },
  thiruvananthapuram: { state: "Kerala", district: "Thiruvananthapuram" },
  kozhikode: { state: "Kerala", district: "Kozhikode" },

  bhopal: { state: "Madhya Pradesh", district: "Bhopal" },
  indore: { state: "Madhya Pradesh", district: "Indore" },
  gwalior: { state: "Madhya Pradesh", district: "Gwalior" },
  jabalpur: { state: "Madhya Pradesh", district: "Jabalpur" },

  patna: { state: "Bihar", district: "Patna" },
  gaya: { state: "Bihar", district: "Gaya" },
  muzaffarpur: { state: "Bihar", district: "Muzaffarpur" },

  ranchi: { state: "Jharkhand", district: "Ranchi" },
  dhanbad: { state: "Jharkhand", district: "Dhanbad" },
  jamshedpur: { state: "Jharkhand", district: "East Singhbhum" },
  chaibasa: { state: "Jharkhand", district: "West Singhbhum" },

  cuttack: { state: "Odisha", district: "Cuttack" },
  bhubaneswar: { state: "Odisha", district: "Khordha" },

  chandigarh: { state: "Chandigarh", district: "Chandigarh" },
  ludhiana: { state: "Punjab", district: "Ludhiana" },
  amritsar: { state: "Punjab", district: "Amritsar" },
  jalandhar: { state: "Punjab", district: "Jalandhar" },

  raipur: { state: "Chhattisgarh", district: "Raipur" },
  bilaspur: { state: "Chhattisgarh", district: "Bilaspur" },

  dehradun: { state: "Uttarakhand", district: "Dehradun" },
  haldwani: { state: "Uttarakhand", district: "Nainital" },
  nainital: { state: "Uttarakhand", district: "Nainital" },

  shimla: { state: "Himachal Pradesh", district: "Shimla" },
  dharamshala: { state: "Himachal Pradesh", district: "Kangra" },

  guwahati: { state: "Assam", district: "Kamrup Metropolitan" },
  silchar: { state: "Assam", district: "Cachar" },

  panaji: { state: "Goa", district: "North Goa" },
  margao: { state: "Goa", district: "South Goa" },

  srinagar: { state: "Jammu & Kashmir", district: "Srinagar" },
  jammu: { state: "Jammu & Kashmir", district: "Jammu" },

  aizawl: { state: "Mizoram", district: "Aizawl" },
  agartala: { state: "Tripura", district: "West Tripura" },
  imphal: { state: "Manipur", district: "Imphal West" },
  shillong: { state: "Meghalaya", district: "East Khasi Hills" },
  kohima: { state: "Nagaland", district: "Kohima" },
  gangtok: { state: "Sikkim", district: "East Sikkim" },
  itanagar: { state: "Arunachal Pradesh", district: "Papum Pare" },
  tawang: { state: "Arunachal Pradesh", district: "Tawang" },
  changlang: { state: "Arunachal Pradesh", district: "Changlang" },
  tirap: { state: "Arunachal Pradesh", district: "Tirap" },
  anzaw: { state: "Arunachal Pradesh", district: "Anjaw" },
};

export function parseCourtItem(rawName: string, idx: number): CourtItem {
  const name = rawName.trim();

  let level: CourtItem["level"] = "District Court";
  if (/Supreme/i.test(name)) level = "Supreme Court";
  else if (/High Court/i.test(name)) level = "High Court";
  else if (/Consumer/i.test(name)) level = "Consumer Commission";
  else if (/Family/i.test(name)) level = "Family Court";
  else if (/Labour/i.test(name)) level = "Labour Court";
  else if (/Tribunal|Commission|Board|RERA|REAT|Forum|Authority/i.test(name)) level = "Tribunal";

  let state = "";
  let district = "";

  // 1. Direct state name match in court name
  for (const s of STATE_NAMES) {
    const escaped = s.replace("&", "\\&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(name)) {
      state = s;
      break;
    }
  }

  // 2. City or district keyword match in court name
  for (const [key, mapping] of Object.entries(CITY_OR_DISTRICT_TO_STATE)) {
    if (new RegExp(`\\b${key}\\b`, "i").test(name)) {
      if (!state) state = mapping.state;
      if (!district) district = mapping.district;
      break;
    }
  }

  // 3. Fallback state
  if (!state) {
    if (level === "Supreme Court" || /Central|Appellate Tribunal|National/i.test(name)) {
      state = "Delhi";
    } else {
      state = "All India";
    }
  }

  return {
    id: `crt_${idx + 1}`,
    name,
    level,
    state,
    district: district || undefined,
    city: district || undefined,
    active: true,
  };
}

/** Default parsed courts - dynamically loaded from backend */
export const DEFAULT_PARSED_COURTS: CourtItem[] = [];
