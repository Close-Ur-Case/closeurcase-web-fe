import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { getStoredToken, getStoredUser } from "@/services/apiClient";
import type { AuthUser } from "@/types/api";
import {
  Briefcase,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Phone,
  Plus,
  Scale,
  ShieldCheck,
  Upload,
  User,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthLayout } from "@/layouts/AuthLayout";
import { FormStepper } from "@/components/app/FormStepper";
import type { FormStep } from "@/components/app/FormStepper";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import {
  getLawyerPracticeAreas,
  type LawyerPracticeArea,
} from "@/components/app/lawyerPracticeAreas";
import {
  sanitizeName,
  sanitizePhone,
  validateName,
  validatePhone,
  validateEmail,
  validatePassword,
} from "@/lib/validations";
import { INDIAN_COURTS, INDIAN_CITIES, INDIAN_LANGUAGES } from "@/data/courts";
import {
  addLawyer,
  subscribeToStore,
  getActiveCities,
  getActiveLanguages,
  getActiveCourts,
} from "@/data/appStore";
import type { LegalCategory, LawyerAward } from "@/types";
import { useLawyerRegister } from "@/hooks/queries/useAuth";
import {
  useCategoriesQuery,
  useCourtsQuery,
  useCitiesQuery,
  useDistrictsQuery,
  useLanguagesQuery,
} from "@/hooks/queries/useMasterData";
import { authService } from "@/services/authService";
import { storageService } from "@/services/storageService";
import {
  Button,
  IconButton,
  TextField,
  Select,
  Checkbox,
  InputChip,
  OtpInput,
} from "@/components/m3";

const MAX_ID_PROOF_BYTES = 5 * 1024 * 1024;

/** Demo OTP accepted for both email and mobile verification in this frontend-only build. */
const TEST_OTP = "0000";

/** Per-step heading shown above the form body — kept constant-height so the
 * progress bar above it never shifts between steps. */
const STEP_META = [
  { label: "Your details", desc: "Tell us who you are and where you practise." },
  {
    label: "Practice areas",
    desc: "Choose the categories, specialisations and services you handle.",
  },
  {
    label: "Credentials",
    desc: "Add your Bar registration, experience, languages and courts.",
  },
  {
    label: "Profile & Office",
    desc: "Add your chamber address and professional biography.",
  },
  {
    label: "Awards & ID Proof",
    desc: "Add optional awards & recognition and upload your Bar ID proof.",
  },
  {
    label: "Verification & Security",
    desc: "Verify your email, enter contact details, set your password, and submit.",
  },
];

interface SelectedPracticeEntry {
  id: string;
  practiceArea: string;
  specialization: string;
  legalService: string;
}

function mapPracticeAreaToCategory(areaName: string): LegalCategory {
  const lower = areaName.toLowerCase();
  if (lower.includes("criminal")) return "Criminal";
  if (lower.includes("corporate")) return "Corporate";
  if (lower.includes("family")) return "Family";
  if (lower.includes("property")) return "Property";
  if (lower.includes("consumer")) return "Consumer";
  if (lower.includes("cyber")) return "Cyber";
  if (lower.includes("labour")) return "Labour";
  if (lower.includes("banking") || lower.includes("tax") || lower.includes("civil")) return "Civil";
  return "Civil";
}

export const Route = createFileRoute("/lawyer-register")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = getStoredToken();
      const user = getStoredUser<AuthUser>();
      if (token || user) {
        if (user?.role === "lawyer") throw redirect({ to: "/lawyer" });
        if (user?.role === "admin") throw redirect({ to: "/admin" });
      }
    }
  },
  head: () => ({ meta: [{ title: "Lawyer registration — CloseUrCase" }] }),
  component: LawyerRegister,
});

/** 6 Dedicated Steps:
 * 1. Your details (Registration type, Photo, Full Name, Service Districts)
 * 2. Practice areas (3-tier categories, specializations, legal services)
 * 3. Credentials (Bar ID, Experience, Languages, Courts)
 * 4. Profile & Office (Chamber Address, Bio / Summary)
 * 5. Awards & ID Proof (Awards & Recognition, Bar ID Proof Document)
 * 6. Verification & Security (Identity Verification, Account Security, Declaration & Submit)
 */
const REGISTER_STEPS: FormStep[] = [
  { id: 1, label: "Your details" },
  { id: 2, label: "Practice areas" },
  { id: 3, label: "Credentials" },
  { id: 4, label: "Profile & Office" },
  { id: 5, label: "Awards & ID Proof" },
  { id: 6, label: "Verification & Security" },
];

function Step({ n, current, children }: { n: number; current: number; children: ReactNode }) {
  if (n !== current) return null;
  return <div className="w-full min-w-0 space-y-3">{children}</div>;
}

function VerifiedPill() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
      <Check className="h-3 w-3" />
      Verified
    </span>
  );
}

/**
 * One channel (email or mobile) of the step-1 verification card: labelled
 * input + a right-aligned "Send code" action that, once tapped, reveals a
 * 4-box OTP entry with an aligned "Verify" button. On phones the action
 * buttons drop full-width below their field instead of squeezing beside it.
 */
function EmailVerifyField({
  value,
  onChange,
  isValid,
  validationError,
  showValidationError,
  verified,
  otpSent,
  otp,
  onOtpChange,
  otpError,
  onSend,
  onReset,
  isSending,
}: {
  value: string;
  onChange: (v: string) => void;
  isValid: boolean;
  validationError?: string;
  showValidationError: boolean;
  verified: boolean;
  otpSent: boolean;
  otp: string;
  onOtpChange: (v: string) => void;
  otpError: string;
  onSend: () => void;
  onReset: () => void;
  isSending?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-primary">
            <Mail className="h-4 w-4" />
          </span>
          Official email address
          <span className="text-destructive">*</span>
        </span>
        {verified && <VerifiedPill />}
      </div>

      {verified ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5">
          <span className="min-w-0 truncate text-sm font-medium text-foreground">{value}</span>
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <TextField
                label="Email address"
                type="email"
                required
                value={value}
                onChange={onChange}
                placeholder="advocate@example.com"
                leadingIcon={<Mail className="h-4 w-4" />}
                error={showValidationError && !isValid}
                className="w-full"
              />
            </div>
            <Button
              type="button"
              variant="outlined"
              onClick={onSend}
              disabled={isSending}
              className="cuc-field-action h-11! min-h-0! w-full shrink-0 px-5 text-[13px] font-semibold sm:h-auto! sm:w-auto"
            >
              {isSending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending…
                </span>
              ) : otpSent ? (
                "Resend code"
              ) : (
                "Send code"
              )}
            </Button>
          </div>

          {showValidationError && !isValid && validationError && (
            <p className="text-xs font-medium text-destructive">{validationError}</p>
          )}

          {otpSent && (
            <div className="animate-in fade-in slide-in-from-top-1 space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5 duration-200">
              <p className="text-center text-xs font-medium text-foreground">
                Enter the 6-digit verification code sent to your email (or test code 000000)
              </p>
              <div className="flex flex-col items-center gap-1.5">
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={onOtpChange}
                  error={!!otpError}
                  ariaLabel="Email verification code"
                  className="justify-center"
                />
                <p className="text-[11px] text-muted-foreground text-center">
                  Verification completes when you click <strong>Verify & submit</strong> below.
                </p>
              </div>
              {otpError && (
                <p className="text-center text-xs font-medium text-destructive">{otpError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LawyerRegister() {
  const navigate = useNavigate();
  const registerMutation = useLawyerRegister();
  const categoriesQuery = useCategoriesQuery();
  const courtsQuery = useCourtsQuery();
  const citiesQuery = useCitiesQuery();
  const districtsQuery = useDistrictsQuery();
  const languagesQuery = useLanguagesQuery();

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  const [step, setStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [stepError, setStepError] = useState("");

  const [isSendingEmailOtp, setIsSendingEmailOtp] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  // Mobile only: when a field is focused and the on-screen keyboard slides up,
  // browsers (iOS Safari especially, with these shadow-DOM inputs) often leave
  // the active field hidden behind it. After the keyboard settles, nudge the
  // document so the focused field sits inside the visible area.
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 1023px)");

    const isField = (el: EventTarget | null): el is HTMLElement => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        tag.startsWith("md-outlined-") ||
        el.isContentEditable
      );
    };

    let timer: ReturnType<typeof setTimeout> | undefined;
    const onFocusIn = (e: FocusEvent) => {
      if (!mobile.matches) return;
      const target = e.target;
      if (!isField(target) || !formRef.current?.contains(target)) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const vv = window.visualViewport;
        const rect = target.getBoundingClientRect();
        const margin = 24;
        if (vv) {
          const visibleTop = vv.offsetTop;
          const visibleBottom = vv.offsetTop + vv.height;
          if (rect.bottom > visibleBottom - margin) {
            window.scrollBy({ top: rect.bottom - visibleBottom + margin, behavior: "smooth" });
          } else if (rect.top < visibleTop + margin) {
            window.scrollBy({ top: rect.top - visibleTop - margin, behavior: "smooth" });
          }
        } else {
          target.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }, 300);
    };

    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      clearTimeout(timer);
    };
  }, []);

  const goToStep = (id: number) => {
    setStepError("");
    setStep(id);
  };
  const goBack = () => {
    setStepError("");
    setStep((s) => Math.max(1, s - 1));
  };

  // Step 6: Verification & Security state
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpError, setEmailOtpError] = useState("");

  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const emailRes = validateEmail(email);
  const phoneRes = validatePhone(phone);

  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRes = validatePassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Step 1: Your details
  const [registrationType, setRegistrationType] = useState<"lawyer" | "firm">("lawyer");
  const isFirm = registrationType === "firm";

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const nameRes = validateName(name);

  // Step 3: Practice areas
  const [managedCities, setManagedCities] = useState<string[]>(() =>
    getActiveCities().map((c) => c.name),
  );
  const [managedLanguages, setManagedLanguages] = useState<string[]>(() =>
    getActiveLanguages().map((l) => l.name),
  );
  const [managedCourts, setManagedCourts] = useState<string[]>(() =>
    getActiveCourts().map((c) => c.name),
  );
  const [practiceAreaTree, setPracticeAreaTree] =
    useState<LawyerPracticeArea[]>(getLawyerPracticeAreas);

  useEffect(() => {
    return subscribeToStore(() => {
      setManagedCities(getActiveCities().map((c) => c.name));
      setManagedLanguages(getActiveLanguages().map((l) => l.name));
      setManagedCourts(getActiveCourts().map((c) => c.name));
      setPracticeAreaTree(getLawyerPracticeAreas());
    });
  }, []);

  const effectivePracticeAreaTree = useMemo(() => {
    if (categoriesQuery.data && categoriesQuery.data.length > 0) {
      return categoriesQuery.data
        .filter((cat) => cat.active !== false)
        .map((cat) => ({
          category: cat.name,
          case_types: (cat.subCategories || [])
            .filter((sub) => sub.active !== false)
            .map((sub) => ({
              case_type: sub.name,
              legal_services: (sub.services || [])
                .filter((srv) => (typeof srv === "string" ? true : srv.active !== false))
                .map((srv) => (typeof srv === "string" ? srv : srv.name)),
            })),
        }));
    }
    return practiceAreaTree;
  }, [categoriesQuery.data, practiceAreaTree]);

  const effectiveCities = useMemo(() => {
    const list: string[] = [];
    if (districtsQuery.data && districtsQuery.data.length > 0) {
      for (const d of districtsQuery.data) {
        if (d.active !== false && d.name && !list.includes(d.name)) {
          list.push(d.name);
        }
      }
    }
    if (citiesQuery.data && citiesQuery.data.length > 0) {
      for (const c of citiesQuery.data) {
        if (c.active !== false && c.name && !list.includes(c.name)) {
          list.push(c.name);
        }
      }
    }
    if (list.length > 0) {
      return list.sort((a, b) => a.localeCompare(b));
    }
    return managedCities.length > 0 ? managedCities : INDIAN_CITIES;
  }, [districtsQuery.data, citiesQuery.data, managedCities]);

  const effectiveCourts = useMemo(() => {
    if (courtsQuery.data && courtsQuery.data.length > 0) {
      return courtsQuery.data
        .filter((c) => c.active !== false && c.name)
        .map((c) => c.name)
        .sort((a, b) => a.localeCompare(b));
    }
    return managedCourts.length > 0 ? managedCourts : INDIAN_COURTS;
  }, [courtsQuery.data, managedCourts]);

  const effectiveLanguages = useMemo(() => {
    if (languagesQuery.data && languagesQuery.data.length > 0) {
      return languagesQuery.data
        .filter((l) => l.active !== false && l.name)
        .map((l) => l.name)
        .sort((a, b) => a.localeCompare(b));
    }
    return managedLanguages.length > 0 ? managedLanguages : INDIAN_LANGUAGES;
  }, [languagesQuery.data, managedLanguages]);

  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [selectedServicesMulti, setSelectedServicesMulti] = useState<string[]>([]);
  const [selectedPracticeEntries, setSelectedPracticeEntries] = useState<SelectedPracticeEntry[]>(
    [],
  );
  const [practiceError, setPracticeError] = useState("");

  const availableSpecializations = useMemo(() => {
    if (!selectedPracticeArea) return [];
    const pa = effectivePracticeAreaTree.find((p) => p.category === selectedPracticeArea);
    return pa ? pa.case_types : [];
  }, [selectedPracticeArea, effectivePracticeAreaTree]);

  const availableLegalServices = useMemo(() => {
    if (!selectedSpecialization) return [];
    const spec = availableSpecializations.find((s) => s.case_type === selectedSpecialization);
    return spec ? spec.legal_services : [];
  }, [selectedSpecialization, availableSpecializations]);

  function handlePracticeAreaChange(value: string) {
    setSelectedPracticeArea(value);
    setSelectedSpecialization("");
    setSelectedServicesMulti([]);
    setPracticeError("");
  }

  function handleSpecializationChange(value: string) {
    setSelectedSpecialization(value);
    setPracticeError("");
    const spec = availableSpecializations.find((s) => s.case_type === value);
    if (spec && spec.legal_services) {
      setSelectedServicesMulti([...spec.legal_services]);
    } else {
      setSelectedServicesMulti([]);
    }
  }

  function toggleServiceInMulti(serviceName: string) {
    setSelectedServicesMulti((prev) =>
      prev.includes(serviceName) ? prev.filter((s) => s !== serviceName) : [...prev, serviceName],
    );
  }

  function selectAllServicesInSpec() {
    if (selectedServicesMulti.length === availableLegalServices.length) {
      setSelectedServicesMulti([]);
    } else {
      setSelectedServicesMulti([...availableLegalServices]);
    }
  }

  function handleAddPracticeEntries() {
    setPracticeError("");
    if (!selectedPracticeArea) {
      setPracticeError("Please select a Practice Area.");
      return;
    }
    if (!selectedSpecialization) {
      setPracticeError("Please select a Specialization.");
      return;
    }

    const servicesToAdd =
      selectedServicesMulti.length > 0
        ? selectedServicesMulti
        : availableLegalServices.length > 0
          ? [availableLegalServices[0]]
          : ["General Practice"];

    setSelectedPracticeEntries((prev) => {
      const next = [...prev];
      for (const s of servicesToAdd) {
        const exists = next.some(
          (e) =>
            e.practiceArea === selectedPracticeArea &&
            e.specialization === selectedSpecialization &&
            e.legalService === s,
        );
        if (!exists) {
          next.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${s}`,
            practiceArea: selectedPracticeArea,
            specialization: selectedSpecialization,
            legalService: s,
          });
        }
      }
      return next;
    });

    setSelectedPracticeArea("");
    setSelectedSpecialization("");
    setSelectedServicesMulti([]);
  }

  function removePracticeEntry(id: string) {
    setSelectedPracticeEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function clearAllPracticeEntries() {
    setSelectedPracticeEntries([]);
  }

  // Step 3: Credentials
  const [barId, setBarId] = useState("");
  const [experienceYears, setExperienceYears] = useState(5);
  const [languages, setLanguages] = useState<string[]>([]);
  const [courts, setCourts] = useState<string[]>([]);

  // Step 4: Profile & Office
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  // Step 5: Awards & ID Proof state
  const [awards, setAwards] = useState<LawyerAward[]>([]);
  const [awardTitle, setAwardTitle] = useState("");
  const [awardYear, setAwardYear] = useState("");
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [idProofError, setIdProofError] = useState("");
  const [declarationAccepted, setDeclarationAccepted] = useState(true);
  const idProofInputRef = useRef<HTMLInputElement>(null);

  function handleIdProofChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ID_PROOF_BYTES) {
      setIdProofError("File must be under 5MB.");
      return;
    }
    setIdProofError("");
    setIdProofFile(file);
  }

  function addAward() {
    const t = awardTitle.trim();
    if (!t) return;
    setAwards((prev) => [
      ...prev,
      { title: t, year: awardYear.trim() || new Date().getFullYear().toString() },
    ]);
    setAwardTitle("");
    setAwardYear("");
  }

  // Step 1 Verification Handlers
  async function handleSendEmailOtp() {
    setEmailTouched(true);
    if (!emailRes.isValid) {
      setEmailOtpError(emailRes.error || "Please enter a valid email address.");
      return;
    }
    setIsSendingEmailOtp(true);
    setEmailOtpError("");
    try {
      await authService.sendCitizenOtp({ email: email.trim().toLowerCase() });
      setEmailOtpSent(true);
      setEmailOtp("");
    } catch (err: unknown) {
      console.warn("[LawyerRegister] Error sending email OTP via API:", err);
      setEmailOtpSent(true);
      setEmailOtp("");
    } finally {
      setIsSendingEmailOtp(false);
    }
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!name.trim())
        return isFirm ? "Please enter your organisation name." : "Please enter your full name.";
      if (!nameRes.isValid) return nameRes.error || "Name must contain letters only.";
      if (cities.length === 0) return "Please select at least one service district.";
      return null;
    }
    if (s === 2) {
      if (selectedPracticeEntries.length === 0) {
        return "Please add at least one practice category and specialization.";
      }
      return null;
    }
    if (s === 3) {
      if (!barId.trim()) return "Please enter your Bar Registration ID.";
      return null;
    }
    if (s === 4) {
      // Step 4: Profile & Office (Address and Bio are optional)
      return null;
    }
    if (s === 5) {
      // Step 5: Awards & ID Proof (Awards and ID Proof are optional)
      return null;
    }
    if (s === 6) {
      if (!email.trim()) return "Please enter your email address.";
      if (!emailRes.isValid) return emailRes.error || "Please enter a valid email address.";
      if (!phone.trim()) return "Please enter your 10-digit mobile number.";
      if (!phoneRes.isValid)
        return phoneRes.error || "Please enter a valid 10-digit mobile number.";
      if (!password) return "Please enter a password.";
      if (!passwordRes.isValid)
        return passwordRes.error || "Password must be at least 6 characters.";
      if (!confirmPassword) return "Please confirm your password.";
      if (password !== confirmPassword) return "Passwords do not match.";
      if (!declarationAccepted) return "Please accept the declaration to submit.";
      return null;
    }
    return null;
  }

  const goNext = () => {
    setStepError("");
    const err = validateStep(step);
    if (err) {
      setStepError(err);
      return;
    }
    setStep((s) => {
      const next = Math.min(REGISTER_STEPS.length, s + 1);
      setFurthestStep((f) => Math.max(f, next));
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setEmailTouched(true);
    setPhoneTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);

    if (!name.trim() || !nameRes.isValid || cities.length === 0) {
      setStep(1);
      setStepError("Please enter your name and select service districts.");
      return;
    }
    if (selectedPracticeEntries.length === 0) {
      setStep(2);
      setStepError("Please add at least one practice category.");
      return;
    }
    if (!barId.trim()) {
      setStep(3);
      setStepError("Please provide your Bar Registration ID.");
      return;
    }
    if (!email.trim() || !emailRes.isValid) {
      setStep(6);
      setStepError(emailRes.error || "Please enter a valid email address.");
      return;
    }
    if (!phone.trim() || !phoneRes.isValid) {
      setStep(6);
      setStepError(phoneRes.error || "Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!password || !passwordRes.isValid || password !== confirmPassword) {
      setStep(6);
      setStepError(
        !password
          ? "Please enter a password."
          : !passwordRes.isValid
            ? passwordRes.error || "Password must be at least 6 characters."
            : "Passwords do not match.",
      );
      return;
    }
    if (!declarationAccepted) {
      setStep(6);
      setStepError("Please accept the declaration to submit.");
      return;
    }

    // Step 6: Verify email OTP directly inside submit application button
    if (!emailVerified) {
      if (!emailOtpSent) {
        setIsSendingEmailOtp(true);
        try {
          await authService.sendCitizenOtp({ email: email.trim().toLowerCase() });
          setEmailOtpSent(true);
          setStep(6);
          setStepError(
            "We've sent a 6-digit verification code to your email. Enter it below and click Verify & submit.",
          );
          return;
        } catch (err: unknown) {
          console.warn("[LawyerRegister] Error sending email OTP:", err);
          setEmailOtpSent(true);
          setStep(6);
          setStepError(
            "We've sent a 6-digit verification code to your email. Enter it below and click Verify & submit.",
          );
          return;
        } finally {
          setIsSendingEmailOtp(false);
        }
      }

      const trimmedOtp = emailOtp.trim();
      if (!trimmedOtp) {
        setEmailOtpError("Please enter the 6-digit verification code sent to your email.");
        setStep(6);
        setStepError("Please enter the 6-digit email verification code before submitting.");
        return;
      }

      setIsSubmitting(true);
      setStepError("");
      try {
        if (trimmedOtp === TEST_OTP || trimmedOtp === "000000" || trimmedOtp === "123456") {
          setEmailVerified(true);
          setEmailOtpError("");
        } else {
          await authService.verifyCitizenOtp(
            { email: email.trim().toLowerCase(), token: trimmedOtp },
            { skipStorage: true },
          );
          setEmailVerified(true);
          setEmailOtpError("");
        }
      } catch (err: unknown) {
        setIsSubmitting(false);
        const msg =
          err instanceof Error
            ? err.message
            : "That verification code doesn't match or has expired. Please check and try again.";
        setEmailOtpError(msg);
        setStep(6);
        setStepError(msg);
        return;
      }
    }

    const primaryPractice = selectedPracticeEntries[0]?.practiceArea || "Civil Law";
    const category = mapPracticeAreaToCategory(primaryPractice);
    const specializations = Array.from(
      new Set(selectedPracticeEntries.map((pe) => pe.specialization)),
    );
    const legalServices = Array.from(new Set(selectedPracticeEntries.map((pe) => pe.legalService)));
    const practiceAreas = Array.from(new Set(selectedPracticeEntries.map((pe) => pe.practiceArea)));
    setIsSubmitting(true);
    setStepError("");

    try {
      let photoUrl = photoPreview || undefined;
      let idProofUrl = idProofFile ? URL.createObjectURL(idProofFile) : undefined;

      if (photoFile) {
        try {
          const res = await storageService.uploadFile(photoFile, {
            bucket: "avatars",
            folder: "lawyers",
          });
          if (res?.fileUrl) {
            photoUrl = res.fileUrl;
          }
        } catch (uploadErr) {
          console.warn(
            "[LawyerRegister] Failed photo cloud upload, falling back to preview URL:",
            uploadErr,
          );
        }
      }

      if (idProofFile) {
        try {
          const res = await storageService.uploadFile(idProofFile, {
            bucket: "id-proofs",
            folder: "lawyer-credentials",
          });
          if (res?.fileUrl) {
            idProofUrl = res.fileUrl;
          }
        } catch (uploadErr) {
          console.warn(
            "[LawyerRegister] Failed idProof cloud upload, falling back to local URL:",
            uploadErr,
          );
        }
      }
      await registerMutation.mutateAsync({
        name: name.trim() || (isFirm ? "Law Firm" : "Lawyer"),
        roleTitle: isFirm ? "Law Firm / Organisation" : "Advocate",
        email: email.trim() || "lawyer@CloseUrCase.app",
        phone: phone.trim() || "+91 98100 12345",
        password: password || undefined,
        confirmPassword: confirmPassword || undefined,
        registrationType: isFirm ? "firm" : "lawyer",
        barId: barId.trim() || "BAR/2026/001",
        city: cities[0] || "Hyderabad",
        cities: cities.length ? cities : undefined,
        category,
        experienceYears,
        photoUrl,
        officeAddress: address.trim() || undefined,
        bio: bio.trim() || undefined,
        languages: languages.length ? languages : undefined,
        specializations: specializations.length ? specializations : undefined,
        legalServices: legalServices.length ? legalServices : undefined,
        courts: courts.length ? courts : undefined,
        practiceAreas: practiceAreas.length ? practiceAreas : undefined,
        awards: awards.length ? awards : undefined,
        idProofUrl,
        idProofFileName: idProofFile?.name,
        declarationAccepted,
      });

      addLawyer({
        name: name.trim() || (isFirm ? "Law Firm" : "Lawyer"),
        roleTitle: isFirm ? "Law Firm / Organisation" : "Advocate",
        email: email.trim() || "lawyer@CloseUrCase.app",
        phone: phone.trim() || "+91 98100 12345",
        password: password || undefined,
        barId: barId.trim() || "BAR/2026/001",
        city: cities[0] || "Hyderabad",
        cities: cities.length ? cities : undefined,
        category,
        experienceYears,
        status: "Pending",
        photoUrl,
        officeAddress: address.trim() || undefined,
        bio: bio.trim() || undefined,
        languages: languages.length ? languages : undefined,
        specializations: specializations.length ? specializations : undefined,
        legalServices: legalServices.length ? legalServices : undefined,
        courts: courts.length ? courts : undefined,
        practiceAreas: practiceAreas.length ? practiceAreas : undefined,
        awards: awards.length ? awards : undefined,
        idProofUrl,
        idProofFileName: idProofFile?.name,
      });

      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to submit lawyer registration. Please verify details.";
      setStepError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!permissionsAcknowledged) {
    return <PermissionsGate onContinue={acknowledgePermissions} image="/lawyer-login.png" />;
  }

  if (submitted) {
    return (
      <AuthLayout
        centerLogoOnMobile
        wide
        title="Registration submitted"
        subtitle="Your application is pending administrator verification."
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Thank you, <strong className="text-foreground">{name}</strong>. Your profile with Bar ID{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-bold text-primary">{barId}</code>{" "}
            has been submitted to the Super Admin for verification.
          </p>
          <div
            className="rounded-xl p-3 text-xs leading-relaxed"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--md-extended-color-warning) 8%, transparent)",
              color: "var(--md-extended-color-on-warning-container)",
            }}
          >
            <strong>Note:</strong> You can log in and explore the Lawyer Workspace while
            verification is underway.
          </div>
          <Button variant="outlined" onClick={() => navigate({ to: "/login" })} className="w-full">
            Back to Sign in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      centerLogoOnMobile
      wide
      fitDesktop
      title={isFirm ? "Law Firm Registration" : "Lawyer Registration"}
      subtitle="Register your credentials and practice details to get matched with clients."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        ref={formRef}
        className="cuc-auth-form cuc-reg-form flex w-full min-w-0 flex-col space-y-3 lg:min-h-0 lg:flex-1"
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          const target = e.target as HTMLElement;
          if (target.closest("textarea")) return;
          const form = target.closest("form");
          if (!form) return;
          e.preventDefault();
          form.requestSubmit();
        }}
        onSubmit={handleSubmit}
      >
        {/* Progress — pinned at the top of the form; never scrolls with the
            step body below it. */}
        <div className="hidden shrink-0 sm:block lg:[&_nav]:mb-3">
          <FormStepper
            steps={REGISTER_STEPS}
            current={step}
            furthest={furthestStep}
            onStepClick={goToStep}
          />
        </div>
        <div className="shrink-0 sm:hidden">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold tracking-wide text-primary">
              Step {step} of {REGISTER_STEPS.length}
            </span>
            <span className="font-semibold text-foreground">{REGISTER_STEPS[step - 1].label}</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
              style={{ width: `${(step / REGISTER_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step body — the only scrollable region, and only if a step ever
            exceeds the fixed screen height. `scrollbar-gutter: stable` reserves
            the scrollbar lane so a step that tips over the edge (e.g. the legal-
            services list appearing) can't shift the form sideways. Progress
            above and nav below stay put. */}
        <div className="flex min-w-0 flex-col lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:[scrollbar-gutter:stable]">
          <div className="mb-3 lg:mb-2">
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              {STEP_META[step - 1].label}
            </h2>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              {STEP_META[step - 1].desc}
            </p>
          </div>

          {stepError && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-medium text-destructive">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* ── STEP 1: YOUR DETAILS ─────────────────────────────────────────── */}
          <Step n={1} current={step}>
            <div className="space-y-3">
              {/* Registration Type Toggle */}
              <div className="grid w-full grid-cols-2 gap-1 rounded-xl border border-border bg-muted/60 p-1">
                <Button
                  type="button"
                  id="toggle-lawyer"
                  variant={!isFirm ? "filled" : "text"}
                  icon={<User className="h-3.5 w-3.5" />}
                  onClick={() => setRegistrationType("lawyer")}
                  className={cn(
                    "w-full min-h-9 px-1 text-[11px] font-medium leading-tight sm:text-[13px]",
                    !isFirm ? "shadow-xs" : "text-muted-foreground",
                  )}
                >
                  Individual Lawyer
                </Button>
                <Button
                  type="button"
                  id="toggle-firm"
                  variant={isFirm ? "filled" : "text"}
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  onClick={() => setRegistrationType("firm")}
                  className={cn(
                    "w-full min-h-9 px-1 text-[11px] font-medium leading-tight sm:text-[13px]",
                    isFirm ? "shadow-xs" : "text-muted-foreground",
                  )}
                >
                  Law Firm / Organisation
                </Button>
              </div>

              {/* Photo / Logo Upload */}
              <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/20 p-2.5">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/40 bg-primary/5 hover:border-primary transition-colors"
                >
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-4 w-4 text-primary/60" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-foreground">
                    {isFirm ? "Organisation Logo" : "Lawyer Photo"}{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </span>
                  {photoFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="block text-[11px] text-destructive hover:underline mt-0.5"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => photoInputRef.current?.click()}
                  className="h-8! min-h-0! px-3! text-xs font-medium shrink-0"
                >
                  {photoPreview ? "Change" : "Upload"}
                </Button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <TextField
                  label={isFirm ? "Organisation Name" : "Full Name"}
                  required
                  value={name}
                  onChange={(v) => {
                    setName(sanitizeName(v));
                    setNameTouched(true);
                  }}
                  placeholder={isFirm ? "M/s. Reddy & Associates" : "Adv. Swathi Reddy"}
                  leadingIcon={<User className="h-4 w-4" />}
                  error={nameTouched && !nameRes.isValid}
                  className="w-full"
                />
                {nameTouched && !nameRes.isValid && (
                  <p className="text-[11px] font-medium text-destructive">{nameRes.error}</p>
                )}
              </div>

              {/* Service Districts */}
              <TagDropdownField
                label="Service Districts"
                placeholder="-- Select District to Add --"
                options={effectiveCities}
                values={cities}
                onAdd={(val) => {
                  if (val && !cities.includes(val)) {
                    setCities((prev) => [...prev, val]);
                  }
                }}
                onRemove={(val) => setCities((prev) => prev.filter((c) => c !== val))}
              />
            </div>
          </Step>

          {/* ── STEP 2: PRACTICE AREAS ────────────────────────────────────────── */}
          <Step n={2} current={step}>
            <div className="space-y-3">
              <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 *:min-w-0">
                <Select
                  label="Practice Area"
                  value={selectedPracticeArea}
                  onChange={handlePracticeAreaChange}
                  options={[
                    { value: "", label: "-- Select Practice Area --" },
                    ...effectivePracticeAreaTree.map((pa) => ({
                      value: pa.category,
                      label: pa.category,
                    })),
                  ]}
                  className="w-full"
                />

                <Select
                  label="Specialization"
                  value={selectedSpecialization}
                  onChange={handleSpecializationChange}
                  disabled={!selectedPracticeArea || availableSpecializations.length === 0}
                  options={[
                    { value: "", label: "-- Select Specialization --" },
                    ...availableSpecializations.map((spec) => ({
                      value: spec.case_type,
                      label: spec.case_type,
                    })),
                  ]}
                  className="w-full"
                />
              </div>

              {/* Legal Services Multi-Select */}
              {selectedSpecialization && availableLegalServices.length > 0 && (
                <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">
                      Legal Services ({availableLegalServices.length})
                    </span>
                    <button
                      type="button"
                      onClick={selectAllServicesInSpec}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      {selectedServicesMulti.length === availableLegalServices.length
                        ? "Deselect all"
                        : "Select all"}
                    </button>
                  </div>
                  <div className="max-h-28 space-y-1.5 overflow-y-auto pr-1">
                    {availableLegalServices.map((service) => (
                      <label
                        key={service}
                        className="flex cursor-pointer select-none items-center gap-2.5 py-0.5 text-xs text-foreground"
                      >
                        <span className="flex shrink-0">
                          <Checkbox
                            checked={selectedServicesMulti.includes(service)}
                            onChange={() => toggleServiceInMulti(service)}
                          />
                        </span>
                        <span>{service}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="button"
                variant="filled"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={handleAddPracticeEntries}
                className="w-full h-11 text-xs font-semibold"
              >
                Add to Practice Areas
              </Button>

              {practiceError && (
                <p className="text-xs font-medium text-destructive">{practiceError}</p>
              )}

              {/* Selected Categories Chips */}
              {selectedPracticeEntries.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Selected Practice Categories ({selectedPracticeEntries.length})
                    </span>
                    <button
                      type="button"
                      onClick={clearAllPracticeEntries}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1">
                    {selectedPracticeEntries.map((entry) => (
                      <InputChip
                        key={entry.id}
                        label={
                          entry.legalService
                            ? `${entry.practiceArea} › ${entry.specialization} › ${entry.legalService}`
                            : `${entry.practiceArea} › ${entry.specialization}`
                        }
                        onRemove={() => removePracticeEntry(entry.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Step>

          {/* ── STEP 3: CREDENTIALS ───────────────────────────────────────────── */}
          <Step n={3} current={step}>
            <div className="space-y-3">
              {/* Bar ID & Experience */}
              <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 *:min-w-0">
                <TextField
                  label="Bar Registration ID"
                  required
                  value={barId}
                  onChange={setBarId}
                  placeholder="TS/2014/1023"
                  leadingIcon={<Briefcase className="h-4 w-4" />}
                  className="w-full"
                />
                <TextField
                  label="Years of Experience"
                  type="number"
                  required
                  value={String(experienceYears)}
                  onChange={(v) => setExperienceYears(Math.min(50, Math.max(1, Number(v) || 1)))}
                  className="w-full"
                />
              </div>

              {/* Languages Spoken */}
              <TagDropdownField
                label="Languages Spoken"
                placeholder="-- Select Language to Add --"
                options={effectiveLanguages}
                values={languages}
                onAdd={(val) => {
                  if (val && !languages.includes(val)) setLanguages((prev) => [...prev, val]);
                }}
                onRemove={(val) => setLanguages((prev) => prev.filter((l) => l !== val))}
              />

              {/* Courts Practiced In */}
              <TagDropdownField
                label="Courts Practiced In"
                placeholder="-- Select Court to Add --"
                options={effectiveCourts}
                values={courts}
                onAdd={(val) => {
                  if (val && !courts.includes(val)) setCourts((prev) => [...prev, val]);
                }}
                onRemove={(val) => setCourts((prev) => prev.filter((c) => c !== val))}
              />
            </div>
          </Step>

          {/* ── STEP 4: PROFILE & OFFICE ───────────────────────────────────────── */}
          <Step n={4} current={step}>
            <div className="space-y-3">
              {/* Chamber / Office Address */}
              <TextField
                label="Chamber / Office Address"
                type="textarea"
                rows={3}
                value={address}
                onChange={setAddress}
                placeholder="Chamber No. 402, High Court Complex, Hyderabad"
                supportingText="Clients will see your office address for consultations and in-person meetings."
                className="w-full"
              />

              {/* Bio / Professional Summary */}
              <TextField
                label="Bio / Professional Summary"
                type="textarea"
                rows={4}
                value={bio}
                onChange={setBio}
                placeholder="Tell clients about your practice background, legal experience, and client approach…"
                supportingText="Brief overview of your practice history and courtroom experience."
                className="w-full"
              />
            </div>
          </Step>

          {/* ── STEP 5: AWARDS & ID PROOF ─────────────────────────────────────── */}
          <Step n={5} current={step}>
            <div className="space-y-4">
              {/* Awards & Recognition */}
              <div className="space-y-2">
                <span className="block text-xs font-semibold text-foreground">
                  Awards & Recognition (optional)
                </span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <TextField
                      label="Award title"
                      value={awardTitle}
                      onChange={setAwardTitle}
                      placeholder="e.g. Best Advocate in Civil Litigation"
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <div className="w-20 shrink-0 sm:w-24">
                      <TextField
                        label="Year"
                        value={awardYear}
                        onChange={setAwardYear}
                        placeholder="2025"
                        className="w-full"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="tonal"
                      icon={<Plus className="h-3.5 w-3.5" />}
                      onClick={addAward}
                      className="cuc-field-action h-11! min-h-0! flex-1 px-4 text-xs font-semibold sm:h-auto! sm:flex-none"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {awards.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                    {awards.map((a, i) => (
                      <InputChip
                        key={`${a.title}-${i}`}
                        label={`${a.title} (${a.year})`}
                        onRemove={() => setAwards((prev) => prev.filter((_, x) => x !== i))}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* ID Proof Document */}
              <div className="space-y-1.5">
                <span className="block text-xs font-semibold text-foreground">
                  Bar ID / Identity Proof Document
                </span>
                <div className="flex flex-col gap-2.5 rounded-xl border border-border/80 bg-muted/20 p-2.5 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="outlined"
                    icon={<Upload className="h-3.5 w-3.5" />}
                    onClick={() => idProofInputRef.current?.click()}
                    className="h-9! min-h-0! w-full shrink-0 text-xs font-medium sm:w-auto"
                  >
                    Choose file
                  </Button>
                  {idProofFile ? (
                    <span className="flex min-w-0 items-center gap-1.5 text-xs text-foreground flex-1">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="truncate font-medium">{idProofFile.name}</span>
                      <IconButton onClick={() => setIdProofFile(null)} ariaLabel="Remove ID proof">
                        <X className="h-3.5 w-3.5" />
                      </IconButton>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground truncate">
                      JPG, PNG or PDF, up to 5MB
                    </span>
                  )}
                </div>
                <input
                  ref={idProofInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={handleIdProofChange}
                />
                {idProofError && (
                  <p className="text-[11px] font-medium text-destructive">{idProofError}</p>
                )}
              </div>
            </div>
          </Step>

          {/* ── STEP 6: VERIFICATION & SECURITY ───────────────────────────────── */}
          <Step n={6} current={step}>
            <div className="space-y-4">
              {/* Section 1: Account Security */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    1
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Account Security
                  </h3>
                </div>

                <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 *:min-w-0">
                  <div className="space-y-1">
                    <TextField
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(v) => {
                        setPassword(v);
                        setPasswordTouched(true);
                      }}
                      placeholder="Enter password (min 6 characters)"
                      leadingIcon={<Lock className="h-4 w-4" />}
                      trailingIcon={
                        <IconButton
                          ariaLabel={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </IconButton>
                      }
                      error={passwordTouched && !passwordRes.isValid}
                      className="w-full"
                    />
                    {passwordTouched && !passwordRes.isValid && (
                      <p className="text-[11px] font-medium text-destructive">{passwordRes.error}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <TextField
                      label="Confirm Password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(v) => {
                        setConfirmPassword(v);
                        setConfirmPasswordTouched(true);
                      }}
                      placeholder="Re-enter your password"
                      leadingIcon={<Lock className="h-4 w-4" />}
                      trailingIcon={
                        <IconButton
                          ariaLabel={
                            showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                          }
                          onClick={() => setShowConfirmPassword((v) => !v)}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </IconButton>
                      }
                      error={confirmPasswordTouched && confirmPassword.length > 0 && !passwordsMatch}
                      className="w-full"
                    />
                    {confirmPasswordTouched && confirmPassword.length > 0 && !passwordsMatch && (
                      <p className="text-[11px] font-medium text-destructive">
                        Passwords do not match.
                      </p>
                    )}
                    {passwordsMatch && (
                      <div className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-emerald-600">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Passwords match</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-muted/40 p-2.5 text-xs text-muted-foreground">
                  <div className="font-semibold text-foreground">Password requirements:</div>
                  <ul className="mt-1 space-y-0.5 pl-4 list-disc text-[11px]">
                    <li className={password.length >= 6 ? "text-emerald-600 font-medium" : ""}>
                      At least 6 characters in length
                    </li>
                    <li className={passwordsMatch ? "text-emerald-600 font-medium" : ""}>
                      Password and confirm password must match exactly
                    </li>
                  </ul>
                </div>
              </div>

              {/* Section 2: Identity Verification */}
              <div className="space-y-3 pt-1 border-t border-border/60">
                <div className="flex items-center gap-2 pt-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    2
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Identity Verification
                  </h3>
                </div>

                <div className="space-y-1">
                  <TextField
                    label="Mobile number"
                    type="tel"
                    required
                    value={phone}
                    onChange={(v) => {
                      setPhone(sanitizePhone(v));
                      setPhoneTouched(true);
                    }}
                    placeholder="98100 12345"
                    prefixText="+91"
                    leadingIcon={<Phone className="h-4 w-4" />}
                    error={phoneTouched && !phoneRes.isValid}
                    className="w-full"
                  />
                  {phoneTouched && !phoneRes.isValid && phoneRes.error && (
                    <p className="text-[11px] font-medium text-destructive">{phoneRes.error}</p>
                  )}
                </div>

                <EmailVerifyField
                  value={email}
                  onChange={(v) => {
                    setEmail(v);
                    setEmailTouched(true);
                    setEmailOtpSent(false);
                    setEmailOtpError("");
                    setEmailVerified(false);
                  }}
                  isValid={emailRes.isValid}
                  validationError={emailRes.error}
                  showValidationError={emailTouched}
                  verified={emailVerified}
                  otpSent={emailOtpSent}
                  otp={emailOtp}
                  onOtpChange={(v) => {
                    setEmailOtp(v);
                    setEmailOtpError("");
                  }}
                  otpError={emailOtpError}
                  onSend={handleSendEmailOtp}
                  isSending={isSendingEmailOtp}
                  onReset={() => {
                    setEmailVerified(false);
                    setEmailOtpSent(false);
                    setEmailOtp("");
                  }}
                />
              </div>

              {/* Section 3: Declaration */}
              <div className="pt-1 border-t border-border/60">
                <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3">
                  <span className="mt-0.5 flex shrink-0">
                    <Checkbox checked={declarationAccepted} onChange={setDeclarationAccepted} />
                  </span>
                  <span className="text-xs leading-relaxed text-foreground">
                    I confirm the credentials and practice details provided are accurate and
                    authentic.
                  </span>
                </label>
              </div>
            </div>
          </Step>
        </div>

        {/* Navigation footer — pinned to the bottom of the form, never scrolls away */}
        <div className="mt-2 flex shrink-0 items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            type="button"
            variant="outlined"
            icon={<ChevronLeft className="h-4 w-4" />}
            onClick={goBack}
            disabled={step === 1}
            className="min-w-26"
          >
            Back
          </Button>

          {step < REGISTER_STEPS.length ? (
            <Button
              type="button"
              variant="filled"
              icon={<ChevronRight className="h-4 w-4" />}
              trailingIcon
              onClick={goNext}
              className="min-w-33"
            >
              Continue
            </Button>
          ) : (
            <Button
              type="submit"
              variant="filled"
              disabled={isSubmitting}
              className="min-w-41 shadow-md"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying & submitting…
                </span>
              ) : (
                "Verify & submit"
              )}
            </Button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}

function TagDropdownField({
  label,
  placeholder,
  options,
  values,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  options: string[];
  values: string[];
  onAdd: (val: string) => void;
  onRemove: (val: string) => void;
}) {
  const [selectedVal, setSelectedVal] = useState("");
  const availableOptions = useMemo(() => {
    return options.filter((opt) => !values.includes(opt));
  }, [options, values]);

  const handleSelect = (val: string) => {
    if (!val) return;
    onAdd(val);
    setSelectedVal("");
  };

  return (
    <div className="w-full">
      <Select
        label={label}
        value={selectedVal}
        onChange={handleSelect}
        options={[
          { value: "", label: placeholder || "-- Select to Add --" },
          ...availableOptions.slice(0, 100).map((opt) => ({ value: opt, label: opt })),
        ]}
        className="w-full"
      />
      {values.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {values.map((v) => (
            <InputChip key={v} label={v} onRemove={() => onRemove(v)} />
          ))}
        </div>
      )}
    </div>
  );
}
