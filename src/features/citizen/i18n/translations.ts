import type { CitizenLanguage } from "@/features/citizen/session";

export type TranslationKey =
  | "language"
  | "dashboardTitle"
  | "dashboardDesc"
  | "uploadSectionTitle"
  | "uploadSectionDesc"
  | "caseTitle"
  | "caseDescription"
  | "uploadDocuments"
  | "uploadHint"
  | "saveDraft"
  | "voiceSectionTitle"
  | "voiceSectionDesc"
  | "tapToRecord"
  | "recording"
  | "transcriptLabel"
  | "savedRecordings"
  | "myCases"
  | "casesCount"
  | "findLawyer"
  | "navDashboard"
  | "navFindLawyer"
  | "navMyCases"
  | "navMySubscriptions"
  | "navNotifications"
  | "navMyProfile"
  | "newCasePath"
  | "activeCasePath"
  | "closedCasePath"
  | "changeCaseType"
  | "emptyCasesNew"
  | "emptyCasesActive"
  | "emptyCasesClosed"
  | "selectCaseType"
  | "pickCaseTypeDesc"
  | "heroTitle"
  | "heroDesc"
  | "getStarted"
  | "citizenLoginLabel"
  | "citizenLoginSubtitle"
  | "mobileNumber"
  | "continueBtn"
  | "verifyOtpTitle"
  | "verifyOtpDesc"
  | "changeNumber"
  | "verifyContinue"
  | "LawyerAdminSignIn"
  | "lawyerAdminLogin"
  | "chooseFiles";

const en: Record<TranslationKey, string> = {
  language: "Language",
  dashboardTitle: "Home",
  dashboardDesc: "Upload case details and describe your matter by voice.",
  uploadSectionTitle: "Case upload",
  uploadSectionDesc: "Add a title, description, and supporting documents.",
  caseTitle: "Case title",
  caseDescription: "Description",
  uploadDocuments: "Upload documents",
  uploadHint: "PDF, images, or other evidence files",
  saveDraft: "Save & continue to Lawyer matching",
  voiceSectionTitle: "Voice input",
  voiceSectionDesc: "Tap the microphone and speak. Your words appear as text below.",
  tapToRecord: "Tap to start recording",
  recording: "Recording… tap to stop",
  transcriptLabel: "Transcript",
  savedRecordings: "Saved audio clips",
  myCases: "My cases",
  casesCount: "case(s)",
  findLawyer: "Find a Lawyer",
  navDashboard: "Home",
  navFindLawyer: "Find a Lawyer",
  navMyCases: "My Cases",
  navMySubscriptions: "My Subscriptions",
  navNotifications: "Notifications",
  navMyProfile: "My Profile",
  newCasePath: "New Case",
  activeCasePath: "Existing / Pending / In Progress",
  closedCasePath: "Closed Case",
  changeCaseType: "Change case type",
  emptyCasesNew: "Start with the upload form below, or use Find a Lawyer for the full wizard.",
  emptyCasesActive: "No pending or in-progress cases yet.",
  emptyCasesClosed: "No closed cases yet.",
  selectCaseType: "What do you need today?",
  pickCaseTypeDesc: "Pick one option before using the microphone or upload form.",
  heroTitle: "Structured Resolution for Every Legal Matter",
  heroDesc:
    "CloseUrCase helps citizens file cases, match with Lawyers, and track progress in English, Hindi, or Telugu.",
  getStarted: "Get Started Now",
  citizenLoginLabel: "Find a Lawyer",
  citizenLoginSubtitle: "Mobile number only · No password",
  mobileNumber: "Mobile number",
  continueBtn: "Continue",
  verifyOtpTitle: "Verify OTP",
  verifyOtpDesc: "Enter the 4-digit code sent to your phone.",
  changeNumber: "Change number",
  verifyContinue: "Verify & continue",
  LawyerAdminSignIn: "Lawyer or admin? Email sign in",
  lawyerAdminLogin: "Lawyer sign in",
  chooseFiles: "Choose files",
};

const hi: Record<TranslationKey, string> = {
  language: "भाषा",
  dashboardTitle: "होम",
  dashboardDesc: "केस विवरण अपलोड करें और आवाज़ से अपनी बात बताएं।",
  uploadSectionTitle: "केस अपलोड",
  uploadSectionDesc: "शीर्षक, विवरण और दस्तावेज़ जोड़ें।",
  caseTitle: "केस शीर्षक",
  caseDescription: "विवरण",
  uploadDocuments: "दस्तावेज़ अपलोड करें",
  uploadHint: "PDF, छवियाँ या अन्य साक्ष्य",
  saveDraft: "सहेजें और वकील मिलान पर जाएँ",
  voiceSectionTitle: "वॉइस इनपुट",
  voiceSectionDesc: "माइक पर टैप करके बोलें। नीचे टेक्स्ट दिखेगा।",
  tapToRecord: "रिकॉर्ड शुरू करने के लिए टैप करें",
  recording: "रिकॉर्ड हो रहा है… रोकने के लिए टैप करें",
  transcriptLabel: "प्रतिलेख",
  savedRecordings: "सहेजे गए ऑडियो",
  myCases: "मेरे केस",
  casesCount: "केस",
  findLawyer: "वकील खोजें",
  navDashboard: "होम",
  navFindLawyer: "वकील खोजें",
  navMyCases: "मेरे केस",
  navMySubscriptions: "मेरी सदस्यता",
  navNotifications: "सूचनाएं",
  navMyProfile: "मेरी प्रोफ़ाइल",
  newCasePath: "नया केस",
  activeCasePath: "मौजूदा / लंबित / प्रगति में",
  closedCasePath: "बंद केस",
  changeCaseType: "केस प्रकार बदलें",
  emptyCasesNew: "नीचे फॉर्म भरें, या पूर्ण विज़ार्ड के लिए वकील खोजें पर जाएँ।",
  emptyCasesActive: "अभी कोई लंबित या चल रहे केस नहीं हैं।",
  emptyCasesClosed: "अभी कोई बंद केस नहीं हैं।",
  selectCaseType: "आज आपको क्या चाहिए?",
  pickCaseTypeDesc: "माइक या अपलोड से पहले एक विकल्प चुनें।",
  heroTitle: "हर कानूनी मामले के लिए सुव्यवस्थित समाधान",
  heroDesc:
    "CloseUrCase नागरिकों को केस दाखिल करने, वकील से जुड़ने और प्रगति ट्रैक करने में मदद करता है — हिंदी, English या తెలుగు में।",
  getStarted: "अभी शुरू करें",
  citizenLoginLabel: "नागरिक लॉगिन",
  citizenLoginSubtitle: "केवल मोबाइल नंबर · पासवर्ड नहीं",
  mobileNumber: "मोबाइल नंबर",
  continueBtn: "आगे बढ़ें",
  verifyOtpTitle: "OTP सत्यापित करें",
  verifyOtpDesc: "अपने फ़ोन पर भेजा गया 4 अंकों का कोड दर्ज करें।",
  changeNumber: "नंबर बदलें",
  verifyContinue: "सत्यापित करें",
  LawyerAdminSignIn: "वकील या एडमिन? ईमेल से साइन इन",
  lawyerAdminLogin: "वकील और एडमिन साइन इन",
  chooseFiles: "फ़ाइलें चुनें",
};

const te: Record<TranslationKey, string> = {
  language: "భాష",
  dashboardTitle: "హోమ్",
  dashboardDesc: "కేసు వివరాలు అప్‌లోడ్ చేసి, మాట్లాడి మీ విషయం చెప్పండి.",
  uploadSectionTitle: "కేసు అప్‌లోడ్",
  uploadSectionDesc: "శీర్షిక, వివరణ మరియు పత్రాలు జోడించండి.",
  caseTitle: "కేసు శీర్షిక",
  caseDescription: "వివరణ",
  uploadDocuments: "పత్రాలు అప్‌లోడ్",
  uploadHint: "PDF, చిత్రాలు లేదా ఇతర సాక్ష్యం",
  saveDraft: "సేవ్ చేసి న్యాయవాది మ్యాచింగ్‌కు వెళ్లండి",
  voiceSectionTitle: "వాయిస్ ఇన్‌పుట్",
  voiceSectionDesc: "మైక్‌ను ట్యాప్ చేసి మాట్లాడండి. కింద టెక్స్ట్ కనిపిస్తుంది.",
  tapToRecord: "రికార్డ్ చేయడానికి ట్యాప్ చేయండి",
  recording: "రికార్డ్ అవుతోంది… ఆపడానికి ట్యాప్",
  transcriptLabel: "ట్రాన్స్‌క్రిప్ట్",
  savedRecordings: "సేవ్ చేసిన ఆడియో",
  myCases: "నా కేసులు",
  casesCount: "కేసు(లు)",
  findLawyer: "న్యాయవాదిని కనుగొనండి",
  navDashboard: "హోమ్",
  navFindLawyer: "న్యాయవాదిని కనుగొనండి",
  navMyCases: "నా కేసులు",
  navMySubscriptions: "నా చందాలు",
  navNotifications: "నోటిఫికేషన్లు",
  navMyProfile: "నా ప్రొఫైల్",
  newCasePath: "కొత్త కేసు",
  activeCasePath: "ఇప్పటికే ఉన్న / పెండింగ్ / ప్రగతిలో",
  closedCasePath: "మూసివేసిన కేసు",
  changeCaseType: "కేసు రకం మార్చండి",
  emptyCasesNew: "కింద ఫారమ్ నింపండి, లేదా పూర్తి విజార్డ్ కోసం న్యాయవాదిని కనుగొనండి.",
  emptyCasesActive: "పెండింగ్ లేదా ప్రగతిలో కేసులు లేవు.",
  emptyCasesClosed: "మూసివేసిన కేసులు లేవు.",
  selectCaseType: "ఈరోజు మీకు ఏమి కావాలి?",
  pickCaseTypeDesc: "మైక్ లేదా అప్‌లోడ్ కు ముందు ఒక ఎంపిక ఎంచుకోండి.",
  heroTitle: "ప్రతి న్యాయ విషయానికి నిర్మాణాత్మక పరిష్కారం",
  heroDesc:
    "CloseUrCase పౌరులకు కేసులు దాఖలు, న్యాయవాదుల మ్యాచ్, ట్రాకింగ్ — English, हिन्दी, తెలుగు లో.",
  getStarted: "ఇప్పుడే ప్రారంభించండి",
  citizenLoginLabel: "పౌర లాగిన్",
  citizenLoginSubtitle: "మొబైల్ నంబర్ మాత్రమే · పాస్‌వర్డ్ లేదు",
  mobileNumber: "మొబైల్ నంబర్",
  continueBtn: "కొనసాగించండి",
  verifyOtpTitle: "OTP ధృవీకరించండి",
  verifyOtpDesc: "మీ ఫోన్‌కు పంపిన 4 అంకెల కోడ్‌ను నమోదు చేయండి.",
  changeNumber: "నంబర్ మార్చండి",
  verifyContinue: "ధృవీకరించండి",
  LawyerAdminSignIn: "న్యాయవాది/అడ్మిన్? ఇమెయిల్ సైన్ ఇన్",
  lawyerAdminLogin: "న్యాయవాది & అడ్మిన్ సైన్ ఇన్",
  chooseFiles: "ఫైళ్లు ఎంచుకోండి",
};

export const translations: Record<CitizenLanguage, Record<TranslationKey, string>> = {
  en,
  hi,
  te,
};

export function t(lang: CitizenLanguage, key: TranslationKey): string {
  return translations[lang][key] ?? translations.en[key];
}
