import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import {
  User,
  Scale,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ArrowLeft,
  RotateCw,
} from "lucide-react";
import { OtpInput, TextField, Button, IconButton } from "@/components/m3";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { getCitizenSession, setCitizenSession } from "@/features/citizen/session";
import { CitizenLanguageButtons } from "@/features/citizen/CitizenLanguageButtons";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";
import { getCitizens, getLawyers, updateCitizenProfile } from "@/data/appStore";
import {
  sanitizeName,
  sanitizePhone,
  validateName,
  validatePhone,
  validateEmail,
} from "@/lib/validations";
import { useSendCitizenOtp, useVerifyCitizenOtp, useLawyerLogin } from "@/hooks/queries/useAuth";
import { getStoredToken, getStoredUser } from "@/services/apiClient";
import type { AuthUser, SendOtpResponse } from "@/types/api";
import { cn } from "@/lib/utils";

interface SearchParams {
  id?: "citizen" | "lawyer";
  role?: "citizen" | "lawyer";
  tab?: "citizen" | "lawyer";
  area?: string;
  specialization?: string;
  service?: string;
  splash?: string;
}

export const Route = createFileRoute("/citizen-lawyer-login")({
  beforeLoad: ({ search }: { search: SearchParams }) => {
    if (typeof window !== "undefined") {
      const session = getCitizenSession();
      const token = getStoredToken();
      const user = getStoredUser<AuthUser>();
      const isCitizenAuthenticated =
        session.authenticated || (Boolean(token || user) && user?.role === "citizen");
      if (isCitizenAuthenticated) {
        if (search.area || search.specialization || search.service) {
          throw redirect({
            to: "/citizen/create-case",
            search: {
              area: search.area,
              specialization: search.specialization,
              service: search.service,
            },
          });
        }
        throw redirect({ to: "/citizen" });
      }
      if (user?.role === "admin") throw redirect({ to: "/admin" });
      if (user?.role === "lawyer") throw redirect({ to: "/lawyer" });
    }
  },
  head: () => ({ meta: [{ title: "Sign In — CloseUrCase Legal Platform" }] }),

  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    id: s.id === "lawyer" ? "lawyer" : s.id === "citizen" ? "citizen" : undefined,
    role: s.role === "lawyer" ? "lawyer" : s.role === "citizen" ? "citizen" : undefined,
    tab: s.tab === "lawyer" ? "lawyer" : s.tab === "citizen" ? "citizen" : undefined,
    area: typeof s.area === "string" ? s.area : undefined,
    specialization: typeof s.specialization === "string" ? s.specialization : undefined,
    service: typeof s.service === "string" ? s.service : undefined,
    splash: typeof s.splash === "string" ? s.splash : undefined,
  }),

  component: CitizenLawyerLogin,
});

type CitizenStep = "contact" | "otp";
type CitizenMethod = "phone" | "email";

function detectRoleFromNavigation(search: SearchParams): "citizen" | "lawyer" {
  // 1. Explicit id search query param ?id=... (Highest priority)
  if (search.id === "lawyer") return "lawyer";
  if (search.id === "citizen") return "citizen";

  // 2. Explicit role/tab query param ?role=... or ?tab=...
  if (search.role === "lawyer" || search.tab === "lawyer") return "lawyer";
  if (search.role === "citizen" || search.tab === "citizen") return "citizen";

  if (typeof window !== "undefined") {
    // 3. Previous page recorded during router navigation
    const prevPath = (sessionStorage.getItem("cuc_prev_pathname") || "").toLowerCase();
    if (prevPath.startsWith("/lawyer") || prevPath.includes("lawyer")) return "lawyer";
    if (prevPath.startsWith("/citizen") || prevPath.includes("citizen")) return "citizen";

    // 4. Document referrer (external or direct entry)
    const referrer = (document.referrer || "").toLowerCase();
    if (referrer.includes("/lawyer")) return "lawyer";
    if (referrer.includes("/citizen")) return "citizen";
  }

  // Default fallback
  return "citizen";
}

export function CitizenLawyerLogin() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { area, specialization, service, splash } = search;
  const { translate } = useCitizenLanguage();

  // Active Role Slider: Citizen vs Lawyer/Org, initialized based on id or previous page navigation
  const [activeRole, setActiveRole] = useState<"citizen" | "lawyer">(() =>
    detectRoleFromNavigation(search),
  );

  // Sync state if search params change externally (e.g. Back/Forward browser navigation)
  useEffect(() => {
    if (search.id === "lawyer" || search.role === "lawyer" || search.tab === "lawyer") {
      setActiveRole("lawyer");
    } else if (search.id === "citizen" || search.role === "citizen" || search.tab === "citizen") {
      setActiveRole("citizen");
    }
  }, [search.id, search.role, search.tab]);

  const handleRoleChange = (newRole: "citizen" | "lawyer") => {
    setActiveRole(newRole);
    if (newRole === "citizen") {
      setLawyerLoginError(null);
    } else {
      setCitizenOtpError("");
    }
    navigate({
      search: ((prev: any) => ({
        ...prev,
        id: newRole,
        role: newRole,
      })) as any,
      replace: true,
    });
  };

  // Splash Screen state for PWA launch
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === "undefined") return false;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const splashSeen = sessionStorage.getItem("cuc_pwa_splash_seen");
    const forceSplash = splash === "true";
    return (isStandalone || forceSplash) && !splashSeen;
  });
  const [splashFading, setSplashFading] = useState(false);

  useEffect(() => {
    if (!showSplash) return;
    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
    }, 1300);
    const removeTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem("cuc_pwa_splash_seen", "true");
    }, 1800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [showSplash]);

  // Permissions Gate
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  // -------------------------------------------------------------
  // Citizen Sign-in State & Handlers
  // -------------------------------------------------------------
  const sendOtpMutation = useSendCitizenOtp();
  const verifyOtpMutation = useVerifyCitizenOtp();

  const [citizenStep, setCitizenStep] = useState<CitizenStep>("contact");
  const [loginMethod, setLoginMethod] = useState<CitizenMethod>("phone");

  const [fullName, setFullName] = useState("");
  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [isExistingCitizen, setIsExistingCitizen] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [otp, setOtp] = useState("");
  const [citizenOtpError, setCitizenOtpError] = useState("");
  const [isCitizenSubmitting, setIsCitizenSubmitting] = useState(false);

  const [resendCountdown, setResendCountdown] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const nameRes = validateName(fullName);
  const phoneRes = validatePhone(phone);
  const citizenEmailRes = validateEmail(email);

  const isCurrentContactValid =
    loginMethod === "phone" ? phoneRes.isValid : citizenEmailRes.isValid;
  const isOtpComplete = otp.trim().length === 6 || otp.trim() === "0000";
  const isStep2Valid = isExistingCitizen ? isOtpComplete : isOtpComplete && nameRes.isValid;

  useEffect(() => {
    if (citizenStep === "otp" && resendCountdown > 0) {
      timerRef.current = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [citizenStep, resendCountdown]);

  const handleSendCitizenOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loginMethod === "phone") setPhoneTouched(true);
    if (loginMethod === "email") setEmailTouched(true);

    if (!isCurrentContactValid || isCitizenSubmitting) return;

    setIsCitizenSubmitting(true);
    setCitizenOtpError("");

    // Conflict check: ensure phone or email is not registered to an advocate account
    const lawyers = getLawyers();
    if (loginMethod === "phone") {
      const isLawyer = lawyers.some(
        (l) => l.phone && l.phone.replace(/\D/g, "").slice(-10) === phoneDigits.slice(-10),
      );
      if (isLawyer) {
        setIsCitizenSubmitting(false);
        setCitizenOtpError(
          "This phone number is registered to an advocate account. Existing advocate credentials cannot be used for citizen signup.",
        );
        return;
      }
    } else {
      const isLawyer = lawyers.some(
        (l) => l.email && l.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (isLawyer) {
        setIsCitizenSubmitting(false);
        setCitizenOtpError(
          "This email is registered to an advocate account. Existing advocate credentials cannot be used for citizen signup.",
        );
        return;
      }
    }

    const payload =
      loginMethod === "phone" ? { phone: phoneDigits } : { email: email.trim().toLowerCase() };

    let res: (SendOtpResponse & { success: boolean; message: string }) | null = null;
    try {
      res = await sendOtpMutation.mutateAsync(payload);
    } catch (err: unknown) {
      setIsCitizenSubmitting(false);
      setCitizenOtpError(err instanceof Error ? err.message : "Could not send OTP. Please try again.");
      return;
    }
    setIsCitizenSubmitting(false);

    const citizens = getCitizens();
    const matchedCitizen = citizens.find(
      (c) =>
        (loginMethod === "phone" &&
          c.phone &&
          c.phone.replace(/\D/g, "").slice(-10) === phoneDigits.slice(-10)) ||
        (loginMethod === "email" &&
          c.email &&
          c.email.toLowerCase() === email.trim().toLowerCase()),
    );

    const userFound = Boolean(res?.userExists || (matchedCitizen && matchedCitizen.name));
    const detectedName = res?.fullName || res?.name || matchedCitizen?.name || "";

    if (userFound && detectedName) {
      setIsExistingCitizen(true);
      setFullName(detectedName);
      setFullNameTouched(false);
    } else {
      setIsExistingCitizen(false);
      setFullName("");
      setFullNameTouched(false);
    }

    setCitizenStep("otp");
    setOtp("");
    setCitizenOtpError("");
    setResendCountdown(30);
  };

  const handleResendCitizenOtp = async () => {
    if (resendCountdown > 0 || isCitizenSubmitting) return;
    setIsCitizenSubmitting(true);
    setCitizenOtpError("");

    const lawyers = getLawyers();
    if (loginMethod === "phone") {
      const isLawyer = lawyers.some(
        (l) => l.phone && l.phone.replace(/\D/g, "").slice(-10) === phoneDigits.slice(-10),
      );
      if (isLawyer) {
        setIsCitizenSubmitting(false);
        setCitizenOtpError(
          "This phone number is registered to an advocate account. Existing advocate credentials cannot be used for citizen signup.",
        );
        return;
      }
    } else {
      const isLawyer = lawyers.some(
        (l) => l.email && l.email.toLowerCase() === email.trim().toLowerCase(),
      );
      if (isLawyer) {
        setIsCitizenSubmitting(false);
        setCitizenOtpError(
          "This email is registered to an advocate account. Existing advocate credentials cannot be used for citizen signup.",
        );
        return;
      }
    }

    const payload =
      loginMethod === "phone" ? { phone: phoneDigits } : { email: email.trim().toLowerCase() };

    try {
      await sendOtpMutation.mutateAsync(payload);
    } catch (err: unknown) {
      setIsCitizenSubmitting(false);
      setCitizenOtpError(err instanceof Error ? err.message : "Could not resend OTP. Please try again.");
      return;
    }
    setIsCitizenSubmitting(false);
    setResendCountdown(30);
    setOtp("");
  };

  const verifyCitizenOtp = async () => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6 && cleanOtp !== "0000") {
      setCitizenOtpError("Enter the 6-digit OTP code.");
      return;
    }

    if (!isExistingCitizen) {
      setFullNameTouched(true);
      if (!nameRes.isValid) {
        setCitizenOtpError(nameRes.error || "Please enter your full name.");
        return;
      }
    }

    setIsCitizenSubmitting(true);
    setCitizenOtpError("");

    const nameToSave = fullName.trim();
    const payload = {
      token: cleanOtp,
      name: nameToSave,
      ...(loginMethod === "phone" ? { phone: phoneDigits } : { email: email.trim().toLowerCase() }),
    };

    try {
      await verifyOtpMutation.mutateAsync(payload);
    } catch (err: unknown) {
      setIsCitizenSubmitting(false);
      setCitizenOtpError(err instanceof Error ? err.message : "Invalid OTP code. Please try again.");
      return;
    }
    setIsCitizenSubmitting(false);

    setCitizenSession({
      phone: loginMethod === "phone" ? phoneDigits : "",
      email: loginMethod === "email" ? email.trim().toLowerCase() : "",
      fullName: nameToSave,
      authenticated: true,
      casePath: "new",
    });

    const citizens = getCitizens();
    const matchedCitizen =
      citizens.find(
        (c) =>
          (loginMethod === "phone" && c.phone.replace(/\D/g, "").includes(phoneDigits)) ||
          (loginMethod === "email" && c.email?.toLowerCase() === email.trim().toLowerCase()),
      ) || citizens[0];

    if (matchedCitizen) {
      updateCitizenProfile(matchedCitizen.id, {
        ...(nameToSave ? { name: nameToSave } : {}),
        ...(loginMethod === "phone" ? { phone: `+91 ${phoneDigits}` } : {}),
        ...(loginMethod === "email" ? { email: email.trim().toLowerCase() } : {}),
      });
    }

    if (area || specialization || service) {
      navigate({
        to: "/citizen/create-case",
        search: { area, specialization, service },
      });
    } else {
      navigate({ to: "/citizen" });
    }
  };

  // -------------------------------------------------------------
  // Lawyer/Org Sign-in State & Handlers
  // -------------------------------------------------------------
  const lawyerLoginMutation = useLawyerLogin();
  const [lawyerEmail, setLawyerEmail] = useState("");
  const [lawyerEmailTouched, setLawyerEmailTouched] = useState(false);
  const [lawyerPassword, setLawyerPassword] = useState("");
  const [showLawyerPassword, setShowLawyerPassword] = useState(false);
  const [lawyerLoginError, setLawyerLoginError] = useState<string | null>(null);

  const lawyerEmailRes = validateEmail(lawyerEmail);
  const isLawyerPending = lawyerLoginMutation.isPending;

  const handleLawyerLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLawyerEmailTouched(true);
    setLawyerLoginError(null);
    if (!lawyerEmailRes.isValid) return;

    try {
      await lawyerLoginMutation.mutateAsync({ email: lawyerEmail, password: lawyerPassword });
      navigate({ to: "/lawyer" });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Authentication failed. Please verify lawyer credentials.";
      setLawyerLoginError(message);
    }
  };

  const handleFormEnterKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.closest("textarea")) return;
    const form = target.closest("form");
    if (!form) return;
    e.preventDefault();
    form.requestSubmit();
  };

  if (!permissionsAcknowledged) {
    return (
      <PermissionsGate
        onContinue={acknowledgePermissions}
        image={activeRole === "citizen" ? "/citizen-login.png" : "/lawyer-login.png"}
      />
    );
  }

  return (
    <>
      {/* ── Branded Splash Screen for PWA Launch ── */}
      {showSplash && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 transition-opacity duration-500 ease-out",
            splashFading ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
        >
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-6 flex h-28 w-28 items-center justify-center rounded-3xl bg-surface p-4 shadow-xl border border-border/60 animate-in fade-in zoom-in-95 duration-500">
              <img
                src="/logo.svg"
                alt="CloseUrCase Logo"
                className="h-20 w-20 object-contain drop-shadow-sm"
              />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl animate-in fade-in slide-in-from-bottom-2 duration-700">
              CloseUrCase
            </h1>
            <p className="mt-2 text-sm font-medium tracking-wide text-muted-foreground animate-in fade-in slide-in-from-bottom-3 duration-700">
              Just click for justice
            </p>
            <div className="mt-8 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* ── Main Unified Authentication View ── */}
      <AuthLayout
        centerLogoOnMobile
        centerOnMobile
        title={
          activeRole === "citizen"
            ? citizenStep === "contact"
              ? "Citizen Sign In"
              : "Verify Citizen Account"
            : "Lawyer / Org Sign In"
        }
        subtitle={
          activeRole === "citizen"
            ? citizenStep === "contact"
              ? "Sign in or register with mobile OTP to manage your legal cases."
              : `Enter the 6-digit OTP sent to ${loginMethod === "phone" ? `+91 ${phone}` : email}`
            : "Email and password for Advocates, Legal Counsel, and Law Firms."
        }
        image={activeRole === "citizen" ? "/citizen-login.png" : "/lawyer-login.png"}
        footer={
          activeRole === "citizen" ? (
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span>Looking for legal advice?</span>
              <Link to="/" className="font-semibold text-primary hover:underline">
                Explore Services
              </Link>
              <span>·</span>
              <span>New Advocate?</span>
              <Link to="/lawyer-register" className="font-semibold text-primary hover:underline">
                Register Practice
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <span>New Advocate or Legal Firm?</span>
              <Link to="/lawyer-register" className="font-semibold text-primary hover:underline">
                Register here
              </Link>
              <span>·</span>
              <Link to="/admin-login" className="hover:underline">
                Admin portal
              </Link>
            </div>
          )
        }
      >
        {/* ── Slider Switch [Citizen , Lawyer/Org] ── */}
        <div className="relative mb-6 rounded-2xl bg-muted/70 p-1.5 border border-border/80 shadow-xs">
          {/* Fluid sliding pill indicator */}
          <div
            className={cn(
              "absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-xl bg-primary shadow-sm transition-all duration-300 ease-in-out",
              activeRole === "citizen" ? "left-1.5" : "left-[calc(50%+4.5px)]",
            )}
          />
          <div className="relative z-10 grid grid-cols-2">
            <button
              id="citizen"
              type="button"
              onClick={() => handleRoleChange("citizen")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer select-none",
                activeRole === "citizen"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <User className="h-4 w-4" />
              <span>Citizen</span>
            </button>
            <button
              id="lawyer"
              type="button"
              onClick={() => handleRoleChange("lawyer")}
              className={cn(
                "flex items-center justify-center gap-2 py-2.5 text-xs sm:text-sm font-bold transition-colors duration-200 cursor-pointer select-none",
                activeRole === "lawyer"
                  ? "text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Scale className="h-4 w-4" />
              <span>Lawyer/Org</span>
            </button>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* CITIZEN VIEW                                              */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeRole === "citizen" && (
          <div className="space-y-4">
            <CitizenLanguageButtons size="sm" showLabel={false} className="max-w-fit mb-2" />

            {citizenStep === "contact" && (
              <form onKeyDown={handleFormEnterKey} onSubmit={handleSendCitizenOtp} className="space-y-4">
                {/* Method Switch: Phone vs Email */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">Sign in with</label>
                  </div>
                  <div className="grid grid-cols-2 gap-1 rounded-xl border border-border/80 bg-muted/40 p-1">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("phone");
                        setCitizenOtpError("");
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                        loginMethod === "phone"
                          ? "bg-background text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {translate("loginWithPhone")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod("email");
                        setCitizenOtpError("");
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer",
                        loginMethod === "email"
                          ? "bg-background text-foreground shadow-xs font-bold"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {translate("loginWithEmail")}
                    </button>
                  </div>
                </div>

                {citizenOtpError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{citizenOtpError}</span>
                  </div>
                )}

                {loginMethod === "phone" ? (
                  <div className="space-y-1">
                    <TextField
                      label="Mobile Number"
                      type="tel"
                      value={phone}
                      onChange={(v) => {
                        setPhone(sanitizePhone(v));
                        setPhoneTouched(true);
                      }}
                      placeholder="98765 43210"
                      prefixText="+91 "
                      maxLength={14}
                      error={phoneTouched && !phoneRes.isValid}
                      supportingText={
                        phoneTouched && !phoneRes.isValid ? phoneRes.error : undefined
                      }
                      className="w-full"
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <TextField
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(v) => {
                        setEmail(v);
                        setEmailTouched(true);
                      }}
                      placeholder="citizen@example.com"
                      leadingIcon={<Mail className="h-4 w-4" />}
                      error={emailTouched && !citizenEmailRes.isValid}
                      supportingText={
                        emailTouched && !citizenEmailRes.isValid
                          ? citizenEmailRes.error
                          : undefined
                      }
                      className="w-full"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  variant="filled"
                  disabled={isCitizenSubmitting || !isCurrentContactValid}
                  className="w-full mt-2"
                >
                  {isCitizenSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending OTP…
                    </span>
                  ) : (
                    "Send Verification Code"
                  )}
                </Button>
              </form>
            )}

            {citizenStep === "otp" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setCitizenStep("contact");
                      setCitizenOtpError("");
                    }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Change {loginMethod === "phone" ? "number" : "email"}
                  </button>
                  <span className="text-xs text-muted-foreground font-mono">
                    {loginMethod === "phone" ? `+91 ${phone}` : email}
                  </span>
                </div>

                {citizenOtpError && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{citizenOtpError}</span>
                  </div>
                )}

                {!isExistingCitizen && (
                  <div className="space-y-1">
                    <TextField
                      label="Your Full Name"
                      value={fullName}
                      onChange={(v) => {
                        setFullName(sanitizeName(v));
                        setFullNameTouched(true);
                      }}
                      placeholder="e.g. Ramesh Kumar"
                      leadingIcon={<User className="h-4 w-4" />}
                      error={fullNameTouched && !nameRes.isValid}
                      supportingText={
                        fullNameTouched && !nameRes.isValid
                          ? nameRes.error || "Name is required for registration"
                          : undefined
                      }
                      className="w-full"
                    />
                  </div>
                )}

                <div className="space-y-2 text-center">
                  <label className="text-xs font-medium text-muted-foreground block text-left">
                    Enter 6-digit Code
                  </label>
                  <OtpInput
                    length={6}
                    value={otp}
                    onChange={(val) => {
                      setOtp(val);
                      setCitizenOtpError("");
                    }}
                    autoFocus
                    error={Boolean(citizenOtpError)}
                    ariaLabel="6-digit verification code"
                    className="justify-center"
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Didn't receive code?</span>
                  {resendCountdown > 0 ? (
                    <span className="text-muted-foreground font-medium">
                      Resend in {resendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendCitizenOtp}
                      disabled={isCitizenSubmitting}
                      className="flex items-center gap-1 font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <RotateCw className="h-3 w-3" />
                      Resend OTP
                    </button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="filled"
                  onClick={verifyCitizenOtp}
                  disabled={isCitizenSubmitting || !isStep2Valid}
                  className="w-full mt-2"
                >
                  {isCitizenSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying…
                    </span>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ───────────────────────────────────────────────────────── */}
        {/* LAWYER / ORG VIEW                                         */}
        {/* ───────────────────────────────────────────────────────── */}
        {activeRole === "lawyer" && (
          <form
            className="space-y-4"
            onKeyDown={handleFormEnterKey}
            onSubmit={handleLawyerLoginSubmit}
          >
            {lawyerLoginError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{lawyerLoginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <TextField
                label="Email Address"
                type="email"
                required
                value={lawyerEmail}
                onChange={(v) => {
                  setLawyerEmail(v);
                  setLawyerEmailTouched(true);
                }}
                placeholder="advocate@example.com"
                leadingIcon={<Mail className="h-4 w-4" />}
                error={lawyerEmailTouched && !lawyerEmailRes.isValid}
                supportingText={
                  lawyerEmailTouched && !lawyerEmailRes.isValid
                    ? lawyerEmailRes.error
                    : undefined
                }
                className="w-full"
              />
            </div>

            <div className="space-y-1">
              <TextField
                label="Password"
                type={showLawyerPassword ? "text" : "password"}
                required
                value={lawyerPassword}
                onChange={setLawyerPassword}
                placeholder="••••••••"
                leadingIcon={<Lock className="h-4 w-4" />}
                trailingIcon={
                  <IconButton
                    ariaLabel={showLawyerPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowLawyerPassword((v) => !v)}
                  >
                    {showLawyerPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </IconButton>
                }
                className="w-full"
              />
              <div className="flex justify-end pt-1">
                <Button variant="text" className="h-auto! min-h-0! px-0! text-xs">
                  Forgot password?
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              variant="filled"
              disabled={isLawyerPending || !lawyerEmail || !lawyerPassword}
              className="w-full mt-1"
            >
              {isLawyerPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </span>
              ) : (
                "Sign in as Lawyer / Org"
              )}
            </Button>
          </form>
        )}
      </AuthLayout>
    </>
  );
}
