import {
  Mic,
  Sparkles,
  Activity,
  CheckCircle2,
  ShieldCheck,
  Users,
  FileText,
  Gavel,
  Landmark,
  ShoppingBag,
  Briefcase,
} from "lucide-react";

export const HERO_TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Bar verified Lawyers",
    subtitle: "Trusted and verified professionals",
  },
  {
    icon: Users,
    title: "Matched to your case type",
    subtitle: "Right Advocate for your matter",
  },
  {
    icon: FileText,
    title: "Auto-Assign & Subscriptions",
    subtitle: "Fast lawyer assignment & support",
  },
];

export const PRACTICE_CATEGORIES = [
  {
    id: "property",
    title: "Property and Civil Disputes",
    icon: Gavel,
    image: "/property-civil-disputes.png",
    altText:
      "Illustration of a divided house representing property partition, land disputes, and title suits",
    court: "District and Sessions Court",
    act: "Code of Civil Procedure 1908",
    remedy: "Partition, Injunction and Title Suits",
    link: "/citizen-login",
  },
  {
    id: "family",
    title: "Family and Custody Matters",
    icon: Users,
    image: "/family-custody-matters.png",
    altText:
      "Vector illustration of parents and child representing family court divorce and custody legal matters",
    court: "Family Court / District Court",
    act: "Hindu Marriage Act and Guardianship Acts",
    remedy: "Mutual Divorce and Child Custody",
    link: "/citizen-login",
  },
  {
    id: "corporate",
    title: "Corporate and Financial Recovery",
    icon: Briefcase,
    image: "/corporate-financial-recovery.png",
    altText:
      "Illustration of corporate debt recovery, NCLT proceedings, and financial restructuring",
    court: "NCLT and DRT",
    act: "Insolvency and Bankruptcy Code / SARFAESI",
    remedy: "Debt Recovery and Restructuring",
    link: "/citizen-login",
  },
  {
    id: "consumer",
    title: "Consumer Claims and Recovery",
    icon: ShoppingBag,
    image: "/consumer-claims-recovery.png",
    altText:
      "Illustration of consumer protection shield, grievance recovery, and Lok Adalat claims",
    court: "Consumer Commission and Lok Adalat",
    act: "Consumer Protection Act 2019",
    remedy: "Compensation and Speedy Settlement",
    link: "/citizen-login",
  },
];

export const STEPS = [
  {
    step: 1,
    icon: Mic,
    title: "Describe your matter",
    desc: "Tell us what happened by text or voice in the language you are most comfortable with.",
  },
  {
    step: 2,
    icon: Sparkles,
    title: "Get matched",
    desc: "We connect you with a bar verified Lawyer who handles exactly this type of case.",
  },
  {
    step: 3,
    icon: Activity,
    title: "Stay informed",
    desc: "Track every hearing date, document submission, and status change in real time.",
  },
  {
    step: 4,
    icon: CheckCircle2,
    title: "Reach resolution",
    desc: "Your Lawyer takes it from filing to closure and you are informed at every step.",
  },
];

export const ABOUT_HIGHLIGHTS = [
  "Your case description is read and matched to the right legal category",
  "Connected to a bar verified Lawyer near you or assigned by our team",
  "Every hearing date, document, and status is tracked and surfaced to you",
  "No Lawyer appears on the platform without verification by our team",
];

export const INDIAN_COURTS = [
  {
    id: "district",
    title: "District and Sessions Courts",
    subtitle:
      "Primary trial courts handling civil, family, property, and criminal matters at the district level",
    icon: Gavel,
    badge: "Trial Courts",
    matters: [
      "Property partition, land disputes, and title suits",
      "Family matters including divorce, maintenance, and child custody",
      "Cheque bounce cases under Section 138 of Negotiable Instruments Act",
      "Criminal trials, bail applications, and breach of contract suits",
    ],
  },
  {
    id: "highcourt",
    title: "High Courts of India",
    subtitle:
      "State level constitutional courts exercising writ jurisdiction, appeals, and original jurisdiction",
    icon: Landmark,
    badge: "Appellate and Constitutional",
    matters: [
      "Writ petitions under Article 226 for enforcement of fundamental rights",
      "First and second legal appeals against District Court judgments",
      "Anticipatory bail applications and quashing of police complaints",
      "Company disputes and commercial suits of high financial value",
    ],
  },
  {
    id: "consumer",
    title: "Consumer Commissions and Lok Adalat",
    subtitle:
      "Dedicated forums for consumer grievances, service deficiency claims, and mutual settlements",
    icon: ShoppingBag,
    badge: "Consumer and ADR",
    matters: [
      "Defective goods, faulty electronics, and e commerce grievances",
      "Deficiency in services by builders, banks, or insurance companies",
      "Speedy compromise settlements through Lok Adalat with zero court fee",
      "Compensation claims for unfair trade practices and delayed delivery",
    ],
  },
  {
    id: "tribunals",
    title: "Specialised Tribunals NCLT, DRT, and CAT",
    subtitle: "Statutory bodies for corporate law, debt recovery, and public service disputes",
    icon: Briefcase,
    badge: "Specialised Tribunals",
    matters: [
      "Company insolvency and restructuring under Insolvency and Bankruptcy Code",
      "Shareholder oppression, management disputes, and merger approvals",
      "Bank debt recovery under SARFAESI Act and Tribunal proceedings",
      "Government service matters, pensions, and administrative grievances",
    ],
  },
];

export interface LegalTestimonial {
  name: string;
  role: string;
  quote: string;
}

export const CITIZEN_TESTIMONIALS: LegalTestimonial[] = [
  {
    name: "sxxxxxxxxxxxor@gmail.com",
    role: "Verified Client",
    quote:
      "Adv. Rajesh Sharma handled my property partition with great efficiency. Very professional, quick, and thorough—completed the documentation in the shortest time. Highly recommend CloseUrCase for hassle-free legal support!",
  },
  {
    name: "Aayush Aggarwal",
    role: "Verified Client",
    quote:
      "I recently used CloseUrCase for civil litigation and was very impressed with the service provided by Adv. Meenakshi. She was extremely helpful and professional throughout the process. She answered all my questions promptly and clearly, and made sure that our filing was completed quickly and efficiently.",
  },
  {
    name: "PINKEE DAS",
    role: "Verified Client",
    quote:
      "Loved the service of Adv. Nandini from CloseUrCase for timely filing in the Consumer Forum and prompt response at every hearing date.",
  },
  {
    name: "Raj rathnam",
    role: "Verified Client",
    quote:
      "I really appreciate the way your legal counsel assisted me in our High Court matter. Patient, knowledgeable, and goes the extra mile for client satisfaction.",
  },
  {
    name: "Ritesh Kalyan",
    role: "Verified Client",
    quote:
      "I would like to place on record my sincere appreciation for the CloseUrCase team who assisted me in commercial dispute recovery. Truly impressed with their prompt action, dedication, and professional ethics.",
  },
  {
    name: "pvxxxxxxxxxx89@gmail.com",
    role: "Verified Client",
    quote:
      "CloseUrCase paired me with a senior family court advocate within hours. Every hearing date was updated directly on my phone, and our matter was resolved with complete dignity.",
  },
  {
    name: "VB Gamer",
    role: "Verified Client",
    quote:
      "Getting our land revenue records updated had dragged on for years. Through CloseUrCase, we got a verified advocate who resolved the mutation dispute smoothly. Thank you! 🙏",
  },
  {
    name: "Hitesh Vallam",
    role: "Verified Client",
    quote:
      "Had a positive experience with my trademark and contract filings. Adv. Sanjay was extremely helpful throughout the process and addressed all my concerns promptly.",
  },
];
