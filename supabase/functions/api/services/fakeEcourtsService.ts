/**
 * Fake eCourts API Service
 * Generates realistic, fully populated Indian eCourts case dockets
 * deterministically based on any 16-character alphanumeric CNR number
 * without using or querying any database.
 * 
 * Strict compliance with the standard eCourts response structure:
 * {
 *   "data": {
 *     "courtCaseData": { ... },
 *     "entityInfo": { ... },
 *     "files": { "files": [] },
 *     "descriptions": { ... },
 *     "caseAiAnalysis": null
 *   },
 *   "meta": { "request_id": "..." }
 * }
 */

export interface FakeEcourtsInterimOrder {
  orderUrl: string;
  orderDate: string;
  description: string;
}

export interface FakeEcourtsTaggedMatter {
  type: string;
  caseNumber: string;
}

export interface FakeEcourtsHearing {
  time?: string;
  judge: string;
  hearingDate: string;
  businessOnDate: string;
  purposeOfListing: string;
}

export interface FakeEcourtsBusinessOnDateEntry {
  date: string;
  courtOf?: string;
  petitioner: string;
  respondent: string;
  business: string;
  nextPurpose: string;
  nextHearingDate: string;
}

export interface FakeEcourtsFullResponse {
  data: {
    courtCaseData: Record<string, any>;
    entityInfo: {
      cnr: string;
      nextDateOfHearing?: string | null;
      lastDateOfHearing?: string | null;
      dateCreated: string;
      dateModified: string;
    };
    files: { files: any[] };
    descriptions: {
      enumFields: string[];
      enumLookup: Record<string, Record<string, string>>;
    };
    caseAiAnalysis: any | null;
  };
  meta: {
    request_id: string;
  };
}

// State dictionary
const STATES: Record<string, { name: string; districts: Record<string, string> }> = {
  AP: {
    name: "Andhra Pradesh",
    districts: {
      VK: "Visakhapatnam",
      VI: "Vijayawada",
      GT: "Guntur",
      TP: "Tirupati",
      KR: "Kurnool",
      NL: "Nellore",
    },
  },
  TS: {
    name: "Telangana",
    districts: {
      HY: "Hyderabad",
      RR: "Ranga Reddy",
      WR: "Warangal",
      NZ: "Nizamabad",
      KM: "Khammam",
      MD: "Medak",
    },
  },
  DL: {
    name: "Delhi",
    districts: {
      ND: "New Delhi",
      DL: "Central Delhi",
      SW: "South West Delhi",
      SE: "South East Delhi",
      NW: "North West Delhi",
      ED: "East Delhi",
    },
  },
  MH: {
    name: "Maharashtra",
    districts: {
      MU: "Mumbai",
      PU: "Pune",
      NG: "Nagpur",
      TH: "Thane",
      NS: "Nashik",
      AU: "Aurangabad",
    },
  },
  KA: {
    name: "Karnataka",
    districts: {
      BL: "Bengaluru Urban",
      MY: "Mysuru",
      MG: "Mangaluru",
      HB: "Hubballi-Dharwad",
      BG: "Belagavi",
    },
  },
  TN: {
    name: "Tamil Nadu",
    districts: {
      CH: "Chennai",
      CB: "Coimbatore",
      MD: "Madurai",
      TR: "Tiruchirappalli",
      SL: "Salem",
    },
  },
  UP: {
    name: "Uttar Pradesh",
    districts: {
      LK: "Lucknow",
      KN: "Kanpur",
      VR: "Varanasi",
      AG: "Agra",
      NO: "Gautam Buddha Nagar",
      GZ: "Ghaziabad",
    },
  },
  WB: {
    name: "West Bengal",
    districts: {
      KL: "Kolkata",
      HW: "Howrah",
      DG: "Darjeeling",
      SL: "Siliguri",
    },
  },
  GJ: {
    name: "Gujarat",
    districts: {
      AH: "Ahmedabad",
      SR: "Surat",
      VD: "Vadodara",
      RJ: "Rajkot",
    },
  },
  KL: {
    name: "Kerala",
    districts: {
      TV: "Thiruvananthapuram",
      EK: "Ernakulam",
      KZ: "Kozhikode",
      TS: "Thrissur",
    },
  },
};

const CASE_TYPES = [
  {
    code: "MVOP",
    raw: "Motor Vehicle Original Petition",
    category: "Civil Law/Motor Accident Claims",
    court: "Motor Accidents Claims Tribunal",
  },
  {
    code: "OS",
    raw: "Original Suit",
    category: "Civil Law/Property Disputes",
    court: "Senior Civil Judge Court",
  },
  {
    code: "CC",
    raw: "Criminal Case",
    category: "Criminal Law/General Criminal",
    court: "Chief Judicial Magistrate Court",
  },
  {
    code: "ARB",
    raw: "Arbitration Petition",
    category: "Commercial Law/Arbitration Claims",
    court: "Commercial Court",
  },
  {
    code: "WP",
    raw: "Writ Petition",
    category: "Constitutional Law/Writ Jurisdiction",
    court: "High Court Division Bench",
  },
  {
    code: "OP",
    raw: "Original Petition",
    category: "Family Law/Matrimonial Disputes",
    court: "Family Court",
  },
  {
    code: "CA",
    raw: "Company Application",
    category: "Corporate Law/NCLT Matters",
    court: "National Company Law Tribunal",
  },
  {
    code: "CRLMP",
    raw: "Criminal Miscellaneous Petition",
    category: "Criminal Law/Bail Applications",
    court: "Sessions Court",
  },
];

const PETITIONERS = [
  "K. Padma Rao",
  "Sai Teja Reddy",
  "Ramesh Chandran",
  "Suresh Kumar Agarwal",
  "Sunita Mehra",
  "Vikramaditya Verma",
  "Ananya Bhattacharya",
  "Mohd. Tariq Siddiqui",
  "G. Venkateshwarlu",
  "Pooja Deshmukh",
];

const RESPONDENTS_PRIMARY = [
  "Andhra Pradesh State Road Transport Corporation",
  "Telangana State Road Transport Corporation",
  "ABC Developers & Builders Pvt. Ltd.",
  "State of NCT of Delhi (through SHO)",
  "HDFC Ergo General Insurance Co. Ltd.",
  "ICICI Lombard General Insurance Co. Ltd.",
  "Shri Balaji Transporters & Logistics",
  "Municipal Corporation of Hyderabad",
  "Brigade Hospitality & Realty Ltd.",
  "Godrej Properties Infrastructure Ltd.",
];

const RESPONDENTS_SECONDARY = [
  "United India Insurance Co. Ltd. (Insurer)",
  "National Insurance Co. Ltd.",
  "The Branch Manager, SBI Life Insurance",
  "Director of Town & Country Planning",
  "Regional Transport Authority",
];

const PETITIONER_ADVOCATES = [
  "Swathi Reddy",
  "K. V. Subba Rao",
  "Rohit P. Deshpande",
  "Meenakshi Sundaram",
  "Rajiv Ranjan",
  "Sunil Dutt Sharma",
  "Priya Nambiar",
];

const RESPONDENT_ADVOCATES = [
  "APSRTC Legal Cell",
  "TSRTC Standing Counsel",
  "Panel Counsel, United India Insurance",
  "Standing Counsel for Municipal Corporation",
  "Government Pleader for Transport",
  "Corporate Legal Advisors LLP",
];

const PURPOSES = [
  "Misc./ Appearance",
  "Misc. Arguments",
  "Prosecution Evidence",
  "Plaintiff/Petitioner Evidence",
  "Respondent Evidence",
  "Framing of Issues",
  "Heard on Interim Relief",
  "Arguments on IA",
];

// Canonical fixture for DLND020047882015
const CANONICAL_DLND020047882015: FakeEcourtsFullResponse = {
  data: {
    courtCaseData: {
      caseNumber: "202400248072016",
      district: "New Delhi",
      state: "DL",
      stateCode: "26",
      districtCode: "7",
      courtCode: 2,
      caseTypeSub: "Criminal Procedure Code.",
      courtName: "Chief Metropolitan Magistrate, New Delhi, PHC",
      courtNo: 2,
      firDetails: { caseNumber: "273", policeStation: "Central Crime Branch-CCB I", year: "2018" },
      historyOfCaseHearings: [
        { judge: "", businessOnDate: "2016-01-05", hearingDate: "2016-04-07", purposeOfListing: "Misc./ Appearance" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2016-04-07", hearingDate: "2016-05-19", purposeOfListing: "Misc./ Appearance" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2016-05-19", hearingDate: "2016-07-16", purposeOfListing: "Misc./ Appearance" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2016-07-16", hearingDate: "2016-08-16", purposeOfListing: "Misc./ Appearance" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2016-08-16", hearingDate: "2016-10-24", purposeOfListing: "Misc./ Appearance" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2016-10-24", hearingDate: "2016-11-26", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2016-11-26", hearingDate: "2016-12-20", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2016-12-20", hearingDate: "2017-01-18", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2017-01-18", hearingDate: "2017-03-25", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2017-03-25", hearingDate: "2017-05-20", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2017-05-20", hearingDate: "2017-08-05", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2017-08-05", hearingDate: "2017-09-25", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2017-09-25", hearingDate: "2017-10-27", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2017-10-27", hearingDate: "2017-12-15", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2017-12-15", hearingDate: "2017-12-18", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2017-12-18", hearingDate: "2018-01-02", purposeOfListing: "Misc. Arguments" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2018-01-02", hearingDate: "2018-02-08", purposeOfListing: "Prosecution Evidence" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2018-02-08", hearingDate: "2018-02-28", purposeOfListing: "Prosecution Evidence" },
        { judge: "Chief Metropolitan Magistrate", businessOnDate: "2018-02-28", hearingDate: "2018-03-01", purposeOfListing: "Prosecution Evidence" },
        { judge: "Addl. Chief Metropolitan Magistrate", businessOnDate: "2018-03-01", hearingDate: "2018-04-03", purposeOfListing: "Misc. Arguments" },
        { judge: "Addl. Chief Metropolitan Magistrate", businessOnDate: "2018-04-03", hearingDate: "2018-04-07", purposeOfListing: "Misc. Arguments" },
        { judge: "Addl. Chief Metropolitan Magistrate", businessOnDate: "2018-04-07", hearingDate: "2018-05-11", purposeOfListing: "Plaintiff/Petitioner Evidence" },
        { judge: "Addl. Chief Metropolitan Magistrate", businessOnDate: "2018-05-11", hearingDate: "2018-05-19", purposeOfListing: "Plaintiff/Petitioner Evidence" },
        { judge: "Addl. Chief Metropolitan Magistrate", businessOnDate: "2018-05-19", hearingDate: "2018-07-07", purposeOfListing: "Plaintiff/Petitioner Evidence" },
        { judge: "Addl. Chief Metropolitan Magistrate", businessOnDate: "2018-07-07", purposeOfListing: "Disposed" }
      ],
      filedDocuments: [],
      subordinateCourt: {},
      linkCases: [],
      purpose: "Plaintiff/Petitioner Evidence",
      disposalType: "DISMISSED_AS_WITHDRAWN",
      disposalTypeRaw: "DISMISSED AS WITHDRAWN",
      contestedStatus: "UNCONTESTED",
      lastHearingDate: "2018-07-07",
      interimOrders: [
        { orderDate: "2017-10-27", description: "COPY OF ORDER", orderUrl: "order-1.pdf" },
        { orderDate: "2017-12-15", description: "COPY OF ORDER", orderUrl: "order-2.pdf" },
        { orderDate: "2017-12-18", description: "COPY OF ORDER", orderUrl: "order-3.pdf" },
        { orderDate: "2018-01-02", description: "COPY OF ORDER", orderUrl: "order-4.pdf" },
        { orderDate: "2018-02-08", description: "COPY OF ORDER", orderUrl: "order-5.pdf" },
        { orderDate: "2018-02-28", description: "COPY OF ORDER", orderUrl: "order-6.pdf" },
        { orderDate: "2018-03-01", description: "COPY OF JUDICIAL PROCEEDINGS", orderUrl: "order-7.pdf" },
        { orderDate: "2018-04-03", description: "COPY OF ORDER", orderUrl: "order-8.pdf" },
        { orderDate: "2018-05-19", description: "COPY OF JUDICIAL PROCEEDINGS", orderUrl: "order-9.pdf" }
      ],
      processes: [],
      businessOnDateEntries: [
        { date: "2016-01-05", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "--", nextPurpose: "Misc./ Appearance", nextHearingDate: "2016-04-07" },
        { date: "2016-04-07", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "--", nextPurpose: "Misc./ Appearance", nextHearingDate: "2016-05-19" },
        { date: "2016-05-19", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "P F", nextPurpose: "Misc./ Appearance", nextHearingDate: "2016-07-16" },
        { date: "2016-07-16", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "FP", nextPurpose: "Misc./ Appearance", nextHearingDate: "2016-08-16" },
        { date: "2016-08-16", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "CON", nextPurpose: "Misc./ Appearance", nextHearingDate: "2016-10-24" },
        { date: "2016-10-24", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "arg", nextPurpose: "Misc. Arguments", nextHearingDate: "2016-11-26" },
        { date: "2016-11-26", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "arg", nextPurpose: "Misc. Arguments", nextHearingDate: "2016-12-20" },
        { date: "2016-12-20", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "or", nextPurpose: "Misc. Arguments", nextHearingDate: "2017-01-18" },
        { date: "2017-01-18", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "m", nextPurpose: "Misc. Arguments", nextHearingDate: "2017-03-25" },
        { date: "2017-03-25", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "ch", nextPurpose: "Misc. Arguments", nextHearingDate: "2017-05-20" },
        { date: "2017-05-20", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "further proceedings", nextPurpose: "Misc. Arguments", nextHearingDate: "2017-08-05" },
        { date: "2017-08-05", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "heard", nextPurpose: "Misc. Arguments", nextHearingDate: "2017-09-25" },
        { date: "2017-09-25", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "FP", nextPurpose: "Misc. Arguments", nextHearingDate: "2017-10-27" },
        { date: "2017-10-27", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "Heard", nextPurpose: "Misc. Arguments", nextHearingDate: "2017-12-15" },
        { date: "2017-12-15", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "heard", nextPurpose: "Misc. Arguments", nextHearingDate: "2017-12-18" },
        { date: "2017-12-18", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "heard", nextPurpose: "Misc. Arguments", nextHearingDate: "2018-01-02" },
        { date: "2018-01-02", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "heard", nextPurpose: "Prosecution Evidence", nextHearingDate: "2018-02-08" },
        { date: "2018-02-08", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "heard", nextPurpose: "Prosecution Evidence", nextHearingDate: "2018-02-28" },
        { date: "2018-02-28", courtOf: "Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "FP", nextPurpose: "Prosecution Evidence", nextHearingDate: "2018-03-01" },
        { date: "2018-03-01", courtOf: "Addl. Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "CN", nextPurpose: "Misc. Arguments", nextHearingDate: "2018-04-03" },
        { date: "2018-04-03", courtOf: "Addl. Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "accused no. 1,2,3,5,6 withdraw the case. put up on date fixed", nextPurpose: "Misc. Arguments", nextHearingDate: "2018-04-07" },
        { date: "2018-04-07", courtOf: "Addl. Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "CE", nextPurpose: "Plaintiff/Petitioner Evidence", nextHearingDate: "2018-05-11" },
        { date: "2018-05-11", courtOf: "Addl. Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "--\nReason for Adjournment\n:\nJudge on Leave", nextPurpose: "Plaintiff/Petitioner Evidence", nextHearingDate: "2018-05-19" },
        { date: "2018-05-19", courtOf: "Addl. Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "Two applications have been moved on behalf of the sureties Gopal Mohan and Naresh Balyan for release of FDR.\nApplication perused. Considered.", nextPurpose: "Plaintiff/Petitioner Evidence", nextHearingDate: "2018-07-07" },
        { date: "2018-07-07", courtOf: "Addl. Chief Metropolitan Magistrate", petitioner: "MR.ARUN JAITLEY", respondent: "MR. ARVIND KEJRIWAL", business: "DAW\nNature of Disposal\n:\nDISMISSED AS WITHDRAWN\nDisposal Date\n:\n07-07-2018\nAddl. Chief Metropolitan Magistrate" }
      ],
      cnr: "DLND020047882015",
      cnrCourtCode: "DLND02",
      courtComplexCode: "DLND02",
      cnrCaseNumber: "0047882015",
      cnrYear: "2015",
      caseType: "CC",
      caseTypeRaw: "Ct Cases",
      caseStatus: "DISPOSED",
      filingNumber: "27843/2015",
      filingDate: "2015-12-21",
      registrationNumber: "24807/2016",
      registrationDate: "2015-12-21",
      firstHearingDate: "2016-01-05",
      nextHearingDate: "2018-07-07",
      decisionDate: "2018-07-07",
      caseDurationDays: 929,
      filingToFirstHearingDays: 15,
      judges: [],
      petitioners: ["MR.ARUN JAITLEY"],
      petitionerAdvocates: [],
      respondents: ["MR. ARVIND KEJRIWAL"],
      respondentAdvocates: [],
      caseCategoryFacetPath: "Criminal Law/Other Criminal Matters",
      hasOrders: true,
      hasJudgments: true,
      orderCount: 10,
      interimOrderCount: 9,
      judgmentCount: 1,
      hearingCount: 25,
      iaCount: 0,
      taggedMatters: [{ type: "Case Number", caseNumber: "CRLMP/33524/2024" }],
      earlierCourtDetails: [],
      interlocutoryApplications: [],
      listingDates: [],
      notices: [],
      judgmentOrders: [
        { orderDate: "2018-07-07", orderType: "COPY OF ORDER", orderUrl: "order-10.pdf" }
      ],
      caveatDetails: []
    },
    entityInfo: {
      cnr: "DLND020047882015",
      nextDateOfHearing: "2018-07-07T00:00:00Z",
      lastDateOfHearing: "2018-07-07T00:00:00Z",
      dateCreated: "2026-02-18T15:33:18.064345Z",
      dateModified: "2026-05-01T09:38:35.670942Z"
    },
    files: { files: [] },
    descriptions: {
      enumFields: ["caseType", "caseStatus", "courtCode", "judicialSection", "caseCategory", "benchType", "stateCode"],
      enumLookup: {
        caseType: { "CC": "Criminal Complaint Case" },
        caseStatus: { "DISPOSED": "Disposed" },
        courtCode: { "DLND02": "Chief Metropolitan Magistrate, New Delhi, PHC" },
        judicialSection: {},
        caseCategory: {},
        benchType: {},
        stateCode: {}
      }
    },
    caseAiAnalysis: null
  },
  meta: { request_id: "400006a5-0010-d800-b63f-84710c7967bb" }
};

// Deterministic PRNG
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function createPrng(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function next(): number {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pick<T>(arr: T[], rng: () => number): T {
  const index = Math.floor(rng() * arr.length);
  return arr[index];
}

export class FakeEcourtsService {
  /**
   * Generates courtCaseData for any 16-character CNR number adhering to the standard schema.
   */
  static generateCourtCaseData(rawCnr: string): Record<string, any> {
    const cnr = String(rawCnr || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (cnr.length !== 16) {
      throw new Error(`Invalid CNR length (${cnr.length}). A valid eCourts CNR must be exactly 16 characters.`);
    }

    if (cnr === "DLND020047882015") {
      return JSON.parse(JSON.stringify(CANONICAL_DLND020047882015.data.courtCaseData));
    }

    const rng = createPrng(hashString(cnr));

    const stateCode = cnr.slice(0, 2);
    const distCode = cnr.slice(2, 4);
    const courtCodeNum = cnr.slice(4, 6);
    const caseSeqStr = cnr.slice(6, 12);
    const caseSeqNum = parseInt(caseSeqStr, 10) || Math.floor(rng() * 900) + 100;
    const filingYear = cnr.slice(12, 16);

    const stateObj = STATES[stateCode] || {
      name: "State",
      districts: { [distCode]: "District Court" },
    };
    const districtName = stateObj.districts[distCode] || `District ${distCode}`;

    const caseTypeIndex = (parseInt(courtCodeNum, 10) + Math.floor(rng() * CASE_TYPES.length)) % CASE_TYPES.length;
    const caseTypeInfo = CASE_TYPES[caseTypeIndex];
    const caseNumber = `${filingYear}00${String(caseSeqNum).padStart(5, "0")}${filingYear}`;
    const courtName = `${caseTypeInfo.court}, ${districtName}`;

    const judgeTitle = `Hon'ble Judge, ${caseTypeInfo.court}, ${districtName}`;
    const judges = [judgeTitle];
    if (rng() > 0.6) {
      judges.push(`Additional Member, ${caseTypeInfo.court}, ${districtName}`);
    }

    const petitioner = pick(PETITIONERS, rng);
    const resp1 = pick(RESPONDENTS_PRIMARY, rng);
    const respondents = [resp1];
    if (rng() > 0.4) {
      respondents.push(pick(RESPONDENTS_SECONDARY, rng));
    }

    const petAdv = pick(PETITIONER_ADVOCATES, rng);
    const respAdv = pick(RESPONDENT_ADVOCATES, rng);
    const respondentAdvocates = [respAdv];
    if (respondents.length > 1) {
      respondentAdvocates.push(pick(RESPONDENT_ADVOCATES, rng));
    }

    const filingMonth = String(Math.floor(rng() * 4) + 1).padStart(2, "0");
    const filingDay = String(Math.floor(rng() * 20) + 5).padStart(2, "0");
    const filingDate = `${filingYear}-${filingMonth}-${filingDay}`;

    const isDisposed = rng() > 0.75;
    const caseStatus = isDisposed ? "DISPOSED" : "PENDING";

    // Chronological hearings synthesis
    const hearingCount = Math.floor(rng() * 3) + 3;
    const historyOfCaseHearings: FakeEcourtsHearing[] = [];
    const businessOnDateEntries: FakeEcourtsBusinessOnDateEntry[] = [];

    let prevBusinessDate = filingDate;
    let currHearingYear = parseInt(filingYear, 10);
    let currHearingMonth = parseInt(filingMonth, 10);
    let currHearingDay = parseInt(filingDay, 10);

    for (let i = 0; i < hearingCount; i++) {
      currHearingMonth += 2;
      if (currHearingMonth > 12) {
        currHearingMonth -= 12;
        currHearingYear += 1;
      }
      const nextDateStr = `${currHearingYear}-${String(currHearingMonth).padStart(2, "0")}-${String(currHearingDay).padStart(2, "0")}`;
      const purpose = i === 0 ? "Misc./ Appearance" : i === hearingCount - 1 ? (isDisposed ? "Disposed" : "Plaintiff/Petitioner Evidence") : pick(PURPOSES, rng);

      historyOfCaseHearings.push({
        judge: judges[0],
        businessOnDate: prevBusinessDate,
        hearingDate: nextDateStr,
        purposeOfListing: purpose,
      });

      businessOnDateEntries.push({
        date: prevBusinessDate,
        courtOf: judges[0],
        petitioner,
        respondent: respondents[0],
        business: i === hearingCount - 1 && isDisposed
          ? `DAW\nNature of Disposal\n:\nDISMISSED AS WITHDRAWN\nDisposal Date\n:\n${nextDateStr}\n${judges[0]}`
          : "heard",
        nextPurpose: purpose,
        nextHearingDate: nextDateStr,
      });

      prevBusinessDate = nextDateStr;
    }

    const firstHearingDate = historyOfCaseHearings[0]?.hearingDate || filingDate;
    const lastHearingDate = historyOfCaseHearings[historyOfCaseHearings.length - 1]?.hearingDate || filingDate;
    const nextHearingDate = lastHearingDate;
    const decisionDate = isDisposed ? lastHearingDate : nextHearingDate;

    // Interim orders
    const interimOrderCount = Math.floor(rng() * 3) + 1;
    const interimOrders: FakeEcourtsInterimOrder[] = [];
    for (let j = 0; j < interimOrderCount; j++) {
      const hearingMatch = historyOfCaseHearings[j] || historyOfCaseHearings[0];
      interimOrders.push({
        orderUrl: `order-${j + 1}.pdf`,
        orderDate: hearingMatch.hearingDate,
        description: j === 0 ? "COPY OF ORDER" : "COPY OF JUDICIAL PROCEEDINGS",
      });
    }

    const taggedMatters: FakeEcourtsTaggedMatter[] = [
      {
        type: "Case Number",
        caseNumber: `CRLMP/${caseSeqNum + 1000}/${filingYear}`,
      },
    ];

    const judgmentOrders = isDisposed
      ? [
          {
            orderDate: decisionDate,
            orderType: "COPY OF ORDER",
            orderUrl: `order-${interimOrderCount + 1}.pdf`,
          },
        ]
      : [];

    return {
      caseNumber,
      district: districtName,
      state: stateCode,
      stateCode: "26",
      districtCode: distCode,
      courtCode: parseInt(courtCodeNum, 10) || 2,
      caseTypeSub: `${caseTypeInfo.raw}.`,
      courtName,
      courtNo: parseInt(courtCodeNum, 10) || 2,
      firDetails: {
        caseNumber: String((caseSeqNum % 500) + 1),
        policeStation: `${districtName} Central Police Station`,
        year: filingYear,
      },
      historyOfCaseHearings,
      filedDocuments: [],
      subordinateCourt: {},
      linkCases: [],
      purpose: isDisposed ? "Plaintiff/Petitioner Evidence" : pick(PURPOSES, rng),
      disposalType: isDisposed ? "DISMISSED_AS_WITHDRAWN" : "PENDING",
      disposalTypeRaw: isDisposed ? "DISMISSED AS WITHDRAWN" : "PENDING",
      contestedStatus: rng() > 0.2 ? "UNCONTESTED" : "CONTESTED",
      lastHearingDate,
      interimOrders,
      processes: [],
      businessOnDateEntries,
      cnr,
      cnrCourtCode: cnr.slice(0, 6),
      courtComplexCode: cnr.slice(0, 6),
      cnrCaseNumber: cnr.slice(6, 16),
      cnrYear: filingYear,
      caseType: caseTypeInfo.code,
      caseTypeRaw: caseTypeInfo.raw,
      caseStatus,
      filingNumber: `${caseSeqNum}/${filingYear}`,
      filingDate,
      registrationNumber: `${caseSeqNum + 100}/${filingYear}`,
      registrationDate: filingDate,
      firstHearingDate,
      nextHearingDate,
      decisionDate,
      caseDurationDays: 929,
      filingToFirstHearingDays: 15,
      judges,
      petitioners: [petitioner],
      petitionerAdvocates: [petAdv],
      respondents,
      respondentAdvocates,
      caseCategoryFacetPath: caseTypeInfo.category,
      hasOrders: interimOrders.length > 0,
      hasJudgments: isDisposed,
      orderCount: interimOrders.length + judgmentOrders.length,
      interimOrderCount: interimOrders.length,
      judgmentCount: judgmentOrders.length,
      hearingCount: historyOfCaseHearings.length,
      iaCount: 0,
      taggedMatters,
      earlierCourtDetails: [],
      interlocutoryApplications: [],
      listingDates: [],
      notices: [],
      judgmentOrders,
      caveatDetails: [],
    };
  }

  /**
   * Generates the complete, standardized eCourts response strictly adhering to:
   * {
   *   "data": {
   *     "courtCaseData": { ... },
   *     "entityInfo": { ... },
   *     "files": { "files": [] },
   *     "descriptions": { ... },
   *     "caseAiAnalysis": null
   *   },
   *   "meta": { "request_id": "..." }
   * }
   */
  static generateFullResponse(rawCnr: string): FakeEcourtsFullResponse {
    const cnr = String(rawCnr || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (cnr === "DLND020047882015") {
      return JSON.parse(JSON.stringify(CANONICAL_DLND020047882015));
    }

    const courtCaseData = this.generateCourtCaseData(cnr);
    const nextHearingDate = courtCaseData.nextHearingDate;
    const lastHearingDate = courtCaseData.lastHearingDate;

    return {
      data: {
        courtCaseData,
        entityInfo: {
          cnr,
          nextDateOfHearing: nextHearingDate ? `${nextHearingDate}T00:00:00Z` : null,
          lastDateOfHearing: lastHearingDate ? `${lastHearingDate}T00:00:00Z` : null,
          dateCreated: "2026-02-18T15:33:18.064345Z",
          dateModified: new Date().toISOString(),
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
          enumLookup: {
            caseType: { [courtCaseData.caseType]: courtCaseData.caseTypeRaw },
            caseStatus: { [courtCaseData.caseStatus]: courtCaseData.caseStatus === "DISPOSED" ? "Disposed" : "Pending" },
            courtCode: { [courtCaseData.cnrCourtCode || "COURT"]: courtCaseData.courtName },
            judicialSection: {},
            caseCategory: {},
            benchType: {},
            stateCode: {},
          },
        },
        caseAiAnalysis: null,
      },
      meta: {
        request_id: "400006a5-0010-d800-b63f-84710c7967bb",
      },
    };
  }

  /**
   * Backwards compatible docket generator for existing callers.
   * Returns courtCaseData directly with top-level fields.
   */
  static generateDocketByCnr(rawCnr: string): any {
    return this.generateCourtCaseData(rawCnr);
  }
}
