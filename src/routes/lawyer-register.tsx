import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState, useEffect } from "react";
import type { ReactNode } from "react";
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
  {
    label: "Verify your identity",
    desc: "Confirm your official email and mobile number to begin.",
  },
  {
    label: "Security",
    desc: "Set up a secure password to access your lawyer portal.",
  },
  { label: "Your details", desc: "Tell us who you are and where you practise." },
  {
    label: "Practice areas",
    desc: "Choose the categories, specialisations and services you handle.",
  },
  {
    label: "Credentials",
    desc: "Add your Bar registration, experience and professional background.",
  },
  { label: "Review & submit", desc: "Add finishing details, then submit for admin verification." },
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
  head: () => ({ meta: [{ title: "Lawyer registration — CloseUrCase" }] }),
  component: LawyerRegister,
});

/** 6 Dedicated Steps:
 * 1. Verification (Email & Mobile Phone verification with OTP)
 * 2. Security (Password & Confirm Password credentials)
 * 3. Your details (Registration type, Photo, Full Name, Service Districts)
 * 4. Practice areas (3-tier categories, specializations, legal services)
 * 5. Credentials (Bar ID, Experience, Languages, Courts, Address, Bio)
 * 6. Submit (Awards, ID proof, Declaration, Submit application)
 */
const REGISTER_STEPS: FormStep[] = [
  { id: 1, label: "Verification" },
  { id: 2, label: "Security" },
  { id: 3, label: "Your details" },
  { id: 4, label: "Practice areas" },
  { id: 5, label: "Credentials" },
  { id: 6, label: "Submit" },
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
function VerifyField({
  icon,
  title,
  fieldLabel,
  type,
  value,
  onChange,
  placeholder,
  prefixText,
  displayValue,
  isValid,
  validationError,
  showValidationError,
  verified,
  otpSent,
  otp,
  onOtpChange,
  otpError,
  onSend,
  onConfirm,
  onReset,
}: {
  icon: ReactNode;
  title: string;
  fieldLabel: string;
  type: "email" | "tel";
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  prefixText?: string;
  displayValue: string;
  isValid: boolean;
  validationError?: string;
  showValidationError: boolean;
  verified: boolean;
  otpSent: boolean;
  otp: string;
  onOtpChange: (v: string) => void;
  otpError: string;
  onSend: () => void;
  onConfirm: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 shadow-xs sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="text-primary">{icon}</span>
          {title}
          <span className="text-destructive">*</span>
        </span>
        {verified && <VerifiedPill />}
      </div>

      {verified ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5">
          <span className="min-w-0 truncate text-sm font-medium text-foreground">
            {displayValue}
          </span>
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
                label={fieldLabel}
                type={type}
                required
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                prefixText={prefixText}
                error={showValidationError && !isValid}
                className="w-full"
              />
            </div>
            <Button
              type="button"
              variant="outlined"
              onClick={onSend}
              className="cuc-field-action h-11! min-h-0! w-full shrink-0 px-5 text-[13px] font-semibold sm:h-auto! sm:w-auto"
            >
              {otpSent ? "Resend code" : "Send code"}
            </Button>
          </div>

          {showValidationError && !isValid && validationError && (
            <p className="text-xs font-medium text-destructive">{validationError}</p>
          )}

          {otpSent && (
            <div className="animate-in fade-in slide-in-from-top-1 space-y-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3.5 duration-200">
              <p className="text-center text-xs font-medium text-foreground">
                Enter the 4-digit code sent to you
              </p>
              <div className="flex flex-col items-center gap-3">
                <OtpInput
                  length={4}
                  value={otp}
                  onChange={onOtpChange}
                  error={!!otpError}
                  ariaLabel={`${title} verification code`}
                  className="justify-center"
                />
                <Button
                  type="button"
                  variant="filled"
                  onClick={onConfirm}
                  className="h-11! min-h-0! w-full px-8 text-[13px] font-semibold sm:w-auto"
                >
                  Verify
                </Button>
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
  const [submitted, setSubmitted] = useState(false);
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  const [step, setStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [stepError, setStepError] = useState("");

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

  // Step 1: Verification
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailOtpError, setEmailOtpError] = useState("");

  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpError, setPhoneOtpError] = useState("");

  const emailRes = validateEmail(email);
  const phoneRes = validatePhone(phone);

  // Step 2: Security
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordRes = validatePassword(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  // Step 3: Your details
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

  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [selectedServicesMulti, setSelectedServicesMulti] = useState<string[]>([]);
  const [selectedPracticeEntries, setSelectedPracticeEntries] = useState<SelectedPracticeEntry[]>(
    [],
  );
  const [practiceError, setPracticeError] = useState("");

  const availableSpecializations = useMemo(() => {
    if (!selectedPracticeArea) return [];
    const pa = practiceAreaTree.find((p) => p.category === selectedPracticeArea);
    return pa ? pa.case_types : [];
  }, [selectedPracticeArea, practiceAreaTree]);

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

  // Step 4: Credentials
  const [barId, setBarId] = useState("");
  const [experienceYears, setExperienceYears] = useState(5);
  const [languages, setLanguages] = useState<string[]>([]);
  const [courts, setCourts] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");

  // Step 5: Submit
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
  function handleSendEmailOtp() {
    setEmailTouched(true);
    if (!emailRes.isValid) {
      setEmailOtpError(emailRes.error || "Please enter a valid email address.");
      return;
    }
    setEmailOtpSent(true);
    setEmailOtpError("");
    setEmailOtp("");
  }

  function handleVerifyEmailOtp() {
    if (emailOtp.trim() === TEST_OTP) {
      setEmailVerified(true);
      setEmailOtpSent(false);
      setEmailOtpError("");
      setStepError("");
    } else {
      setEmailOtpError("That code doesn't match. Please check and try again.");
    }
  }

  function handleSendPhoneOtp() {
    setPhoneTouched(true);
    if (!phoneRes.isValid) {
      setPhoneOtpError(phoneRes.error || "Please enter a valid 10-digit mobile number.");
      return;
    }
    setPhoneOtpSent(true);
    setPhoneOtpError("");
    setPhoneOtp("");
  }

  function handleVerifyPhoneOtp() {
    if (phoneOtp.trim() === TEST_OTP) {
      setPhoneVerified(true);
      setPhoneOtpSent(false);
      setPhoneOtpError("");
      setStepError("");
    } else {
      setPhoneOtpError("That code doesn't match. Please check and try again.");
    }
  }

  function validateStep(s: number): string | null {
    if (s === 1) {
      if (!email.trim()) return "Please enter your email address.";
      if (!emailRes.isValid) return emailRes.error || "Please enter a valid email address.";
      if (!emailVerified) return "Please verify your email address to continue.";
      if (!phone.trim()) return "Please enter your 10-digit mobile number.";
      if (!phoneRes.isValid)
        return phoneRes.error || "Please enter a valid 10-digit mobile number.";
      if (!phoneVerified) return "Please verify your mobile number to continue.";
      return null;
    }
    if (s === 2) {
      if (!password) return "Please enter a password.";
      if (!passwordRes.isValid) return passwordRes.error || "Password must be at least 6 characters.";
      if (!confirmPassword) return "Please confirm your password.";
      if (password !== confirmPassword) return "Passwords do not match.";
      return null;
    }
    if (s === 3) {
      if (!name.trim())
        return isFirm ? "Please enter your organisation name." : "Please enter your full name.";
      if (!nameRes.isValid) return nameRes.error || "Name must contain letters only.";
      if (cities.length === 0) return "Please select at least one service district.";
      return null;
    }
    if (s === 4) {
      if (selectedPracticeEntries.length === 0) {
        return "Please add at least one practice category and specialization.";
      }
      return null;
    }
    if (s === 5) {
      if (!barId.trim()) return "Please enter your Bar Registration ID.";
      return null;
    }
    if (s === 6) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPhoneTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setNameTouched(true);

    if (!emailVerified || !phoneVerified) {
      setStep(1);
      setStepError("Please verify your email and mobile number.");
      return;
    }
    if (!password || !passwordRes.isValid || password !== confirmPassword) {
      setStep(2);
      setStepError(
        !password
          ? "Please enter a password."
          : !passwordRes.isValid
            ? passwordRes.error || "Password must be at least 6 characters."
            : "Passwords do not match.",
      );
      return;
    }
    if (!name.trim() || !nameRes.isValid || cities.length === 0) {
      setStep(3);
      setStepError("Please enter your name and select service districts.");
      return;
    }
    if (selectedPracticeEntries.length === 0) {
      setStep(4);
      setStepError("Please add at least one practice category.");
      return;
    }
    if (!barId.trim()) {
      setStep(5);
      setStepError("Please provide your Bar Registration ID.");
      return;
    }
    if (!declarationAccepted) {
      setStep(6);
      setStepError("Please accept the declaration to submit.");
      return;
    }

    const primaryPractice = selectedPracticeEntries[0]?.practiceArea || "Civil Law";
    const category = mapPracticeAreaToCategory(primaryPractice);
    const specializations = Array.from(
      new Set(selectedPracticeEntries.map((pe) => pe.specialization)),
    );
    const legalServices = Array.from(new Set(selectedPracticeEntries.map((pe) => pe.legalService)));
    const practiceAreas = Array.from(new Set(selectedPracticeEntries.map((pe) => pe.practiceArea)));
    const photoUrl = photoPreview || undefined;
    const idProofUrl = idProofFile ? URL.createObjectURL(idProofFile) : undefined;

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
      practiceAreas: practiceAreas.length
        ? practiceAreas.map((name, i) => ({ name, proficiency: Math.max(60, 95 - i * 5) }))
        : undefined,
      awards: awards.length ? awards : undefined,
      idProofUrl,
      idProofFileName: idProofFile?.name,
    });
    setSubmitted(true);
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

          {/* ── STEP 1: VERIFICATION ─────────────────────────────────────────── */}
          <Step n={1} current={step}>
            <div className="space-y-3">
              <VerifyField
                icon={<Mail className="h-4 w-4" />}
                title="Official email address"
                fieldLabel="Email address"
                type="email"
                value={email}
                onChange={(v) => {
                  setEmail(v);
                  setEmailTouched(true);
                  setEmailOtpSent(false);
                  setEmailOtpError("");
                }}
                placeholder="advocate@example.com"
                displayValue={email}
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
                onConfirm={handleVerifyEmailOtp}
                onReset={() => {
                  setEmailVerified(false);
                  setEmailOtpSent(false);
                  setEmailOtp("");
                }}
              />

              <VerifyField
                icon={<Phone className="h-4 w-4" />}
                title="Mobile number"
                fieldLabel="Mobile number"
                type="tel"
                value={phone}
                onChange={(v) => {
                  setPhone(sanitizePhone(v));
                  setPhoneTouched(true);
                  setPhoneOtpSent(false);
                  setPhoneOtpError("");
                }}
                placeholder="98100 12345"
                prefixText="+91"
                displayValue={`+91 ${phone}`}
                isValid={phoneRes.isValid}
                validationError={phoneRes.error}
                showValidationError={phoneTouched}
                verified={phoneVerified}
                otpSent={phoneOtpSent}
                otp={phoneOtp}
                onOtpChange={(v) => {
                  setPhoneOtp(v);
                  setPhoneOtpError("");
                }}
                otpError={phoneOtpError}
                onSend={handleSendPhoneOtp}
                onConfirm={handleVerifyPhoneOtp}
                onReset={() => {
                  setPhoneVerified(false);
                  setPhoneOtpSent(false);
                  setPhoneOtp("");
                }}
              />

              <p className="text-xs leading-relaxed text-muted-foreground">
                We'll send a one-time code to each. Both must be verified before you continue.
              </p>
            </div>
          </Step>

          {/* ══════════════════════════════════════════════════════════════════════
            STEP 2: SECURITY
           ══════════════════════════════════════════════════════════════════════ */}
          <Step n={2} current={step}>
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-xs sm:p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground">Create account password</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    Set up your login password. You will use your verified email (<span className="font-medium text-foreground">{email || "your email"}</span>) and this password to sign in to your Lawyer Workspace.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
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
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        ariaLabel={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                        onClick={() => setShowConfirmPassword((v) => !v)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </IconButton>
                    }
                    error={confirmPasswordTouched && confirmPassword.length > 0 && !passwordsMatch}
                    className="w-full"
                  />
                  {confirmPasswordTouched && confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-[11px] font-medium text-destructive">Passwords do not match.</p>
                  )}
                  {passwordsMatch && (
                    <div className="flex items-center gap-1.5 pt-0.5 text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Passwords match</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">Password requirements:</div>
                <ul className="mt-1 space-y-1 pl-4 list-disc">
                  <li className={password.length >= 6 ? "text-emerald-600 font-medium" : ""}>
                    At least 6 characters in length
                  </li>
                  <li className={passwordsMatch ? "text-emerald-600 font-medium" : ""}>
                    Password and confirm password must match exactly
                  </li>
                </ul>
              </div>
            </div>
          </Step>

          {/* ══════════════════════════════════════════════════════════════════════
            STEP 3: YOUR DETAILS
           ══════════════════════════════════════════════════════════════════════ */}
          <Step n={3} current={step}>
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
                options={managedCities.length > 0 ? managedCities : INDIAN_CITIES}
                values={cities}
                onAdd={(val) => {
                  if (val && !cities.includes(val)) {
                    setCities((prev) => [...prev, val]);
                  }
                }}
                onRemove={(i) => setCities((prev) => prev.filter((_, idx) => idx !== i))}
              />
            </div>
          </Step>

          {/* ══════════════════════════════════════════════════════════════════════
            STEP 4: PRACTICE AREAS
           ══════════════════════════════════════════════════════════════════════ */}
          <Step n={4} current={step}>
            <div className="space-y-3">
              <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 *:min-w-0">
                <Select
                  label="Practice Area"
                  value={selectedPracticeArea}
                  onChange={handlePracticeAreaChange}
                  options={[
                    { value: "", label: "-- Select Practice Area --" },
                    ...practiceAreaTree.map((pa) => ({
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

          {/* ══════════════════════════════════════════════════════════════════════
            STEP 5: CREDENTIALS
           ══════════════════════════════════════════════════════════════════════ */}
          <Step n={5} current={step}>
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

              {/* Languages & Courts */}
              <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 *:min-w-0">
                <TagDropdownField
                  label="Languages Spoken"
                  placeholder="-- Select Language to Add --"
                  options={managedLanguages.length > 0 ? managedLanguages : INDIAN_LANGUAGES}
                  values={languages}
                  onAdd={(val) => {
                    if (val && !languages.includes(val)) setLanguages((prev) => [...prev, val]);
                  }}
                  onRemove={(i) => setLanguages((prev) => prev.filter((_, idx) => idx !== i))}
                />

                <TagDropdownField
                  label="Courts Practiced In"
                  placeholder="-- Select Court to Add --"
                  options={managedCourts.length > 0 ? managedCourts : INDIAN_COURTS}
                  values={courts}
                  onAdd={(val) => {
                    if (val && !courts.includes(val)) setCourts((prev) => [...prev, val]);
                  }}
                  onRemove={(i) => setCourts((prev) => prev.filter((_, idx) => idx !== i))}
                />
              </div>

              {/* Address & Bio */}
              <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2 *:min-w-0">
                <TextField
                  label="Chamber / Office Address"
                  type="textarea"
                  rows={2}
                  value={address}
                  onChange={setAddress}
                  placeholder="Chamber No. 402, High Court Complex, Hyderabad"
                  className="w-full"
                />

                <TextField
                  label="Bio / Professional Summary"
                  type="textarea"
                  rows={2}
                  value={bio}
                  onChange={setBio}
                  placeholder="Tell clients about your practice, experience, and approach…"
                  className="w-full"
                />
              </div>
            </div>
          </Step>

          {/* ══════════════════════════════════════════════════════════════════════
            STEP 6: SUBMIT
           ══════════════════════════════════════════════════════════════════════ */}
          <Step n={6} current={step}>
            <div className="space-y-3">
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

              {/* Declaration */}
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
            <Button type="submit" variant="filled" className="min-w-41 shadow-md">
              Submit application
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
  onRemove: (index: number) => void;
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
          {values.map((v, i) => (
            <InputChip key={`${v}-${i}`} label={v} onRemove={() => onRemove(i)} />
          ))}
        </div>
      )}
    </div>
  );
}
