import createJiti from "jiti";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const jiti = createJiti(import.meta.url, {
  alias: {
    "@": path.resolve(rootDir, "src"),
  },
});

const mock = await jiti.import("../src/data/mock.ts");

function escapeSql(str) {
  if (str === null || str === undefined) return "NULL";
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function escapeJson(obj) {
  if (obj === null || obj === undefined) return "'[]'::jsonb";
  return "'" + JSON.stringify(obj).replace(/'/g, "''") + "'::jsonb";
}

const cityStateMap = {
  hyderabad: { state: "Telangana", state_id: "telangana", district_id: "hyderabad" },
  visakhapatnam: { state: "Andhra Pradesh", state_id: "andhra_pradesh", district_id: "visakhapatnam" },
  bengaluru: { state: "Karnataka", state_id: "karnataka", district_id: null },
  chennai: { state: "Tamil Nadu", state_id: "tamil_nadu", district_id: null },
  pune: { state: "Maharashtra", state_id: "maharashtra", district_id: null },
  vijayawada: { state: "Andhra Pradesh", state_id: "andhra_pradesh", district_id: "ntr" },
  mumbai: { state: "Maharashtra", state_id: "maharashtra", district_id: null },
  "delhi / new delhi": { state: "Delhi", state_id: "delhi", district_id: null },
  delhi: { state: "Delhi", state_id: "delhi", district_id: null },
};

function getLocation(city) {
  const key = (city || "").toLowerCase().trim();
  return cityStateMap[key] || { state: "Telangana", state_id: "telangana", district_id: null };
}

const langMap = {
  english: "lang_en",
  hindi: "lang_hi",
  telugu: "lang_te",
  tamil: "lang_ta",
  kannada: "lang_kn",
  malayalam: "lang_ml",
  marathi: "lang_mr",
  bengali: "lang_bn",
  gujarati: "lang_gu",
  odia: "lang_or",
  punjabi: "lang_pa",
  urdu: "lang_ur",
  assamese: "lang_as",
};

function normalizeLang(lang) {
  if (!lang) return "lang_en";
  const lower = String(lang).toLowerCase().trim();
  return langMap[lower] || (lower.startsWith("lang_") ? lower : "lang_en");
}

const catMap = {
  criminal: "cat_1",
  "criminal defense": "cat_1",
  corporate: "cat_2",
  "corporate law": "cat_2",
  family: "cat_3",
  "family law": "cat_3",
  banking: "cat_4",
  "banking & finance": "cat_4",
  finance: "cat_4",
  consumer: "cat_5",
  "consumer law": "cat_5",
  "higher courts": "cat_6",
  international: "cat_7",
  "international law": "cat_7",
  labour: "cat_8",
  "labour & civil matters": "cat_8",
  civil: "cat_8",
  "civil litigation": "cat_8",
  property: "cat_9",
  "property law": "cat_9",
  cyber: "cat_10",
  tax: "cat_11",
  environmental: "cat_12",
};

function normalizeCategory(cat) {
  if (!cat) return "cat_1";
  const lower = String(cat).toLowerCase().trim();
  return catMap[lower] || (lower.startsWith("cat_") ? lower : "cat_1");
}

let sql = `-- ==============================================================================
-- Migration: 20260925000000_seed_complete_production_data.sql
-- Description: Complete production seed for all Citizens, Lawyers, Cases, CNRs,
--              Subscriptions, Payments, Notifications, Video Calls, and Knowledge Base.
-- ==============================================================================

-- 0. Ensure Delhi exists in states table
INSERT INTO public.states (id, name, code, active)
VALUES ('delhi', 'Delhi (NCT)', 'DL', true)
ON CONFLICT (id) DO NOTHING;

-- Disable lawyer taxonomy/language triggers during mass seed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_lawyer_case_taxonomies') THEN
        ALTER TABLE public.lawyers DISABLE TRIGGER trg_validate_lawyer_case_taxonomies;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_lawyer_languages') THEN
        ALTER TABLE public.lawyers DISABLE TRIGGER trg_validate_lawyer_languages;
    END IF;
END $$;

-- 1. SEED CITIZEN USERS & PROFILES
`;

const extraCitizens = [
  {
    id: "u_009",
    name: "Sneha Kapoor",
    email: "sneha.kapoor.del@gmail.com",
    phone: "+91 98101 23456",
    city: "Delhi / New Delhi",
    joinedAt: "2026-07-01",
    lastLoginAt: "2026-09-01T12:00:00",
    status: "Active",
  },
  {
    id: "u_010",
    name: "Rajesh Sharma",
    email: "rajesh.sharma.vja@gmail.com",
    phone: "+91 98480 98765",
    city: "Vijayawada",
    joinedAt: "2026-07-15",
    lastLoginAt: "2026-09-05T10:30:00",
    status: "Active",
  },
];

const allCitizens = [...mock.citizens, ...extraCitizens];
const citizenIdSet = new Set(allCitizens.map((c) => c.id));

for (const c of allCitizens) {
  const loc = getLocation(c.city);
  const userId = `usr_${c.id}`;
  sql += `
INSERT INTO public.users (id, role, email, phone)
VALUES (${escapeSql(userId)}, 'citizen', ${escapeSql(c.email)}, ${escapeSql(c.phone)})
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.citizens (id, user_id, name, email, phone, city, state, state_id, district_id, status, joined_at, last_login_at)
VALUES (
  ${escapeSql(c.id)},
  ${escapeSql(userId)},
  ${escapeSql(c.name)},
  ${escapeSql(c.email)},
  ${escapeSql(c.phone)},
  ${escapeSql(c.city)},
  ${escapeSql(loc.state)},
  ${escapeSql(loc.state_id)},
  ${escapeSql(loc.district_id)},
  ${escapeSql(c.status || "Active")},
  ${escapeSql(c.joinedAt || "2025-01-01")},
  ${escapeSql(c.lastLoginAt || "2026-09-01T10:00:00")}
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  state_id = EXCLUDED.state_id,
  district_id = EXCLUDED.district_id,
  status = EXCLUDED.status;
`;
}

sql += `\n-- 2. SEED LAWYER USERS & PROFILES\n`;

const lawyerIdSet = new Set(mock.lawyers.map((l) => l.id));

for (const l of mock.lawyers) {
  const loc = getLocation(l.city);
  const userId = `usr_${l.id}`;
  const normalizedPracticeAreas = (l.practiceAreas || []).map((p) => {
    const raw = typeof p === "string" ? p : p.name;
    return normalizeCategory(raw);
  });
  // Ensure the primary category is also in practice areas
  const primaryCatId = normalizeCategory(l.category);
  if (!normalizedPracticeAreas.includes(primaryCatId)) {
    normalizedPracticeAreas.unshift(primaryCatId);
  }

  const normalizedLanguages = (l.languages || ["English"]).map(normalizeLang);
  const rawRating = l.rating !== undefined && l.rating !== null ? String(l.rating) : "4.8";

  sql += `
INSERT INTO public.users (id, role, email, phone)
VALUES (${escapeSql(userId)}, 'lawyer', ${escapeSql(l.email)}, ${escapeSql(l.phone)})
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, phone = EXCLUDED.phone;

INSERT INTO public.lawyers (
  id, user_id, name, email, phone, category, role_title, city, state_id, district_id, area,
  bar_id, experience_years, rating, status, active_cases, office_address, bio,
  languages, practice_areas, specializations, legal_services, rating_count, consultation_fee,
  availability_status, bank_name, account_number, ifsc_code, registration_type, declaration_accepted, joined_at
)
VALUES (
  ${escapeSql(l.id)},
  ${escapeSql(userId)},
  ${escapeSql(l.name)},
  ${escapeSql(l.email)},
  ${escapeSql(l.phone)},
  ${escapeSql(l.category)},
  ${escapeSql(l.roleTitle || "Advocate — High Court")},
  ${escapeSql(l.city)},
  ${escapeSql(loc.state_id)},
  ${escapeSql(loc.district_id)},
  ${escapeSql(l.area || null)},
  ${escapeSql(l.barId)},
  ${Number(l.experienceYears) || 5},
  ${escapeSql(rawRating)},
  ${escapeSql(l.status || "Approved")},
  ${Number(l.activeCases) || 0},
  ${escapeSql(l.officeAddress || null)},
  ${escapeSql(l.bio || null)},
  ${escapeJson(normalizedLanguages)},
  ${escapeJson(normalizedPracticeAreas)},
  ${escapeJson(l.specializations || [])},
  ${escapeJson(l.legalServices || [])},
  ${Number(l.ratingCount) || 20},
  ${Number(l.consultationFee) || 1500},
  ${escapeSql(l.availabilityStatus || "Online")},
  ${escapeSql(l.bankName || "State Bank of India")},
  ${escapeSql(l.accountNumber || "•••• 4829")},
  ${escapeSql(l.ifscCode || "SBIN0004812")},
  'lawyer',
  true,
  ${escapeSql(l.joinedAt || "2025-01-01")}
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  bar_id = EXCLUDED.bar_id,
  experience_years = EXCLUDED.experience_years,
  rating = EXCLUDED.rating,
  status = EXCLUDED.status,
  office_address = EXCLUDED.office_address,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  practice_areas = EXCLUDED.practice_areas,
  specializations = EXCLUDED.specializations,
  legal_services = EXCLUDED.legal_services;
`;
}

sql += `
-- Re-enable lawyer triggers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_lawyer_case_taxonomies') THEN
        ALTER TABLE public.lawyers ENABLE TRIGGER trg_validate_lawyer_case_taxonomies;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_lawyer_languages') THEN
        ALTER TABLE public.lawyers ENABLE TRIGGER trg_validate_lawyer_languages;
    END IF;
END $$;
`;

sql += `\n-- 3. SEED IMPORTED eCOURTS DOCKET MATTERS (cases_imported)\n`;

const importedCnrs = new Set();
for (const c of mock.cases) {
  const cnr = c.caseDetails?.cnr || c.cnr;
  if (!cnr || importedCnrs.has(cnr)) continue;
  importedCnrs.add(cnr);

  const caseDetails = c.caseDetails || {};
  const entityInfo = c.entityInfo || {
    cnr,
    lastDateOfHearing: "2025-11-20T00:00:00Z",
    nextDateOfHearing: "2026-09-30T00:00:00Z",
  };
  const files = c.files || { files: [] };
  const descriptions = c.descriptions || { enumFields: [], enumLookup: {} };
  const rawData = c.caseDetails || {};

  sql += `
INSERT INTO public.cases_imported (cnr, case_details, entity_info, files, descriptions, case_ai_analysis, raw_data)
VALUES (
  ${escapeSql(cnr)},
  ${escapeJson(caseDetails)},
  ${escapeJson(entityInfo)},
  ${escapeJson(files)},
  ${escapeJson(descriptions)},
  ${c.caseAiAnalysis ? escapeJson(c.caseAiAnalysis) : "NULL"},
  ${escapeJson(rawData)}
)
ON CONFLICT (cnr) DO UPDATE SET
  case_details = EXCLUDED.case_details,
  entity_info = EXCLUDED.entity_info,
  raw_data = EXCLUDED.raw_data;
`;
}

sql += `\n-- 4. SEED USER CASES (cases_user)\n`;

for (const c of mock.cases) {
  const cnrCandidate = c.caseDetails?.cnr || c.cnr || null;
  const cnr = cnrCandidate && importedCnrs.has(cnrCandidate) ? cnrCandidate : null;
  const statusStr = (c.status || "Submitted").toLowerCase();

  let caseType = "new";
  if (statusStr === "closed") caseType = "closed";
  else if (cnr) caseType = "pending";

  let stage = "submitted";
  if (statusStr === "assigned") stage = "accepted";
  else if (statusStr === "in progress") stage = "filinginprogress";
  else if (statusStr === "hearing" || statusStr === "order" || cnr) stage = "cnrgenerated";
  else if (statusStr === "rejected") stage = "rejected";
  else if (statusStr === "closed") stage = "cnrgenerated";

  let caseStatus = statusStr.replace(/\s+/g, "");
  if (!["submitted", "accepted", "filinginprogress", "cnrgenerated", "closed", "rejected"].includes(caseStatus)) {
    caseStatus = stage;
  }

  const citizenId = c.citizenId && citizenIdSet.has(c.citizenId) ? c.citizenId : "u_001";
  const lawyerId = c.lawyerId && lawyerIdSet.has(c.lawyerId) ? c.lawyerId : null;

  const spec = (Array.isArray(c.specializations) && c.specializations[0]) || c.category || "General";
  const notes = c.notes || [];

  const petitioner =
    (Array.isArray(c.caseDetails?.petitioners) && c.caseDetails.petitioners[0]) ||
    c.citizenName ||
    (c.title ? c.title.split(/\s+vs\.?\s+|\s+—\s+|\s+-\s+/i)[0]?.trim() : null) ||
    "Petitioner";
  const respondent =
    (Array.isArray(c.caseDetails?.respondents) && c.caseDetails.respondents[0]) ||
    (c.title && /\s+vs\.?\s+|\s+—\s+|\s+-\s+/i.test(c.title) ? c.title.split(/\s+vs\.?\s+|\s+—\s+|\s+-\s+/i)[1]?.trim() : null) ||
    null;

  sql += `
INSERT INTO public.cases_user (
  id, citizen_id, lawyer_id, case_type, cnr, petitioner, respondent, description,
  documents, practice_area, specialization, legal_services,
  case_status, lawyer_casestage_id, rejection_reason, is_emergency, timeline, notes
)
VALUES (
  ${escapeSql(c.id)},
  ${escapeSql(citizenId)},
  ${escapeSql(lawyerId)},
  ${escapeSql(caseType)},
  ${escapeSql(cnr)},
  ${escapeSql(petitioner)},
  ${escapeSql(respondent)},
  ${escapeSql(c.description || c.title || "Legal matter")},
  ${escapeJson(c.documents || [])},
  ${escapeSql(c.category || "Criminal Defense")},
  ${escapeSql(spec)},
  ${escapeJson(c.legalServices || [])},
  ${escapeSql(caseStatus)},
  ${escapeSql(stage)},
  ${escapeSql(c.rejectionReason || null)},
  ${c.isEmergency ? "true" : "false"},
  ${escapeJson(c.timeline || [])},
  ${escapeJson(notes)}
)
ON CONFLICT (id) DO UPDATE SET
  lawyer_id = EXCLUDED.lawyer_id,
  case_status = EXCLUDED.case_status,
  lawyer_casestage_id = EXCLUDED.lawyer_casestage_id,
  timeline = EXCLUDED.timeline,
  notes = EXCLUDED.notes;
`;
}
}

sql += `\n-- 5. SEED SUBSCRIPTIONS\n`;

for (const s of mock.subscriptions) {
  const citizenId = s.citizenId && citizenIdSet.has(s.citizenId) ? s.citizenId : "u_001";
  sql += `
INSERT INTO public.subscriptions (id, citizen_id, plan_id, plan_label, amount, started_at, status, case_id)
VALUES (
  ${escapeSql(s.id)},
  ${escapeSql(citizenId)},
  ${escapeSql(s.planId)},
  ${escapeSql(s.planLabel)},
  ${Number(s.amount) || 499},
  ${escapeSql(s.startedAt || "2026-01-01")},
  ${escapeSql(s.status || "Active")},
  ${escapeSql(s.caseId || null)}
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  plan_label = EXCLUDED.plan_label;
`;
}

sql += `\n-- 6. SEED PAYMENTS\n`;

for (const p of mock.payments) {
  const citizenId = p.citizenId && citizenIdSet.has(p.citizenId) ? p.citizenId : null;
  const lawyerId = p.lawyerId && lawyerIdSet.has(p.lawyerId) ? p.lawyerId : null;

  sql += `
INSERT INTO public.payments (
  id, source, date, status, citizen_id, citizen_name, lawyer_id, lawyer_name,
  case_id, case_title, gross_amount, platform_amount, lawyer_amount,
  razorpay_order_id, razorpay_payment_id
)
VALUES (
  ${escapeSql(p.id)},
  ${escapeSql(p.source || "commission")},
  ${escapeSql(p.date || "2026-08-01")},
  ${escapeSql(p.status || "Completed")},
  ${escapeSql(citizenId)},
  ${escapeSql(p.citizenName || null)},
  ${escapeSql(lawyerId)},
  ${escapeSql(p.lawyerName || null)},
  ${escapeSql(p.caseId || null)},
  ${escapeSql(p.caseTitle || null)},
  ${Number(p.grossAmount) || 0},
  ${Number(p.platformAmount) || 0},
  ${Number(p.lawyerAmount) || 0},
  ${escapeSql(`order_mock_${p.id}`)},
  ${escapeSql(`pay_mock_${p.id}`)}
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  gross_amount = EXCLUDED.gross_amount;
`;
}

sql += `\n-- 7. SEED WITHDRAWAL REQUESTS\n`;

const withdrawals = [
  {
    id: "w_101",
    lawyerId: "l_001",
    lawyerName: "Swathi Reddy",
    amount: 12240,
    requestedAt: "2026-09-02",
    status: "Approved",
    bankName: "HDFC Bank Ltd",
    accountNumber: "•••• 4829",
    ifscCode: "HDFC0001234",
    processedAt: "2026-09-03",
    referenceId: "TXN_94820194",
  },
  {
    id: "w_102",
    lawyerId: "l_002",
    lawyerName: "Srinivas Chowdary",
    amount: 8500,
    requestedAt: "2026-09-06",
    status: "Pending",
    bankName: "State Bank of India",
    accountNumber: "•••• 9102",
    ifscCode: "SBIN0004812",
  },
  {
    id: "w_103",
    lawyerId: "l_003",
    lawyerName: "Sailaja Naidu",
    amount: 15400,
    requestedAt: "2026-09-07",
    status: "Pending",
    bankName: "ICICI Bank",
    accountNumber: "•••• 3391",
    ifscCode: "ICIC0000281",
  },
  {
    id: "w_104",
    lawyerId: "l_004",
    lawyerName: "Ananya Rao",
    amount: 16800,
    requestedAt: "2026-09-07",
    status: "Pending",
    bankName: "Axis Bank",
    accountNumber: "•••• 7714",
    ifscCode: "UTIB0001092",
  },
  {
    id: "w_105",
    lawyerId: "l_005",
    lawyerName: "Rajeshwar Rao",
    amount: 6800,
    requestedAt: "2026-08-24",
    status: "Rejected",
    bankName: "Union Bank of India",
    accountNumber: "•••• 5567",
    ifscCode: "UBIN0553441",
    processedAt: "2026-08-26",
    rejectionReason: "Account name mismatch — please re-submit with updated bank proof.",
  },
];

for (const w of withdrawals) {
  const lawyerId = lawyerIdSet.has(w.lawyerId) ? w.lawyerId : "l_001";
  sql += `
INSERT INTO public.withdrawal_requests (
  id, lawyer_id, lawyer_name, amount, requested_at, status, bank_name,
  account_number, ifsc_code, processed_at, reference_id, rejection_reason
)
VALUES (
  ${escapeSql(w.id)},
  ${escapeSql(lawyerId)},
  ${escapeSql(w.lawyerName)},
  ${Number(w.amount) || 0},
  ${escapeSql(w.requestedAt)},
  ${escapeSql(w.status)},
  ${escapeSql(w.bankName)},
  ${escapeSql(w.accountNumber)},
  ${escapeSql(w.ifscCode)},
  ${escapeSql(w.processedAt || null)},
  ${escapeSql(w.referenceId || null)},
  ${escapeSql(w.rejectionReason || null)}
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  processed_at = EXCLUDED.processed_at,
  reference_id = EXCLUDED.reference_id,
  rejection_reason = EXCLUDED.rejection_reason;
`;
}

sql += `\n-- 8. SEED NOTIFICATIONS\n`;

for (const n of mock.notifications) {
  sql += `
INSERT INTO public.app_notifications (id, role, title, body, at, read)
VALUES (
  ${escapeSql(n.id)},
  ${escapeSql(n.role || "citizen")},
  ${escapeSql(n.title)},
  ${escapeSql(n.body)},
  ${escapeSql(n.at || "2026-08-01 10:00")},
  ${n.read ? "true" : "false"}
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  read = EXCLUDED.read;
`;
}

sql += `\n-- 9. SEED VIDEO CALLS\n`;

for (const v of mock.videoCalls) {
  sql += `
INSERT INTO public.video_calls (id, case_id, channel_name, with_name, caller_id, receiver_id, at, duration_seconds, status, role)
VALUES (
  ${escapeSql(v.id)},
  ${escapeSql(v.caseId || null)},
  ${escapeSql(`channel_${v.id}`)},
  ${escapeSql(v.withName)},
  ${escapeSql(v.role === "citizen" ? "u_001" : "l_001")},
  ${escapeSql(v.role === "citizen" ? "l_001" : "u_001")},
  ${escapeSql(v.at || "2026-09-01T10:00:00Z")},
  ${Number(v.durationSeconds) || 600},
  ${escapeSql(v.status || "completed")},
  ${escapeSql(v.role || "citizen")}
)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  duration_seconds = EXCLUDED.duration_seconds;
`;
}

sql += `\n-- 10. SEED KNOWLEDGE BASE ITEMS\n`;

for (const k of mock.knowledgeBase) {
  sql += `
INSERT INTO public.knowledge_items (id, title, type, category, size, file_url, file_name, file_mime_type, uploaded_at)
VALUES (
  ${escapeSql(k.id)},
  ${escapeSql(k.title)},
  ${escapeSql(k.type || "Act")},
  ${escapeSql(k.category || "General")},
  ${escapeSql(k.size || "1.5 MB")},
  ${escapeSql(`https://closeurcase.app/docs/${k.id}.pdf`)},
  ${escapeSql(`${k.id}.pdf`)},
  'application/pdf',
  ${escapeSql(k.uploadedAt || "2025-01-01")}
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  size = EXCLUDED.size;
`;
}

const outPath = path.resolve(__dirname, "migrations/20260925000000_seed_complete_production_data.sql");
fs.writeFileSync(outPath, sql, "utf8");
console.log("Successfully wrote migration to:", outPath);
console.log("File size bytes:", fs.statSync(outPath).size);
