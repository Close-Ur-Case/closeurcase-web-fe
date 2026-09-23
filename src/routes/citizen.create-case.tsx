import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FileSearch,
  FilePlus2,
  Image as ImageIcon,
  Paperclip,
  Mic,
  Square,
  X,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  ShieldCheck,
  Sparkles,
  Users,
  Scale,
  ArrowLeft,
  ChevronDown,
  Check,
  Download,
  MapPin,
  FileText,
  Lock,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { UserAvatar } from "@/components/app/UserAvatar";
import { LawyerProfileCard } from "@/components/app/LawyerProfileCard";
import { usePwaInstall } from "@/lib/usePwaInstall";
import {
  LAWYER_PRACTICE_AREAS,
  getLawyerPracticeAreas,
  type LawyerPracticeArea,
  mapPracticeAreaToCategory,
} from "@/components/app/lawyerPracticeAreas";
import {
  addCase,
  addSubscription,
  getLawyers,
  generateCloseUrCaseId,
  subscribeToStore,
  mergeRemotePayments,
} from "@/data/appStore";
import { caseService } from "@/services/caseService";
import { storageService } from "@/services/storageService";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import { useAuth } from "@/context/useAuth";
import { SUBSCRIPTION_PLANS } from "@/data/subscriptionPlans";
import { useSpeechToText } from "@/features/citizen/useSpeechToText";
import { distanceToCity } from "@/lib/geo";
import { useUserLocation } from "@/lib/useUserLocation";
import { MAX_ATTACHMENT_BYTES, readFileAsDataUrl } from "@/lib/files";
import { sanitizeName, sanitizeCNR } from "@/lib/validations";
import type {
  CaseDocument,
  CaseStatus,
  LegalCase,
  LegalCategory,
  Lawyer,
  SubscriptionPlanId,
  Payment,
} from "@/types";
import {
  Button,
  TextField,
  Card,
  CircularProgress,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  IconButton,
  Select,
} from "@/components/m3";

interface CreateCaseSearchParams {
  area?: string;
  specialization?: string;
  service?: string;
}

export const Route = createFileRoute("/citizen/create-case")({
  head: () => ({ meta: [{ title: "Find a Lawyer — CloseUrCase" }] }),
  validateSearch: (s: Record<string, unknown>): CreateCaseSearchParams => ({
    area: typeof s.area === "string" ? s.area : undefined,
    specialization: typeof s.specialization === "string" ? s.specialization : undefined,
    service: typeof s.service === "string" ? s.service : undefined,
  }),
  component: FindLawyerWizard,
});

type CasePath = "existing" | "new";
type Step = "details" | "assign" | "payment" | "done";
type AssignMode = "browse" | "admin" | null;

const FEE = 499;
const CITIZEN_ID = "u_001";
const CITIZEN_NAME = "Sai Teja Reddy";
const CITIZEN_CITY = "Hyderabad";

/* Keyword heuristic for initial category suggestion */
function predictCategory(text: string): LegalCategory {
  const t = text.toLowerCase();
  if (t.includes("upi") || t.includes("hack") || t.includes("cyber")) return "Cyber";
  if (t.includes("land") || t.includes("plot") || t.includes("property") || t.includes("boundary"))
    return "Property";
  if (t.includes("divorce") || t.includes("custody") || t.includes("spouse")) return "Family";
  if (t.includes("refund") || t.includes("defective")) return "Consumer";
  if (t.includes("fired") || t.includes("salary") || t.includes("termination")) return "Labour";
  if (t.includes("police") || t.includes("fir") || t.includes("assault")) return "Criminal";
  return "Civil";
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FindLawyerWizard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentCitizenId = user?.citizenId || user?.id || CITIZEN_ID;
  const currentCitizenName = user?.name || CITIZEN_NAME;
  const searchParams = Route.useSearch();
  const initialAreaParam = searchParams.area;
  const initialSpecParam = searchParams.specialization;
  const initialServiceParam = searchParams.service;

  const matchedAreaObj = useMemo(() => {
    if (initialAreaParam) {
      return LAWYER_PRACTICE_AREAS.find(
        (pa) => pa.category.toLowerCase() === initialAreaParam.toLowerCase(),
      );
    }
    if (initialSpecParam) {
      return LAWYER_PRACTICE_AREAS.find((pa) =>
        pa.case_types.some((ct) => ct.case_type.toLowerCase() === initialSpecParam.toLowerCase()),
      );
    }
    return undefined;
  }, [initialAreaParam, initialSpecParam]);

  const defaultArea = matchedAreaObj?.category ?? initialAreaParam ?? "";

  const matchedSpecObj = useMemo(() => {
    if (!matchedAreaObj) return undefined;
    if (initialSpecParam) {
      return matchedAreaObj.case_types.find(
        (ct) => ct.case_type.toLowerCase() === initialSpecParam.toLowerCase(),
      );
    }
    return undefined;
  }, [matchedAreaObj, initialSpecParam]);

  const defaultSpec = matchedSpecObj?.case_type ?? initialSpecParam ?? "";

  const defaultServices = useMemo(() => {
    if (initialServiceParam) {
      return [initialServiceParam];
    }
    if (matchedSpecObj) {
      return matchedSpecObj.legal_services;
    }
    return [];
  }, [initialServiceParam, matchedSpecObj]);

  const hasParams = !!(initialAreaParam || initialSpecParam || initialServiceParam);

  const { coords: userCoords, cityLabel: userCityLabel, loading: locating } = useUserLocation();
  const [step, setStep] = useState<Step>("details");
  const [path, setPath] = useState<CasePath | null>(hasParams ? "new" : null);

  // Petitioner & Respondent Names — required for every submission
  const [clientName, setClientName] = useState("");
  const [clientNameTouched, setClientNameTouched] = useState(false);
  const [respondentName, setRespondentName] = useState("");
  const [respondentNameTouched, setRespondentNameTouched] = useState(false);

  // Existing case
  const [cnr, setCnr] = useState("");
  const [existingCaseStatus, setExistingCaseStatus] = useState<"Pending" | "Closed">("Pending");

  // New case
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  // Whether the citizen knows their case's legal category already — if so,
  // skip the automatic classification and let them pick it directly via the
  // same Practice Area -> Specialization -> Legal Service cascade used to
  // browse the lawyer directory, instead of a flat category dropdown.
  const [knowsCaseType, setKnowsCaseType] = useState<boolean | null>(hasParams ? true : null);
  const [selectedPracticeArea, setSelectedPracticeArea] = useState(defaultArea);
  const [selectedSpecialization, setSelectedSpecialization] = useState(defaultSpec);
  // Legal Service is multi-select — defaults to "all services under the
  // chosen specialization" the moment a specialization is picked.
  const [selectedLegalServices, setSelectedLegalServices] = useState<string[]>(defaultServices);

  useEffect(() => {
    if (hasParams) {
      setPath("new");
      setKnowsCaseType(true);
      if (defaultArea) setSelectedPracticeArea(defaultArea);
      if (defaultSpec) setSelectedSpecialization(defaultSpec);
      if (defaultServices.length > 0) setSelectedLegalServices(defaultServices);
    }
  }, [hasParams, defaultArea, defaultSpec, defaultServices]);
  const baseDescriptionRef = useRef("");
  const {
    isRecording,
    error: voiceError,
    start: startVoiceRecognition,
    stop: stopVoiceRecognition,
  } = useSpeechToText((finalText, interimText) => {
    const combined = [baseDescriptionRef.current, finalText, interimText]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
    setDescription(combined);
  });

  // AI category analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiAnalyzed, setIsAiAnalyzed] = useState(false);
  const [isInlineAnalyzing, setIsInlineAnalyzing] = useState(false);
  const [predictedCategory, setPredictedCategory] = useState<LegalCategory | null>(null);

  // Assign lawyer
  const [assignMode, setAssignMode] = useState<AssignMode>(null);
  const [selectedLawyerId, setSelectedLawyerId] = useState("");
  const [profileLawyer, setProfileLawyer] = useState<Lawyer | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlanId | null>(null);

  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const { startCheckout } = useRazorpayCheckout();
  const [createdCaseId, setCreatedCaseId] = useState("");
  const [assignedLawyerName, setAssignedLawyerName] = useState("");
  const [adminAssignRequested, setAdminAssignRequested] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const hasNewCaseContent =
    description.trim().length > 0 || images.length > 0 || documents.length > 0;
  const hasDescriptionText = description.trim().length > 0;
  const hasClientName = clientName.trim().length > 0;
  const hasRespondentName = respondentName.trim().length > 0;
  const hasManualCategoryPick = selectedPracticeArea !== "" && selectedSpecialization !== "";

  const canContinueDetails =
    hasClientName &&
    hasRespondentName &&
    (path === "existing"
      ? cnr.trim().length > 0
      : path === "new"
        ? hasNewCaseContent &&
          knowsCaseType !== null &&
          (knowsCaseType === true
            ? hasManualCategoryPick
            : hasDescriptionText && (isAiAnalyzed || predictedCategory !== null))
        : false);

  // Tells the citizen exactly what's missing when Continue is disabled,
  // instead of leaving them to guess (the required fields aren't all
  // visible at once once the form scrolls).
  const missingDetailsReason = (() => {
    if (!hasClientName) return "Enter the petitioner's name to continue.";
    if (!hasRespondentName) return "Enter the respondent's name to continue.";
    if (path === null) return "Choose Existing Case or New Case to continue.";
    if (path === "existing" && cnr.trim().length === 0) return "Enter your CNR number to continue.";
    if (path === "new") {
      if (!hasNewCaseContent) {
        return "Describe your issue, or add a photo/document, to continue.";
      }
      if (knowsCaseType === null) {
        return "Let us know whether you know the legal category to continue.";
      }
      if (knowsCaseType === true && selectedPracticeArea === "") {
        return "Select a Practice Area to continue.";
      }
      if (knowsCaseType === true && selectedSpecialization === "") {
        return "Select a Specialization to continue.";
      }
      if (knowsCaseType === false && !hasDescriptionText) {
        return "Describe your issue in a few words so we can identify the legal category.";
      }
      if (knowsCaseType === false && !isAiAnalyzed && !predictedCategory) {
        return "Click 'Analyze Case' to identify the legal category before continuing.";
      }
    }
    return null;
  })();

  const canContinueAssign =
    (assignMode === "admin" && subscriptionPlan !== null) ||
    (assignMode === "browse" && selectedLawyerId !== "");

  const [practiceAreaTree, setPracticeAreaTree] =
    useState<LawyerPracticeArea[]>(getLawyerPracticeAreas);

  useEffect(() => {
    return subscribeToStore(() => {
      setPracticeAreaTree(getLawyerPracticeAreas());
    });
  }, []);

  const currentPracticeAreaObj = useMemo(
    () => practiceAreaTree.find((pa) => pa.category === selectedPracticeArea),
    [selectedPracticeArea, practiceAreaTree],
  );
  const availableSpecializations = useMemo(
    () => currentPracticeAreaObj?.case_types ?? [],
    [currentPracticeAreaObj],
  );

  const currentSpecializationObj = useMemo(
    () => availableSpecializations.find((s) => s.case_type === selectedSpecialization),
    [availableSpecializations, selectedSpecialization],
  );
  const availableLegalServices = currentSpecializationObj?.legal_services ?? [];

  function handlePracticeAreaChange(v: string) {
    setSelectedPracticeArea(v);
    setSelectedSpecialization("");
    setSelectedLegalServices([]);
    setSelectedLegalServices([]);
  }

  function handleSpecializationChange(v: string) {
    setSelectedSpecialization(v);
    const spec = availableSpecializations.find((s) => s.case_type === v);
    // All legal services under the new specialization are selected by default.
    setSelectedLegalServices(spec?.legal_services ?? []);
  }

  function toggleLegalService(service: string) {
    setSelectedLegalServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service],
    );
  }

  const approvedLawyers = useMemo(
    () => getLawyers().filter((l) => l.status === "Approved" && l.availabilityStatus !== "Offline"),
    [],
  );

  const sortedLawyers = useMemo(() => {
    // Unrecognized city names (free-text on lawyer self-registration) sort last
    // rather than being guessed at.
    const distance = (city: string) =>
      distanceToCity(userCoords.lat, userCoords.lng, city) ?? Number.MAX_SAFE_INTEGER;

    const categorySource = selectedSpecialization || selectedPracticeArea;
    const mappedCategory = categorySource ? mapPracticeAreaToCategory(categorySource) : null;
    const activeCategory = mappedCategory || predictedCategory;

    return approvedLawyers
      .filter((l) => !activeCategory || l.category === activeCategory)
      .filter((l) => !selectedSpecialization || l.specializations?.includes(selectedSpecialization))
      .sort((a, b) => {
        const da = distance(a.city);
        const db = distance(b.city);
        if (da !== db) return da - db;
        return b.rating - a.rating;
      });
  }, [
    approvedLawyers,
    predictedCategory,
    userCoords,
    selectedPracticeArea,
    selectedSpecialization,
  ]);

  const selectedLawyer: Lawyer | undefined = sortedLawyers.find((l) => l.id === selectedLawyerId);
  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === subscriptionPlan);
  const totalFee =
    assignMode === "admin" && selectedPlan
      ? selectedPlan.price
      : assignMode === "browse" && selectedLawyer
        ? (selectedLawyer.consultationFee ?? FEE)
        : FEE;

  function handleRecordVoiceNote() {
    if (isRecording) {
      stopVoiceRecognition();
      return;
    }
    baseDescriptionRef.current = description.trim();
    startVoiceRecognition();
  }

  function handleContinueFromDetails() {
    // The citizen already told us the category via the Practice Area picker —
    // use it directly, no fake AI classification needed.
    if (path === "new" && knowsCaseType === true && hasManualCategoryPick) {
      setPredictedCategory(mapPracticeAreaToCategory(selectedPracticeArea));
      setStep("assign");
      return;
    }

    // The citizen already told us the category via the Practice Area picker —
    // use it directly, no fake AI classification needed.
    if (path === "new" && knowsCaseType === true && hasManualCategoryPick) {
      setPredictedCategory(mapPracticeAreaToCategory(selectedPracticeArea));
      setStep("assign");
      return;
    }

    const analysisText = path === "new" ? description.trim() : "";
    if (analysisText) {
      setIsAnalyzing(true);
      setTimeout(() => {
        setPredictedCategory(predictCategory(analysisText));
        setIsAnalyzing(false);
        setStep("assign");
      }, 900);
    } else {
      setPredictedCategory(null);
      setStep("assign");
    }
  }

  async function handlePay() {
    setIsPaying(true);
    setPayError(null);

    // Take the money first — nothing is filed unless payment clears. An
    // Auto-Assign plan is a subscription (platform keeps it in full); a
    // consultation with a chosen advocate is commission-split server-side.
    const isPlanPurchase = assignMode === "admin" && Boolean(selectedPlan);
    let paymentResult: Awaited<ReturnType<typeof startCheckout>> = null;

    if (totalFee > 0) {
      try {
        paymentResult = await startCheckout({
          amount: totalFee,
          description: isPlanPurchase
            ? `${selectedPlan!.label} Auto-Assign plan`
            : "Legal consultation fee",
          prefill: { name: clientName.trim() || currentCitizenName },
          verification: isPlanPurchase
            ? {
                source: "subscription",
                grossAmount: totalFee,
                citizenId: currentCitizenId,
                citizenName: clientName.trim() || currentCitizenName,
                planId: selectedPlan!.id,
                planLabel: selectedPlan!.label,
              }
            : {
                source: "commission",
                grossAmount: totalFee,
                citizenId: currentCitizenId,
                citizenName: clientName.trim() || currentCitizenName,
                lawyerId: selectedLawyer?.id,
                lawyerName: selectedLawyer?.name,
              },
        });
      } catch (err: unknown) {
        setIsPaying(false);
        setPayError(err instanceof Error ? err.message : "Payment failed. Please try again.");
        return;
      }

      // `null` means the citizen dismissed checkout — don't file the case.
      if (!paymentResult) {
        setIsPaying(false);
        return;
      }
    }

    const readEntry = async (f: File, id: string, today: string): Promise<CaseDocument> => {
      let cloudUrl = "";
      try {
        const uploadRes = await storageService.uploadFile(f, {
          bucket: "case-documents",
          folder: `intake_${currentCitizenId}`,
        });
        if (uploadRes?.fileUrl) {
          cloudUrl = uploadRes.fileUrl;
        }
      } catch (err) {
        console.warn("[Case Filing] Cloud upload fallback to local:", err);
      }

      const fileDataUrl =
        cloudUrl || (f.size <= MAX_ATTACHMENT_BYTES ? await readFileAsDataUrl(f) : undefined);

      return {
        id,
        name: f.name,
        size: fmtSize(f.size),
        uploadedAt: today,
        fileDataUrl,
        fileMimeType: f.type || undefined,
        uploadedBy: "citizen",
      };
    };

    setTimeout(async () => {
      const lawyer = assignMode === "browse" ? selectedLawyer : undefined;
      const id = generateCloseUrCaseId();
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const time = now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

      const documentEntries: CaseDocument[] = await Promise.all([
        ...images.map((f, i) => readEntry(f, `d_img_${i}`, today)),
        ...documents.map((f, i) => readEntry(f, `d_doc_${i}`, today)),
      ]);

      const title =
        clientName.trim() && respondentName.trim()
          ? `${clientName.trim()} vs ${respondentName.trim()}`
          : path === "existing"
            ? `Existing Case — CNR ${cnr.trim()}`
            : description.trim()
              ? description.trim().slice(0, 60) + (description.trim().length > 60 ? "…" : "")
              : "New Legal Matter";

      const isExistingClosed = path === "existing" && existingCaseStatus === "Closed";

      const caseDescription =
        path === "existing"
          ? `Linked from an existing court case (currently ${existingCaseStatus.toLowerCase()} in court) using CNR number ${cnr.trim()}.`
          : description.trim() || "Submitted with attachments only.";

      const status: CaseStatus = isExistingClosed ? "Closed" : lawyer ? "Assigned" : "Submitted";

      const timeline = isExistingClosed
        ? [
            {
              id: "t1",
              status: "Closed" as CaseStatus,
              at: today,
              time,
              note: `Existing case (CNR ${cnr.trim()}) linked as already closed`,
            },
          ]
        : [
            {
              id: "t1",
              status: "Submitted" as CaseStatus,
              at: today,
              time,
              note: "Case filed via Find a Lawyer",
            },
            lawyer
              ? {
                  id: "t2",
                  status: "Assigned" as CaseStatus,
                  at: today,
                  time,
                  note: `Assigned to ${lawyer.name}`,
                }
              : {
                  id: "t2",
                  status: "Submitted" as CaseStatus,
                  at: today,
                  time,
                  note: "Auto-assign requested — pending admin allocation",
                },
          ];

      const newCase: LegalCase = {
        id,
        title,
        description: caseDescription,
        category: predictedCategory ?? "Civil",
        citizenId: currentCitizenId,
        citizenName: clientName.trim() || currentCitizenName,
        lawyerId: lawyer?.id,
        lawyerName: lawyer?.name,
        status,
        city: CITIZEN_CITY,
        createdAt: today,
        updatedAt: today,
        timeline,
        source: "manual",
        caseDetails: {
          courtName: "Not yet determined",
          cnr: path === "existing" ? cnr.trim() : undefined,
          historyOfCaseHearings: [],
          interimOrders: [],
          judges: [],
          petitioners: clientName.trim() ? [clientName.trim()] : [],
          petitionerAdvocates: [],
          respondents: respondentName.trim() ? [respondentName.trim()] : [],
          respondentAdvocates: [],
          hasOrders: false,
          hasJudgments: false,
          orderCount: 0,
          interimOrderCount: 0,
          judgmentCount: 0,
          hearingCount: 0,
          iaCount: 0,
          taggedMatters: [],
          judgmentOrders: [],
        },
        entityInfo: { dateCreated: now.toISOString(), dateModified: now.toISOString() },
        files: { files: documentEntries },
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

      // Dispatch to backend API
      caseService
        .createUserCase({
          citizenId: currentCitizenId,
          lawyerId: lawyer?.id,
          caseType: path === "existing" ? (isExistingClosed ? "closed" : "pending") : "new",
          cnr: path === "existing" && cnr.trim() ? cnr.trim() : undefined,
          title,
          description: caseDescription,
          practiceArea: predictedCategory ?? "Civil",
          specialization: selectedSpecialization || predictedCategory || "Civil",
          legalServices: selectedLegalServices,
          city: CITIZEN_CITY,
          documents: documentEntries.map((d) => ({
            name: d.name,
            // `readEntry` already resolved this to the uploaded cloud URL when the
            // upload succeeded, falling back to a data URL, and formatted the size.
            fileUrl: d.fileDataUrl || "",
            size: d.size,
          })),
        })
        .catch((err: unknown) => {
          console.warn("[Backend Case Sync] Notice:", err);
        });

      addCase(newCase);

      // Record verified payment in store so it appears in citizen and advocate revenue tabs
      if (paymentResult?.payment) {
        mergeRemotePayments([paymentResult.payment as Partial<Payment>]);
      }

      // Record active subscription in store
      if (paymentResult?.subscription) {
        addSubscription(paymentResult.subscription);
      } else if (assignMode === "admin" && selectedPlan) {
        addSubscription({
          citizenId: currentCitizenId,
          planId: selectedPlan.id,
          planLabel: selectedPlan.label,
          amount: selectedPlan.price,
          caseId: id,
        });
      }
      setCreatedCaseId(id);
      setAssignedLawyerName(lawyer?.name || "");
      setAdminAssignRequested(assignMode === "admin");
      setIsPaying(false);
      setStep("done");
    }, 1200);
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 space-y-2 px-3 pt-3 sm:px-6 sm:pt-6 md:px-10 md:pt-5">
        <PageHeader
          title="Find a Lawyer"
          description="Link an existing case or start a new one — just a few quick steps."
          actionsPosition="below"
        />

        {/* Your progress — horizontal stepper, fixed above the scrollable step content */}
        <Card variant="elevated" className="p-2 sm:p-2.5">
          <ol className="grid grid-cols-2 gap-y-1.5 sm:flex sm:items-center sm:gap-0">
            {WIZARD_STEPS.map((s, i) => {
              const currentIndex = WIZARD_STEPS.findIndex((x) => x.key === step);
              const isDone = i < currentIndex;
              const isCurrent = i === currentIndex;
              return (
                <li key={s.key} className="flex items-center gap-2 sm:flex-1">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isDone
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                  </span>
                  <span
                    className={`text-[11px] ${isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                  >
                    {s.label}
                  </span>
                  {i < WIZARD_STEPS.length - 1 && (
                    <span className="mx-1.5 hidden h-px flex-1 bg-border sm:block" />
                  )}
                </li>
              );
            })}
          </ol>
        </Card>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 pb-24 sm:px-6 sm:py-4 sm:pb-4 md:px-10 md:py-4">
        {/* ── STEP 1: choose path + provide details ─────────────────────── */}
        {step === "details" && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">
                    Petitioner Name
                  </span>
                  <span className="ml-auto whitespace-nowrap rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                    Required
                  </span>
                </div>
                <TextField
                  value={clientName}
                  onChange={(v) => {
                    setClientName(sanitizeName(v));
                    setClientNameTouched(true);
                  }}
                  placeholder="Full name of the person filing this case (letters only)"
                  required
                  error={clientNameTouched && !hasClientName}
                  className="w-full"
                />
                {clientNameTouched && !hasClientName && (
                  <p className="text-[10px] font-medium text-destructive">
                    Petitioner Name is required and must contain letters only.
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">
                    Respondent Name
                  </span>
                  <span className="ml-auto whitespace-nowrap rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                    Required
                  </span>
                </div>
                <TextField
                  value={respondentName}
                  onChange={(v) => {
                    setRespondentName(sanitizeName(v));
                    setRespondentNameTouched(true);
                  }}
                  placeholder="Full name of the opposing party / respondent (letters only)"
                  required
                  error={respondentNameTouched && !hasRespondentName}
                  className="w-full"
                />
                {respondentNameTouched && !hasRespondentName && (
                  <p className="text-[10px] font-medium text-destructive">
                    Respondent Name is required and must contain letters only.
                  </p>
                )}
              </div>
            </div>

            <div className={`grid gap-2.5 ${path === null ? "sm:grid-cols-2" : "grid-cols-1"}`}>
              {path !== "new" && (
                <Card
                  variant="outlined"
                  onClick={() => {
                    setPath("existing");
                    setClientNameTouched(true);
                  }}
                  className={`p-3 sm:p-4 ${
                    path === "existing" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FileSearch className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground flex flex-wrap justify-between items-center gap-2">
                        <span>Existing Case</span>
                        {path === "existing" && (
                          <div onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex gap-1 rounded-lg border border-border bg-muted p-0.5">
                              <button
                                type="button"
                                onClick={() => setExistingCaseStatus("Pending")}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                                  existingCaseStatus === "Pending"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Pending
                              </button>
                              <button
                                type="button"
                                onClick={() => setExistingCaseStatus("Closed")}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all ${
                                  existingCaseStatus === "Closed"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                Closed
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Already filed in court? Link it with your CNR number.
                      </p>
                    </div>
                    {path === "existing" && (
                      <button
                        type="button"
                        title="Change case type"
                        aria-label="Change case type"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPath(null);
                        }}
                        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {path === "existing" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 space-y-1.5 border-t border-border/60 pt-3"
                    >
                      <TextField
                        label="CNR Number (16 Alphanumeric Characters)"
                        value={cnr}
                        onChange={(v) => setCnr(sanitizeCNR(v))}
                        placeholder="e.g. APHC010012342025"
                        autoFocus
                        className="w-full font-mono uppercase"
                      />
                      {cnr && cnr.length !== 16 && (
                        <p className="text-[10.5px] font-medium text-amber-600 dark:text-amber-400">
                          CNR number must be exactly 16 characters (e.g., APHC010012342025).
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        We'll pull up your case and connect it with an available Lawyer.
                      </p>
                    </div>
                  )}
                </Card>
              )}

              {path !== "existing" && (
                <Card
                  variant="outlined"
                  onClick={() => {
                    setPath("new");
                    setClientNameTouched(true);
                  }}
                  className={`p-3 sm:p-4 ${
                    path === "new" ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FilePlus2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-foreground">New Case</div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        Add photos, a document, a voice note, or just describe it.
                      </p>
                    </div>
                    {path === "new" && (
                      <button
                        type="button"
                        title="Change case type"
                        aria-label="Change case type"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPath(null);
                        }}
                        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {path === "new" && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 space-y-2.5 border-t border-border/60 pt-3"
                    >
                      <TextField
                        label="Describe your issue"
                        type="textarea"
                        rows={3}
                        value={description}
                        onChange={setDescription}
                        placeholder="Tell us what happened — as much or as little detail as you like."
                        className="w-full"
                      />

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outlined"
                          icon={<ImageIcon className="h-3.5 w-3.5" />}
                          onClick={() => imageInputRef.current?.click()}
                          className="!h-8 !px-3 !text-xs"
                        >
                          Add Photos
                        </Button>
                        <Button
                          variant="outlined"
                          icon={<Paperclip className="h-3.5 w-3.5" />}
                          onClick={() => docInputRef.current?.click()}
                          className="!h-8 !px-3 !text-xs"
                        >
                          Add Document
                        </Button>
                        <Button
                          variant={isRecording ? "filled" : "outlined"}
                          icon={
                            isRecording ? (
                              <Square className="h-3 w-3 fill-current" />
                            ) : (
                              <Mic className="h-3.5 w-3.5" />
                            )
                          }
                          onClick={handleRecordVoiceNote}
                          className="!h-8 !px-3 !text-xs"
                        >
                          {isRecording ? "Tap to stop…" : "Voice Note"}
                        </Button>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const sel = Array.from(e.target.files ?? []);
                            setImages((prev) => [...prev, ...sel]);
                            e.target.value = "";
                          }}
                        />
                        <input
                          ref={docInputRef}
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => {
                            const sel = Array.from(e.target.files ?? []);
                            setDocuments((prev) => [...prev, ...sel]);
                            e.target.value = "";
                          }}
                        />
                      </div>

                      {voiceError && <p className="text-[11px] text-destructive">{voiceError}</p>}
                      {isRecording && (
                        <p className="text-[11px] text-muted-foreground">
                          Listening… speak now, then tap the button again to stop.
                        </p>
                      )}

                      {(images.length > 0 || documents.length > 0) && (
                        <ul className="space-y-1.5">
                          {images.map((f, i) => (
                            <AttachmentRow
                              key={`img-${i}`}
                              icon={<ImageIcon className="h-3.5 w-3.5" />}
                              label={f.name}
                              onRemove={() => setImages((prev) => prev.filter((_, x) => x !== i))}
                            />
                          ))}
                          {documents.map((f, i) => (
                            <AttachmentRow
                              key={`doc-${i}`}
                              icon={<Paperclip className="h-3.5 w-3.5" />}
                              label={f.name}
                              onRemove={() =>
                                setDocuments((prev) => prev.filter((_, x) => x !== i))
                              }
                            />
                          ))}
                        </ul>
                      )}

                      <div className="space-y-2 border-t border-border pt-3">
                        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                          <span className="text-xs font-bold text-foreground">
                            Do you know the legal category for this case?
                          </span>
                          <div className="inline-flex gap-1 rounded-lg border border-border bg-muted p-0.5 self-start">
                            <button
                              type="button"
                              onClick={() => setKnowsCaseType(true)}
                              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                knowsCaseType === true
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              Yes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setKnowsCaseType(false);
                                setSelectedPracticeArea("");
                                setSelectedSpecialization("");
                                setSelectedLegalServices([]);
                                setIsAiAnalyzed(false);
                              }}
                              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                                knowsCaseType === false
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        {knowsCaseType === true && (
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                            <Select
                              label="Practice Area"
                              required
                              value={selectedPracticeArea}
                              onChange={handlePracticeAreaChange}
                              options={[
                                { value: "", label: "-- Select Practice Area --" },
                                ...practiceAreaTree.map((pa) => ({
                                  value: pa.category,
                                  label: pa.category,
                                })),
                              ]}
                            />
                            <Select
                              label="Specialization"
                              required
                              value={selectedSpecialization}
                              onChange={handleSpecializationChange}
                              disabled={
                                !selectedPracticeArea || availableSpecializations.length === 0
                              }
                              options={[
                                { value: "", label: "-- Select Specialization --" },
                                ...availableSpecializations.map((s) => ({
                                  value: s.case_type,
                                  label: s.case_type,
                                })),
                              ]}
                            />
                            <MultiSelectField
                              label="Legal Service"
                              options={availableLegalServices}
                              selected={selectedLegalServices}
                              onToggle={toggleLegalService}
                              disabled={
                                !selectedSpecialization || availableLegalServices.length === 0
                              }
                            />
                          </div>
                        )}

                        {knowsCaseType === false && (
                          <div className="mt-2">
                            {!isAiAnalyzed && !predictedCategory ? (
                              <Card
                                variant="outlined"
                                className="p-3.5 bg-primary/5 border-primary/20 space-y-2"
                              >
                                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                                  <div className="space-y-0.5">
                                    <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                                      <span>Analyze Case with AI</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                      Click the button below to let our AI analyze your issue
                                      description and identify the legal category.
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    disabled={!hasDescriptionText || isInlineAnalyzing}
                                    onClick={() => {
                                      setIsInlineAnalyzing(true);
                                      setTimeout(() => {
                                        const cat = predictCategory(description);
                                        setPredictedCategory(cat);
                                        setIsInlineAnalyzing(false);
                                        setIsAiAnalyzed(true);
                                      }, 600);
                                    }}
                                    icon={
                                      isInlineAnalyzing ? (
                                        <CircularProgress
                                          indeterminate
                                          ariaLabel="Analyzing"
                                          className="h-3.5 w-3.5"
                                        />
                                      ) : (
                                        <Sparkles className="h-3.5 w-3.5" />
                                      )
                                    }
                                    className="!h-8 !px-3.5 !text-xs shrink-0 self-start sm:self-auto"
                                  >
                                    {isInlineAnalyzing ? "Analyzing…" : "Analyze Case"}
                                  </Button>
                                </div>
                                {!hasDescriptionText && (
                                  <p className="text-[10px] font-medium text-destructive">
                                    Please describe your issue in a few words above before running
                                    the AI analysis.
                                  </p>
                                )}
                              </Card>
                            ) : (
                              <Card
                                variant="elevated"
                                className="p-3.5 border-primary/30 bg-primary/5"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Sparkles className="h-4.5 w-4.5" />
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                                        AI Case Analysis Output
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold text-primary">
                                          Auto-Categorized
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setIsInlineAnalyzing(true);
                                            setTimeout(() => {
                                              const cat = predictCategory(description);
                                              setPredictedCategory(cat);
                                              setIsInlineAnalyzing(false);
                                            }, 500);
                                          }}
                                          className="text-[10px] font-semibold text-primary hover:underline"
                                        >
                                          Re-analyze
                                        </button>
                                      </div>
                                    </div>
                                    <div className="text-sm font-bold text-foreground">
                                      Looks like a{" "}
                                      {predictedCategory || predictCategory(description)} Law matter
                                    </div>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                      Based on your problem description, our AI analyzed your issue
                                      and identified it as{" "}
                                      <strong>
                                        {predictedCategory || predictCategory(description)} Law
                                      </strong>
                                      . We will prioritize{" "}
                                      <strong>
                                        {predictedCategory || predictCategory(description)} Law
                                      </strong>{" "}
                                      lawyers for your case.
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>

            {!canContinueDetails && missingDetailsReason && (
              <p className="text-right text-[11px] font-medium text-muted-foreground">
                {missingDetailsReason}
              </p>
            )}
            <div className="flex justify-between">
              <Button
                variant="outlined"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => navigate({ to: "/citizen" })}
              >
                Back
              </Button>
              <Button
                disabled={!canContinueDetails || isAnalyzing}
                onClick={handleContinueFromDetails}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-2">
                    <CircularProgress
                      indeterminate
                      ariaLabel="Analyzing case"
                      className="h-4 w-4"
                    />
                    Analyzing case…
                  </span>
                ) : (
                  "Continue"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: assign an Lawyer ──────────────────────────────── */}
        {step === "assign" && (
          <div className="space-y-5">
            {/* Step 2 Ultra-Cool AI Case Control Center Dossier Banner */}
            <Card
              variant="elevated"
              className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/15 via-indigo-500/10 to-teal-500/10 backdrop-blur-xl shadow-xl shadow-primary/10 transition-all duration-300"
            >
              {/* Background Ambient Glow Orbs */}
              <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-4">
                {/* Header Row with Badges & Live Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/20 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      AI CASE DOSSIER • VERIFIED
                    </span>
                    <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[9.5px] font-extrabold text-primary border border-primary/25 shadow-xs">
                      {path === "existing"
                        ? `Existing Case (CNR: ${cnr.trim() || "N/A"})`
                        : "New Legal Case Registration"}
                    </span>
                  </div>

                  {(predictedCategory ||
                    (selectedPracticeArea
                      ? mapPracticeAreaToCategory(selectedPracticeArea)
                      : null)) && (
                    <div className="shrink-0">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-primary px-3.5 py-1 text-xs font-black text-white shadow-md shadow-emerald-500/25 tracking-wide uppercase">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                        {predictedCategory || mapPracticeAreaToCategory(selectedPracticeArea)} Law
                      </span>
                    </div>
                  )}
                </div>

                {/* Main VS Legal Arena Battle Box */}
                <div className="grid grid-cols-1 sm:grid-cols-7 items-center gap-3 rounded-2xl border border-primary/20 bg-background/70 backdrop-blur-md p-4 shadow-sm">
                  {/* Petitioner Card */}
                  <div className="sm:col-span-3 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/20 font-black text-base shadow-inner">
                      {(clientName.trim() || "P")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                        PETITIONER
                      </span>
                      <div className="text-sm font-extrabold text-foreground truncate">
                        {clientName.trim() || "Petitioner"}
                      </div>
                    </div>
                  </div>

                  {/* VS Badge */}
                  <div className="sm:col-span-1 flex items-center justify-center my-1 sm:my-0">
                    <span className="inline-flex items-center justify-center h-8 px-3 rounded-full bg-gradient-to-r from-primary via-indigo-600 to-violet-600 text-white font-black text-xs tracking-widest shadow-md shadow-primary/30 border border-white/20">
                      VS
                    </span>
                  </div>

                  {/* Respondent Card */}
                  <div className="sm:col-span-3 flex items-center gap-3 justify-end sm:text-right">
                    <div className="min-w-0 flex-1 order-2 sm:order-1">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block">
                        RESPONDENT
                      </span>
                      <div className="text-sm font-extrabold text-foreground truncate">
                        {respondentName.trim() || "Respondent"}
                      </div>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 font-black text-base shadow-inner order-1 sm:order-2">
                      {(respondentName.trim() || "R")[0].toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Bottom Metadata & Insight Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-background/80 px-3 py-1 font-semibold text-foreground/80 border border-border/80 shadow-2xs">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      {userCityLabel}
                    </span>

                    {images.length + documents.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-primary/10 px-3 py-1 font-bold text-primary border border-primary/20 shadow-2xs">
                        📎 {images.length + documents.length} attachment(s)
                      </span>
                    )}
                  </div>

                  {description.trim() && (
                    <div className="truncate max-w-md text-xs font-medium text-muted-foreground italic bg-background/60 px-3 py-1 rounded-xl border border-border/60">
                      "{description.slice(0, 75)}
                      {description.length > 75 ? "..." : ""}"
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Card 1: Choose a Lawyer (Pay As You Go) */}
              <Card
                variant="outlined"
                onClick={() => setAssignMode("browse")}
                className={`relative overflow-hidden p-5 sm:p-6 cursor-pointer transition-all duration-300 rounded-2xl ${
                  assignMode === "browse"
                    ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent shadow-lg shadow-emerald-500/10"
                    : "border-border bg-card hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:shadow-md"
                }`}
              >
                {/* Slanted Top-Right Corner Ribbon with Marquee Text */}
                <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none z-10">
                  <div className="absolute top-4 -right-10 w-40 rotate-45 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white text-[8.5px] font-black py-1 shadow-md shadow-emerald-900/30 border-b border-emerald-300/40 uppercase overflow-hidden">
                    <div className="animate-banner-marquee flex whitespace-nowrap items-center">
                      <span className="shrink-0 pr-3">
                        PAY AS YOU GO PAY AS YOU GO PAY AS YOU GO{" "}
                      </span>
                      <span className="shrink-0 pr-3">
                        PAY AS YOU GO PAY AS YOU GO PAY AS YOU GO{" "}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 pr-16 sm:pr-20">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all ${
                      assignMode === "browse"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 shadow-inner"
                        : "bg-primary/10 text-primary border-transparent"
                    }`}
                  >
                    <Users className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-base font-extrabold text-foreground truncate">
                        Choose a Lawyer
                      </div>
                      {assignMode === "browse" && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Browse top-rated Lawyers near you, filtered strictly by your case category &
                      location.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Card 2: Auto-Assign (Subscription) */}
              <Card
                variant="outlined"
                onClick={() => setAssignMode("admin")}
                className={`relative overflow-hidden p-5 sm:p-6 cursor-pointer transition-all duration-300 rounded-2xl ${
                  assignMode === "admin"
                    ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent shadow-lg shadow-indigo-500/10"
                    : "border-border bg-card hover:border-indigo-500/50 hover:bg-indigo-500/5 hover:shadow-md"
                }`}
              >
                {/* Slanted Top-Right Corner Ribbon with Marquee Text */}
                <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none z-10">
                  <div className="absolute top-4 -right-10 w-40 rotate-45 bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-500 text-white text-[8.5px] font-black py-1 shadow-md shadow-indigo-900/30 border-b border-purple-300/40 uppercase overflow-hidden">
                    <div className="animate-banner-marquee flex whitespace-nowrap items-center">
                      <span className="shrink-0 pr-3">SUBSCRIPTION SUBSCRIPTION SUBSCRIPTION </span>
                      <span className="shrink-0 pr-3">SUBSCRIPTION SUBSCRIPTION SUBSCRIPTION </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 pr-16 sm:pr-20">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all ${
                      assignMode === "admin"
                        ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shadow-inner"
                        : "bg-primary/10 text-primary border-transparent"
                    }`}
                  >
                    <Scale className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-base font-extrabold text-foreground truncate">
                        Auto-Assign
                      </div>
                      {assignMode === "admin" && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-500" />
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Hand off to our legal admin team — we'll match & assign the best specialist
                      for you.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {assignMode === "browse" && (
              <Card variant="elevated" className="p-4 sm:p-6 space-y-3 rounded-2xl">
                <h2 className="text-sm font-bold text-foreground">Pick a lawyer from law hub</h2>
                <p className="text-[11px] text-muted-foreground">
                  {locating
                    ? "Detecting your location…"
                    : `Sorted by proximity to ${userCityLabel}${
                        selectedPracticeArea
                          ? ` and ${selectedSpecialization || selectedPracticeArea} expertise`
                          : predictedCategory
                            ? ` and ${predictedCategory} Law expertise`
                            : ""
                      }.`}
                </p>

                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {sortedLawyers.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border bg-background p-4 text-center text-xs text-muted-foreground">
                      No Lawyers match this practice area right now — go back and try Auto-Assign
                      instead.
                    </p>
                  ) : (
                    sortedLawyers.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => setSelectedLawyerId(l.id)}
                        className={`flex cursor-pointer items-center justify-between gap-2 rounded-xl border p-3 transition-all ${
                          selectedLawyerId === l.id
                            ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500 shadow-xs"
                            : "border-border bg-background hover:border-emerald-500/40"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <UserAvatar name={l.name} size="sm" role="lawyer" />
                          <div className="min-w-0">
                            <div className="truncate text-xs font-bold text-foreground">
                              {l.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {l.category} Law · {l.area ? `${l.area}, ` : ""}
                              {l.city} · {l.experienceYears} yrs
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className="inline-flex items-center gap-0.5 font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shadow-2xs"
                            title="Consultation Fee"
                          >
                            ₹{l.consultationFee ?? 1500}
                          </span>
                          <Button
                            variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProfileLawyer(l);
                            }}
                          >
                            View
                          </Button>
                          {selectedLawyerId === l.id && (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            )}

            {assignMode === "admin" && (
              <Card
                variant="elevated"
                className="p-5 sm:p-7 space-y-5 rounded-2xl border border-border/80 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      Select Subscription Plan
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Our legal admin team matches and assigns your advocate instantly upon
                      selection.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {SUBSCRIPTION_PLANS.map((plan) => {
                    const isYearly = plan.id === "yearly" || plan.badge;
                    const isSelected = subscriptionPlan === plan.id;
                    return (
                      <Card
                        key={plan.id}
                        variant="outlined"
                        onClick={() => setSubscriptionPlan(plan.id)}
                        className={`relative overflow-hidden p-5 cursor-pointer transition-all duration-300 rounded-2xl flex flex-col justify-between ${
                          isSelected
                            ? isYearly
                              ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent shadow-lg shadow-emerald-500/10"
                              : "border-indigo-500 ring-2 ring-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent shadow-lg shadow-indigo-500/10"
                            : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                        }`}
                      >
                        {/* Top Badge Pill */}
                        {plan.badge && (
                          <div className="absolute top-0 right-0">
                            <span className="inline-block bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[9px] font-black tracking-widest px-3 py-1 rounded-bl-xl shadow-xs uppercase">
                              🔥 {plan.badge}
                            </span>
                          </div>
                        )}

                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide uppercase ${
                                isYearly
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                  : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                              }`}
                            >
                              {isYearly ? "ANNUAL PASS" : "FLEXIBLE PLAN"}
                            </span>
                            {isSelected && (
                              <CheckCircle2
                                className={`h-5 w-5 shrink-0 ${
                                  isYearly ? "text-emerald-500" : "text-indigo-500"
                                }`}
                              />
                            )}
                          </div>

                          <div className="mt-3">
                            <div className="text-sm font-extrabold text-foreground">
                              {plan.label}
                            </div>
                            <div className="mt-1 flex items-baseline gap-1">
                              <span className="text-2xl font-black text-foreground">
                                ₹{plan.price}
                              </span>
                              <span className="text-xs font-semibold text-muted-foreground">
                                {plan.cadence}
                              </span>
                              {isYearly && (
                                <span className="ml-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  ~₹416/mo
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                            {plan.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold text-foreground/80">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck
                              className={`h-3.5 w-3.5 ${
                                isYearly ? "text-emerald-500" : "text-indigo-500"
                              }`}
                            />
                            Priority Admin Dispatch
                          </span>
                          <span className="text-primary hover:underline font-bold">
                            {isSelected ? "Selected" : "Select"}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            )}

            <div className="flex justify-between">
              <Button
                variant="outlined"
                icon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => setStep("details")}
              >
                Back
              </Button>
              <Button disabled={!canContinueAssign} onClick={() => setStep("payment")}>
                Continue to Payment
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: payment confirmation passport ────────────────────────────── */}
        {step === "payment" && (
          <Card
            variant="elevated"
            className="relative overflow-hidden rounded-2xl border border-primary/25 shadow-lg bg-card"
          >
            {/* Top Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-primary to-indigo-500" />

            <div className="p-4 sm:p-5 space-y-4">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary border border-primary/30 shadow-xs">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground flex items-center gap-2">
                      Case Registration & Payment Passport
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Review all verified details gathered from your case setup before final
                      dispatch.
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
              </div>

              {/* Case Parties Banner */}
              <div className="rounded-xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                    Verified Legal Parties
                  </span>
                  <div className="text-base font-black text-foreground truncate mt-0.5 flex items-center gap-2">
                    <span className="truncate">{clientName.trim() || "Petitioner"}</span>
                    <span className="text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md shrink-0">
                      VS
                    </span>
                    <span className="truncate">{respondentName.trim() || "Respondent"}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="rounded-lg bg-background px-2.5 py-1 text-[11px] font-extrabold text-primary border border-primary/20 shadow-2xs flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    {predictedCategory ||
                      (selectedPracticeArea
                        ? mapPracticeAreaToCategory(selectedPracticeArea)
                        : "General")}{" "}
                    Law
                  </span>
                </div>
              </div>

              {/* All Gathered Information Grid */}
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  Complete Case Dossier Details
                </h4>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
                  {/* Item 1: Case Type & Path */}
                  <div className="rounded-lg border border-border/80 bg-background/60 p-3 flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary mt-0.5">
                      <FileSearch className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold text-muted-foreground">
                        Filing Mode & Type
                      </div>
                      <div className="text-xs font-extrabold text-foreground mt-0.5">
                        {path === "existing"
                          ? `Existing Case (CNR: ${cnr.trim() || "N/A"})`
                          : "New Legal Case"}
                      </div>
                    </div>
                  </div>

                  {/* Item 2: Location & Jurisdiction */}
                  <div className="rounded-lg border border-border/80 bg-background/60 p-3 flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold text-muted-foreground">
                        Jurisdiction / Location
                      </div>
                      <div className="text-xs font-extrabold text-foreground mt-0.5">
                        {userCityLabel}
                      </div>
                    </div>
                  </div>

                  {/* Item 3: Assigned Lawyer */}
                  <div className="rounded-lg border border-border/80 bg-background/60 p-3 flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                      <Users className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold text-muted-foreground">
                        Assigned Legal Advocate
                      </div>
                      <div className="text-xs font-extrabold text-foreground mt-0.5 truncate">
                        {assignMode === "browse" && selectedLawyer
                          ? `${selectedLawyer.name} (${selectedLawyer.category} Specialist)`
                          : "Auto-Assigned by CloseUrCase Admin"}
                      </div>
                    </div>
                  </div>

                  {/* Item 4: Plan & Billing Mode */}
                  <div className="rounded-lg border border-border/80 bg-background/60 p-3 flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 mt-0.5">
                      <CreditCard className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold text-muted-foreground">
                        Selected Plan / Billing
                      </div>
                      <div className="text-xs font-extrabold text-foreground mt-0.5">
                        {assignMode === "admin" && selectedPlan
                          ? `${selectedPlan.label} (${selectedPlan.cadence})`
                          : "Pay As You Go (Per Case Consultation)"}
                      </div>
                    </div>
                  </div>

                  {/* Item 5: Case Issue Summary */}
                  <div className="sm:col-span-2 rounded-lg border border-border/80 bg-background/60 p-3 flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[10px] font-semibold text-muted-foreground">
                          Case Issue Brief
                        </div>
                        {images.length + documents.length > 0 && (
                          <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            📎 {images.length + documents.length} file(s) attached
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-medium text-foreground/90 mt-0.5 italic leading-relaxed">
                        {description.trim()
                          ? `"${description}"`
                          : "No extra issue description details added."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Fee & Checkout Summary Box */}
              <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Base Legal Service / Plan Fee</span>
                  <span className="font-semibold text-foreground">₹{totalFee}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Priority Admin Matching & Dispatch</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Included (Free)
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>GST & Taxes</span>
                  <span className="font-semibold text-foreground">Inclusive</span>
                </div>

                <div className="pt-2 border-t border-primary/20 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Total Payable Amount
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Instant confirmation upon payment
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-xl font-black text-primary">
                    <IndianRupee className="h-5 w-5" />
                    <span>{totalFee}</span>
                  </div>
                </div>
              </div>

              {payError && (
                <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <Button
                  variant="outlined"
                  icon={<ArrowLeft className="h-3.5 w-3.5" />}
                  disabled={isPaying}
                  onClick={() => setStep("assign")}
                  className="h-9 px-4 text-xs font-bold"
                >
                  Back
                </Button>
                <Button
                  disabled={isPaying}
                  onClick={handlePay}
                  className="h-9 px-5 text-xs font-bold bg-gradient-to-r from-primary via-primary/90 to-indigo-600 hover:opacity-95 shadow-md"
                >
                  {isPaying ? (
                    <span className="flex items-center justify-center gap-2">
                      <CircularProgress
                        indeterminate
                        ariaLabel="Processing payment"
                        className="h-3.5 w-3.5"
                      />
                      Registering Case…
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Lock className="h-3.5 w-3.5" />
                      Pay ₹{totalFee} & Register Case
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── STEP 4: done ─────────────────────────────────────────────── */}
        {step === "done" && (
          <Card variant="elevated" className="p-8 text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Case Submitted Successfully</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Case registered with ID <strong className="text-primary">{createdCaseId}</strong>
                {assignedLawyerName ? (
                  <>
                    {" "}
                    and assigned to{" "}
                    <strong className="text-foreground">{assignedLawyerName}</strong>.
                  </>
                ) : adminAssignRequested ? (
                  <>
                    {" "}
                    Your request has been sent to our admin team — you'll be notified once an Lawyer
                    is assigned.
                  </>
                ) : (
                  "."
                )}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button onClick={() => navigate({ to: "/citizen/my-cases" })}>My Cases</Button>
            </div>
          </Card>
        )}
      </div>

      {/* Lawyer Profile Popup */}
      <Dialog
        open={profileLawyer !== null}
        onOpenChange={(o) => !o && setProfileLawyer(null)}
        maxWidth="680px"
      >
        {profileLawyer && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3 w-full">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lawyer Profile
                </span>
                {/* Focus sink — absorbs md-dialog's auto-focus on open */}
                <span tabIndex={0} aria-hidden="true" className="sr-only" />
                <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setProfileLawyer(null)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </IconButton>
              </DialogTitle>
            </DialogHeader>
            <DialogContent>
              <LawyerProfileCard lawyer={profileLawyer} />
            </DialogContent>
          </>
        )}
      </Dialog>
    </div>
  );
}

const WIZARD_STEPS: { key: Step; label: string }[] = [
  { key: "details", label: "Case details" },
  { key: "assign", label: "Assign Lawyer" },
  { key: "payment", label: "Payment" },
  { key: "done", label: "Done" },
];

function AttachmentRow({
  icon,
  label,
  sub,
  onRemove,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-start justify-between gap-2 rounded-lg border border-border/60 bg-background px-3 py-2">
      <div className="flex min-w-0 items-start gap-2">
        <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-foreground">{label}</div>
          {sub && <p className="text-[11px] text-muted-foreground line-clamp-2">{sub}</p>}
        </div>
      </div>
      <button
        onClick={onRemove}
        className="shrink-0 cursor-pointer p-0.5 text-muted-foreground transition-colors hover:text-destructive"
        title="Remove"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

/** A checkbox-driven multi-select, styled to match the m3 outlined Select
 * it sits alongside — used for "Legal Service" since @material/web's select
 * has no built-in multi-select mode. All options are passed in already
 * selected by default when a specialization is first picked. */
function MultiSelectField({
  label,
  options,
  selected,
  onToggle,
  disabled,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const summary =
    options.length === 0
      ? ""
      : selected.length === options.length
        ? "All services"
        : selected.length === 0
          ? "None selected"
          : `${selected.length} of ${options.length} selected`;

  return (
    <div className="relative">
      <span
        className={`absolute -top-2 left-3 z-10 bg-surface px-1 text-[11px] transition-colors ${
          disabled ? "text-muted-foreground/50" : open ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`relative flex h-9 w-full items-center justify-between gap-2 rounded-[4px] border px-3 text-left text-sm outline-hidden transition-colors ${
          disabled
            ? "cursor-not-allowed border-border/50 bg-muted/30 text-muted-foreground/50"
            : open
              ? "cursor-pointer border-primary bg-background text-foreground ring-1 ring-primary"
              : "cursor-pointer border-border bg-background text-foreground hover:border-foreground/60"
        }`}
      >
        <span className="block min-w-0 flex-1 truncate">{summary || "—"}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 z-50 mb-1 max-h-56 w-full min-w-60 overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
            {options.map((opt) => {
              const isChecked = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onToggle(opt)}
                  className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2 text-left text-xs hover:bg-muted/60"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-2 transition-colors ${
                      isChecked
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/50 bg-transparent"
                    }`}
                  >
                    {isChecked && (
                      <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />
                    )}
                  </span>
                  <span className="text-foreground">{opt}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
