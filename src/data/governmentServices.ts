export interface GovernmentServiceCategory {
  title: string;
  links: { label: string; url: string }[];
}

/** Directory of official Government of India portals, grouped by category —
 * shown in the public header's "Government Services" mega-menu. All external
 * links, opened in a new tab. */
export const GOVERNMENT_SERVICES: GovernmentServiceCategory[] = [
  {
    title: "National & Citizen Services",
    links: [
      { label: "National Portal of India", url: "https://www.india.gov.in/" },
      { label: "MyGov India", url: "https://www.mygov.in/" },
      { label: "DigiLocker", url: "https://www.digilocker.gov.in/" },
      { label: "UMANG", url: "https://web.umang.gov.in/" },
    ],
  },
  {
    title: "Identity & Documents",
    links: [
      { label: "UIDAI (Aadhaar)", url: "https://uidai.gov.in/" },
      { label: "Income Tax Department", url: "https://www.incometax.gov.in/" },
      { label: "PAN Services", url: "https://www.incometax.gov.in/" },
      { label: "Passport Seva", url: "https://www.passportindia.gov.in/" },
      { label: "National Population Register", url: "https://www.censusindia.gov.in/" },
    ],
  },
  {
    title: "Legal & Judiciary",
    links: [
      { label: "Supreme Court of India", url: "https://www.sci.gov.in/" },
      { label: "eCourts Services", url: "https://services.ecourts.gov.in/" },
      { label: "Department of Legal Affairs", url: "https://legalaffairs.gov.in/" },
      { label: "National Legal Services Authority (NALSA)", url: "https://nalsa.gov.in/" },
      { label: "India Code", url: "https://www.indiacode.nic.in/" },
      { label: "Legislative Department", url: "https://legislative.gov.in/" },
    ],
  },
  {
    title: "Police & Law Enforcement",
    links: [
      { label: "National Cyber Crime Reporting Portal", url: "https://www.cybercrime.gov.in/" },
      { label: "Ministry of Home Affairs", url: "https://www.mha.gov.in/" },
      { label: "National Investigation Agency (NIA)", url: "https://www.nia.gov.in/" },
      { label: "Central Bureau of Investigation (CBI)", url: "https://cbi.gov.in/" },
      { label: "Bureau of Police Research and Development", url: "https://bprd.nic.in/" },
    ],
  },
  {
    title: "Tax & Finance",
    links: [
      { label: "Income Tax Department", url: "https://www.incometax.gov.in/" },
      { label: "Goods and Services Tax (GST)", url: "https://www.gst.gov.in/" },
      { label: "Central Board of Direct Taxes (CBDT)", url: "https://www.incometaxindia.gov.in/" },
      {
        label: "Central Board of Indirect Taxes and Customs (CBIC)",
        url: "https://www.cbic.gov.in/",
      },
      { label: "Reserve Bank of India (RBI)", url: "https://www.rbi.org.in/" },
      { label: "SEBI", url: "https://www.sebi.gov.in/" },
    ],
  },
  {
    title: "Business & Corporate",
    links: [
      { label: "Ministry of Corporate Affairs (MCA)", url: "https://www.mca.gov.in/" },
      { label: "Startup India", url: "https://www.startupindia.gov.in/" },
      { label: "Udyam Registration", url: "https://udyamregistration.gov.in/" },
      { label: "GeM (Government e Marketplace)", url: "https://gem.gov.in/" },
      { label: "Invest India", url: "https://www.investindia.gov.in/" },
      { label: "Competition Commission of India (CCI)", url: "https://www.cci.gov.in/" },
    ],
  },
  {
    title: "Transport",
    links: [
      { label: "Parivahan Sewa", url: "https://parivahan.gov.in/" },
      { label: "Vahan", url: "https://vahan.parivahan.gov.in/" },
      { label: "Sarathi", url: "https://sarathi.parivahan.gov.in/" },
      { label: "Ministry of Road Transport and Highways", url: "https://morth.nic.in/" },
    ],
  },
  {
    title: "Elections",
    links: [
      { label: "Election Commission of India", url: "https://www.eci.gov.in/" },
      { label: "National Voters' Service Portal", url: "https://voters.eci.gov.in/" },
      { label: "Chief Electoral Officer Portal", url: "https://eci.gov.in/" },
    ],
  },
  {
    title: "Education",
    links: [
      { label: "Ministry of Education", url: "https://www.education.gov.in/" },
      { label: "National Scholarship Portal", url: "https://scholarships.gov.in/" },
      { label: "UGC", url: "https://www.ugc.gov.in/" },
      { label: "AICTE", url: "https://www.aicte-india.org/" },
      { label: "CBSE", url: "https://www.cbse.gov.in/" },
    ],
  },
  {
    title: "Health",
    links: [
      { label: "Ministry of Health and Family Welfare", url: "https://www.mohfw.gov.in/" },
      { label: "Ayushman Bharat", url: "https://www.pmjay.gov.in/" },
      { label: "National Health Authority", url: "https://nha.gov.in/" },
      { label: "National Health Portal", url: "https://www.nhp.gov.in/" },
    ],
  },
  {
    title: "Employment & Social Security",
    links: [
      { label: "EPFO", url: "https://www.epfindia.gov.in/" },
      { label: "ESIC", url: "https://www.esic.gov.in/" },
      { label: "Ministry of Labour and Employment", url: "https://labour.gov.in/" },
      { label: "National Career Service", url: "https://www.ncs.gov.in/" },
      { label: "Skill India", url: "https://www.skillindia.gov.in/" },
    ],
  },
  {
    title: "Agriculture",
    links: [
      { label: "Ministry of Agriculture & Farmers Welfare", url: "https://agriwelfare.gov.in/" },
      { label: "PM-KISAN", url: "https://pmkisan.gov.in/" },
      { label: "e-NAM", url: "https://www.enam.gov.in/" },
      { label: "Pradhan Mantri Fasal Bima Yojana", url: "https://pmfby.gov.in/" },
    ],
  },
  {
    title: "Land & Property",
    links: [
      { label: "Department of Land Resources", url: "https://dolr.gov.in/" },
      {
        label: "Digital India Land Records Modernization Programme",
        url: "https://dolr.gov.in/",
      },
      { label: "Registration Department", url: "https://igrsup.gov.in/" },
    ],
  },
  {
    title: "Consumer Services",
    links: [
      { label: "National Consumer Helpline", url: "https://consumerhelpline.gov.in/" },
      { label: "Department of Consumer Affairs", url: "https://consumeraffairs.nic.in/" },
      {
        label: "Food Safety and Standards Authority of India",
        url: "https://www.fssai.gov.in/",
      },
    ],
  },
  {
    title: "Information & Transparency",
    links: [
      { label: "RTI Online", url: "https://rtionline.gov.in/" },
      { label: "Central Information Commission", url: "https://cic.gov.in/" },
      { label: "Press Information Bureau", url: "https://pib.gov.in/" },
      { label: "India Code", url: "https://www.indiacode.nic.in/" },
    ],
  },
  {
    title: "Government Procurement",
    links: [
      { label: "Government e Marketplace (GeM)", url: "https://gem.gov.in/" },
      { label: "Central Public Procurement Portal", url: "https://eprocure.gov.in/" },
      { label: "Government eProcurement System", url: "https://etenders.gov.in/" },
    ],
  },
  {
    title: "Regulatory Bodies",
    links: [
      { label: "TRAI", url: "https://www.trai.gov.in/" },
      { label: "IRDAI", url: "https://irdai.gov.in/" },
      { label: "PFRDA", url: "https://www.pfrda.org.in/" },
      { label: "NCLT", url: "https://nclt.gov.in/" },
      { label: "NCLAT", url: "https://nclat.nic.in/" },
      { label: "National Human Rights Commission", url: "https://nhrc.nic.in/" },
    ],
  },
];
