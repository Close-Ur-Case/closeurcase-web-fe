import type {
  CaseStatus,
  FirDetails,
  HistoryOfHearing,
  InterimOrder,
  LegalCase,
  LegalCategory,
} from "@/types";

export type ImportSearchMethod =
  "Party Name" | "Case Number" | "Diary Number" | "Lawyer Name" | "CNR Number";

export interface ImportableCourtCase {
  id: string;
  title: string;
  petitioners: string[];
  respondents: string[];
  petitionerLawyers: string[];
  respondentLawyers: string[];
  category: LegalCategory;
  courtName: string;
  caseType: string;
  caseNumber: string;
  caseYear: string;
  cnrNumber: string;
  diaryNumber: string;
  stage: string;
  filingDate: string;
  status: CaseStatus;
  city: string;
  description: string;
  historyOfCaseHearings: HistoryOfHearing[];
  interimOrders?: InterimOrder[];
  firDetails?: FirDetails;
}

const bodhanHearings: HistoryOfHearing[] = [
  {
    judge: "V Additional District And Sessions Judge, Hyderabad",
    businessOnDate: "2025-12-10",
    hearingDate: "2026-03-11",
    time: "10:30 AM",
    purposeOfListing: "Civil-dailylist",
  },
  {
    judge: "V Additional District And Sessions Judge, Hyderabad",
    businessOnDate: "2026-03-11",
    hearingDate: "2026-03-18",
    time: "10:30 AM",
    purposeOfListing: "Civil-dailylist",
  },
  {
    judge: "V Additional District And Sessions Judge, Hyderabad, Smt. D.Varoodhini",
    businessOnDate: "2026-03-18",
    hearingDate: "2026-07-15",
    time: "10:30 AM",
    purposeOfListing: "Parties present; adjourned for filing of written statement.",
  },
  {
    judge: "V Additional District And Sessions Judge, Hyderabad",
    businessOnDate: "2026-07-15",
    hearingDate: "2026-07-28",
    time: "10:30 AM",
    purposeOfListing: "Written statement filed by respondent; matter posted for evidence.",
  },
  {
    judge: "V Additional District And Sessions Judge, Hyderabad",
    businessOnDate: "2026-07-28",
    hearingDate: "2026-08-12",
    time: "10:30 AM",
    purposeOfListing: "Civil-dailylist",
  },
];

export const importableCourtCases: ImportableCourtCase[] = [
  {
    id: "ec_1",
    title:
      "Yadamakanti Laxmi Narayana Reddy vs Nizam Sugars LTD (Nsl) Represented by its Authorized Signatory Sri K Ramesh Babu",
    petitioners: ["Yadamakanti Laxmi Narayana Reddy"],
    respondents: [
      "Nizam Sugars LTD (Nsl) Represented by its Authorized Signatory Sri K Ramesh Babu",
    ],
    petitionerLawyers: ["testing account"],
    respondentLawyers: ["Not on record"],
    category: "Civil",
    courtName: "City Civil Court, Hyderabad",
    caseType: "OS",
    caseNumber: "OS/4/2025",
    caseYear: "2025",
    cnrNumber: "TSNI080001912025",
    diaryNumber: "DY/112/2025",
    stage: "WRITTEN STATEMENT",
    filingDate: "2025-12-10",
    status: "Pending",
    city: "Hyderabad",
    description:
      "Original suit filed before the City Civil Court, Hyderabad concerning a civil dispute between Yadamakanti Laxmi Narayana Reddy and Nizam Sugars LTD (Nsl). Matter is currently at the written statement stage.",
    historyOfCaseHearings: bodhanHearings,
  },
  {
    id: "ec_2",
    title: "Ramesh Kumar vs State Bank of Hyderabad",
    petitioners: ["Ramesh Kumar"],
    respondents: ["State Bank of Hyderabad"],
    petitionerLawyers: ["K. Srinivas"],
    respondentLawyers: ["Bank Legal Panel"],
    category: "Consumer",
    courtName: "District Consumer Disputes Redressal Commission, Visakhapatnam",
    caseType: "CC",
    caseNumber: "CC/17/2026",
    caseYear: "2026",
    cnrNumber: "APVK020001172026",
    diaryNumber: "DY/044/2026",
    stage: "ARGUMENTS",
    filingDate: "2026-01-20",
    status: "Pending",
    city: "Visakhapatnam",
    description:
      "Consumer complaint regarding a disputed loan foreclosure charge, pending before the District Consumer Disputes Redressal Commission, Visakhapatnam.",
    historyOfCaseHearings: [
      {
        judge: "President, DCDRC Visakhapatnam",
        businessOnDate: "2026-01-20",
        hearingDate: "2026-08-20",
        time: "11:00 AM",
        purposeOfListing: "Consumer-dailylist",
      },
    ],
  },
  {
    id: "ec_3",
    title: "Telangana State Pollution Control Board vs Vishwa Industries Pvt Ltd",
    petitioners: ["Telangana State Pollution Control Board"],
    respondents: ["Vishwa Industries Pvt Ltd"],
    petitionerLawyers: ["Govt. Pleader"],
    respondentLawyers: ["M. Aditya Rao"],
    category: "Environmental",
    courtName: "High Court for the State of Telangana",
    caseType: "WP",
    caseNumber: "WP/2211/2026",
    caseYear: "2026",
    cnrNumber: "TSHC010022112026",
    diaryNumber: "DY/501/2026",
    stage: "COUNTER FILED",
    filingDate: "2026-02-02",
    status: "Pending",
    city: "Hyderabad",
    description:
      "Writ petition concerning compliance with effluent discharge norms, pending before the High Court for the State of Telangana.",
    historyOfCaseHearings: [
      {
        judge: "Hon'ble Justice Bench-II",
        businessOnDate: "2026-02-02",
        hearingDate: "2026-09-02",
        time: "10:00 AM",
        purposeOfListing: "WP-dailylist",
      },
    ],
    interimOrders: [
      {
        orderDate: "2026-02-15",
        description:
          "Interim direction to maintain effluent discharge within prescribed limits pending disposal.",
        orderUrl: "order-ec3-1.pdf",
      },
    ],
  },
  {
    id: "ec_4",
    title: "State of Telangana vs Mohammed Irfan Ali",
    petitioners: ["State of Telangana"],
    respondents: ["Mohammed Irfan Ali"],
    petitionerLawyers: ["Public Prosecutor"],
    respondentLawyers: ["Syed Nawaz Ahmed"],
    category: "Criminal",
    courtName: "Metropolitan Criminal Court, Hyderabad",
    caseType: "SC",
    caseNumber: "SC/318/2025",
    caseYear: "2025",
    cnrNumber: "TSCR030003182025",
    diaryNumber: "DY/612/2025",
    stage: "EVIDENCE",
    filingDate: "2025-09-14",
    status: "Pending",
    city: "Hyderabad",
    description:
      "Sessions case concerning charges under the Indian Penal Code, presently at the evidence recording stage before the Metropolitan Criminal Court, Hyderabad.",
    historyOfCaseHearings: [
      {
        judge: "II Metropolitan Sessions Judge, Hyderabad",
        businessOnDate: "2025-09-14",
        hearingDate: "2026-09-05",
        time: "11:30 AM",
        purposeOfListing: "Criminal-dailylist",
      },
    ],
    firDetails: { caseNumber: "612", policeStation: "Cyberabad Police Station", year: "2025" },
  },
  {
    id: "ec_5",
    title: "K. Venkateswara Rao vs G. Padmavathi",
    petitioners: ["K. Venkateswara Rao"],
    respondents: ["G. Padmavathi"],
    petitionerLawyers: ["P. Rajesh"],
    respondentLawyers: ["Not on record"],
    category: "Property",
    courtName: "District Court, Visakhapatnam",
    caseType: "OS",
    caseNumber: "OS/212/2025",
    caseYear: "2025",
    cnrNumber: "APVS040002122025",
    diaryNumber: "DY/305/2025",
    stage: "ISSUES FRAMED",
    filingDate: "2025-11-05",
    status: "Pending",
    city: "Visakhapatnam",
    description:
      "Original suit for declaration of title and permanent injunction over ancestral property, pending before the District Court, Visakhapatnam.",
    historyOfCaseHearings: [
      {
        judge: "III Additional District Judge, Visakhapatnam",
        businessOnDate: "2025-11-05",
        hearingDate: "2026-09-10",
        time: "10:15 AM",
        purposeOfListing: "Civil-dailylist",
      },
    ],
  },
  {
    id: "ec_6",
    title: "Anjali Reddy vs Karthik Reddy",
    petitioners: ["Anjali Reddy"],
    respondents: ["Karthik Reddy"],
    petitionerLawyers: ["Deepa Nair"],
    respondentLawyers: ["Not on record"],
    category: "Family",
    courtName: "Family Court, Hyderabad",
    caseType: "OP",
    caseNumber: "OP/89/2026",
    caseYear: "2026",
    cnrNumber: "TSFC050000892026",
    diaryNumber: "DY/077/2026",
    stage: "MEDIATION",
    filingDate: "2026-03-18",
    status: "Pending",
    city: "Hyderabad",
    description:
      "Petition seeking dissolution of marriage by mutual consent, currently referred for mediation before the Family Court, Hyderabad.",
    historyOfCaseHearings: [
      {
        judge: "Principal Judge, Family Court, Hyderabad",
        businessOnDate: "2026-03-18",
        hearingDate: "2026-09-08",
        time: "9:45 AM",
        purposeOfListing: "Family-dailylist",
      },
    ],
  },
  {
    id: "ec_7",
    title: "S. Manoj Kumar vs Unknown Accused",
    petitioners: ["S. Manoj Kumar"],
    respondents: ["Unknown Accused"],
    petitionerLawyers: ["testing account"],
    respondentLawyers: ["Not on record"],
    category: "Cyber",
    courtName: "Chief Metropolitan Magistrate Court, Hyderabad",
    caseType: "CC",
    caseNumber: "CC/455/2026",
    caseYear: "2026",
    cnrNumber: "TSCY060004552026",
    diaryNumber: "DY/198/2026",
    stage: "INVESTIGATION REPORT AWAITED",
    filingDate: "2026-04-22",
    status: "Pending",
    city: "Hyderabad",
    description:
      "Complaint alleging unauthorized online financial fraud under the Information Technology Act, pending investigation report before the Chief Metropolitan Magistrate Court, Hyderabad.",
    historyOfCaseHearings: [
      {
        judge: "Chief Metropolitan Magistrate, Hyderabad",
        businessOnDate: "2026-04-22",
        hearingDate: "2026-09-15",
        time: "11:00 AM",
        purposeOfListing: "Criminal-dailylist",
      },
    ],
  },
  {
    id: "ec_8",
    title: "Kavya Textiles Pvt Ltd vs Registrar of Companies",
    petitioners: ["Kavya Textiles Pvt Ltd"],
    respondents: ["Registrar of Companies"],
    petitionerLawyers: ["M. Aditya Rao"],
    respondentLawyers: ["Central Govt. Standing Counsel"],
    category: "Corporate",
    courtName: "National Company Law Tribunal, Hyderabad Bench",
    caseType: "CP",
    caseNumber: "CP/76/2026",
    caseYear: "2026",
    cnrNumber: "TSCO070000762026",
    diaryNumber: "DY/233/2026",
    stage: "ADMITTED",
    filingDate: "2026-05-11",
    status: "Pending",
    city: "Hyderabad",
    description:
      "Company petition seeking compounding of an offence under the Companies Act, admitted and pending before the National Company Law Tribunal, Hyderabad Bench.",
    historyOfCaseHearings: [
      {
        judge: "Judicial Member, NCLT Hyderabad",
        businessOnDate: "2026-05-11",
        hearingDate: "2026-09-20",
        time: "2:30 PM",
        purposeOfListing: "NCLT-dailylist",
      },
    ],
  },
  {
    id: "ec_9",
    title: "Textile Workers Union vs Sri Balaji Spinning Mills",
    petitioners: ["Textile Workers Union"],
    respondents: ["Sri Balaji Spinning Mills"],
    petitionerLawyers: ["K. Srinivas"],
    respondentLawyers: ["Management Counsel"],
    category: "Labour",
    courtName: "Labour Court, Visakhapatnam",
    caseType: "ID",
    caseNumber: "ID/61/2025",
    caseYear: "2025",
    cnrNumber: "APLB080000612025",
    diaryNumber: "DY/410/2025",
    stage: "CROSS EXAMINATION",
    filingDate: "2025-10-02",
    status: "Pending",
    city: "Visakhapatnam",
    description:
      "Industrial dispute concerning alleged wrongful termination of workers, presently at the cross-examination stage before the Labour Court, Visakhapatnam.",
    historyOfCaseHearings: [
      {
        judge: "Presiding Officer, Labour Court, Visakhapatnam",
        businessOnDate: "2025-10-02",
        hearingDate: "2026-09-12",
        time: "10:00 AM",
        purposeOfListing: "Labour-dailylist",
      },
    ],
  },
  {
    id: "ec_10",
    title: "Sri Lakshmi Enterprises vs Commissioner of Income Tax",
    petitioners: ["Sri Lakshmi Enterprises"],
    respondents: ["Commissioner of Income Tax"],
    petitionerLawyers: ["V. Prasanna Kumar"],
    respondentLawyers: ["Departmental Representative"],
    category: "Tax",
    courtName: "Income Tax Appellate Tribunal (ITAT) Hyderabad",
    caseType: "ITA",
    caseNumber: "ITA/142/2026",
    caseYear: "2026",
    cnrNumber: "TSTX090001422026",
    diaryNumber: "DY/566/2026",
    stage: "ARGUMENTS",
    filingDate: "2026-06-09",
    status: "Pending",
    city: "Hyderabad",
    description:
      "Appeal against disallowance of business expenditure, pending before the Income Tax Appellate Tribunal, Hyderabad.",
    historyOfCaseHearings: [
      {
        judge: "Accountant Member, ITAT Hyderabad, Judicial Member, ITAT Hyderabad",
        businessOnDate: "2026-06-09",
        hearingDate: "2026-09-25",
        time: "11:15 AM",
        purposeOfListing: "ITAT-dailylist",
      },
    ],
  },
];

/** Fisher-Yates shuffle — used so a no-exact-match search doesn't always fall back to the same case. */
export function shuffleCourtCases(cases: ImportableCourtCase[]): ImportableCourtCase[] {
  const arr = [...cases];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function searchCourtCases(params: {
  method: ImportSearchMethod;
  courtName?: string;
  caseType?: string;
  caseNumber?: string;
  caseYear?: string;
  query?: string;
}): ImportableCourtCase[] {
  const { method, courtName, caseType, caseNumber, caseYear, query } = params;
  const q = (query ?? "").trim().toLowerCase();

  return importableCourtCases.filter((c) => {
    if (courtName && !c.courtName.toLowerCase().includes(courtName.trim().toLowerCase())) {
      return false;
    }

    switch (method) {
      case "Case Number": {
        const typeOk = !caseType || c.caseType.toLowerCase() === caseType.trim().toLowerCase();
        const numberOk =
          !caseNumber || c.caseNumber.toLowerCase().includes(caseNumber.trim().toLowerCase());
        const yearOk = !caseYear || c.caseYear === caseYear.trim();
        return typeOk && numberOk && yearOk;
      }
      case "Diary Number":
        return !q || c.diaryNumber.toLowerCase().includes(q);
      case "CNR Number":
        return !q || c.cnrNumber.toLowerCase().includes(q);
      case "Lawyer Name":
        return (
          !q ||
          c.petitionerLawyers.some((a) => a.toLowerCase().includes(q)) ||
          c.respondentLawyers.some((a) => a.toLowerCase().includes(q))
        );
      case "Party Name":
      default:
        return (
          !q ||
          c.title.toLowerCase().includes(q) ||
          c.petitioners.some((p) => p.toLowerCase().includes(q)) ||
          c.respondents.some((r) => r.toLowerCase().includes(q))
        );
    }
  });
}

export function toLegalCase(
  source: ImportableCourtCase,
  lawyerId: string,
  lawyerName: string,
): LegalCase {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const nowIso = now.toISOString();
  const lastEntry = source.historyOfCaseHearings[source.historyOfCaseHearings.length - 1];
  return {
    id: `CS-${Math.floor(10000 + Math.random() * 90000)}`,
    title: source.title,
    description: source.description,
    category: source.category,
    citizenId: undefined,
    citizenName: source.petitioners[0] ?? "Unlinked Client",
    lawyerId,
    lawyerName,
    status: source.status,
    city: source.city,
    createdAt: today,
    updatedAt: today,
    source: "ecourt",
    timeline: [
      {
        id: "t1",
        status: source.status,
        at: today,
        time,
        note: `Imported from eCourts (${source.cnrNumber})`,
      },
    ],
    caseDetails: {
      caseNumber: source.caseNumber,
      cnr: source.cnrNumber,
      caseType: source.caseType,
      courtName: source.courtName,
      purpose: source.stage,
      filingDate: source.filingDate,
      historyOfCaseHearings: source.historyOfCaseHearings,
      interimOrders: source.interimOrders ?? [],
      firDetails: source.firDetails,
      judges: Array.from(new Set(source.historyOfCaseHearings.map((h) => h.judge))),
      petitioners: source.petitioners,
      petitionerAdvocates: source.petitionerLawyers,
      respondents: source.respondents,
      respondentAdvocates: source.respondentLawyers,
      caseCategoryFacetPath: `${source.category} Law`,
      hasOrders: (source.interimOrders?.length ?? 0) > 0,
      hasJudgments: false,
      orderCount: source.interimOrders?.length ?? 0,
      interimOrderCount: source.interimOrders?.length ?? 0,
      judgmentCount: 0,
      hearingCount: source.historyOfCaseHearings.length,
      iaCount: 0,
      taggedMatters: [],
      judgmentOrders: [],
    },
    entityInfo: {
      cnr: source.cnrNumber,
      nextDateOfHearing: lastEntry?.hearingDate ? `${lastEntry.hearingDate}T00:00:00Z` : undefined,
      lastDateOfHearing: lastEntry?.businessOnDate
        ? `${lastEntry.businessOnDate}T00:00:00Z`
        : undefined,
      dateCreated: nowIso,
      dateModified: nowIso,
    },
    files: { files: [] },
    descriptions: {
      enumFields: [
        "caseType",
        "caseStatus",
        "courtCode",
        "judicialSection",
        "caseCategory",
        "benchType",
        "stateCode",
      ],
      enumLookup: {},
    },
    caseAiAnalysis: null,
  };
}
