export interface CategoryDetail {
  description: string;
  commonMatters: string[];
}

/* Demo copy shown when a citizen picks a category in the Find a Lawyer
   wizard — keyed by the category `id` from case_categories.json. */
export const CATEGORY_DETAILS: Record<string, CategoryDetail> = {
  criminal: {
    description:
      "Matters involving offences under the Bharatiya Nyaya Sanhita and other penal statutes, from FIR to trial.",
    commonMatters: [
      "FIR & bail",
      "Assault & theft",
      "Cybercrime-linked offences",
      "Anticipatory bail",
    ],
  },
  civil: {
    description:
      "Disputes between individuals or entities over rights, obligations, and damages outside criminal law.",
    commonMatters: ["Recovery of money", "Breach of contract", "Injunctions", "Declaratory suits"],
  },
  family: {
    description:
      "Matrimonial, custody, and inheritance matters handled with sensitivity and confidentiality.",
    commonMatters: ["Divorce & separation", "Child custody", "Maintenance", "Succession & wills"],
  },
  property: {
    description:
      "Land, tenancy, and real-estate disputes including title, possession, and boundary issues.",
    commonMatters: [
      "Boundary disputes",
      "Title verification",
      "Tenant eviction",
      "Registration issues",
    ],
  },
  consumer: {
    description:
      "Protection against defective goods, deficient services, and unfair trade practices.",
    commonMatters: [
      "Defective products",
      "Service deficiency",
      "Refund disputes",
      "E-commerce complaints",
    ],
  },
  corporate: {
    description:
      "Business formation, contracts, mergers, and commercial disputes for companies of all sizes.",
    commonMatters: [
      "Company incorporation",
      "Contract drafting",
      "Shareholder disputes",
      "Compliance",
    ],
  },
  labour: {
    description: "Workplace rights covering wages, termination, and working conditions.",
    commonMatters: [
      "Wrongful termination",
      "Salary disputes",
      "Workplace harassment",
      "PF & gratuity",
    ],
  },
  cyber: {
    description: "Online fraud, data breaches, and IT Act offences in the digital space.",
    commonMatters: ["UPI / phishing fraud", "Identity theft", "Data breaches", "Online harassment"],
  },
  tax: {
    description: "Income tax, GST, and other statutory tax matters and assessments.",
    commonMatters: ["Income tax notices", "GST disputes", "Tax appeals", "Assessment reviews"],
  },
  constitutional: {
    description: "Fundamental rights, writ petitions, and matters before constitutional courts.",
    commonMatters: ["Writ petitions", "PILs", "Fundamental rights", "Government orders"],
  },
  service: {
    description:
      "Disputes involving government employees over service conditions and disciplinary action.",
    commonMatters: [
      "Disciplinary proceedings",
      "Promotion disputes",
      "Pension matters",
      "Departmental inquiries",
    ],
  },
  banking: {
    description: "Loan recovery, banking fraud, and financial regulatory matters.",
    commonMatters: ["Loan defaults", "Banking fraud", "Cheque bounce", "NPA & recovery"],
  },
  insurance: {
    description: "Claim rejections, policy disputes, and insurer negotiations.",
    commonMatters: [
      "Claim denial",
      "Policy disputes",
      "Health insurance",
      "Motor insurance claims",
    ],
  },
  ipr: {
    description: "Trademarks, copyrights, patents, and protection of creative and business assets.",
    commonMatters: [
      "Trademark registration",
      "Copyright infringement",
      "Patent filing",
      "IP litigation",
    ],
  },
  environment: {
    description: "Pollution, land use, and regulatory compliance under environmental law.",
    commonMatters: [
      "Pollution complaints",
      "Environmental clearances",
      "Land-use violations",
      "NGT matters",
    ],
  },
  motor_accident: {
    description: "Compensation claims arising from road accidents and vehicle-related injuries.",
    commonMatters: [
      "Accident compensation",
      "MACT claims",
      "Third-party insurance",
      "Hit-and-run cases",
    ],
  },
  arbitration: {
    description: "Alternative dispute resolution through arbitration, mediation, and conciliation.",
    commonMatters: ["Arbitration clauses", "Mediation", "Conciliation", "Award enforcement"],
  },
  other: {
    description:
      "Doesn't fit a standard category? Describe your issue and we'll match you with the right Lawyer.",
    commonMatters: [],
  },
};
