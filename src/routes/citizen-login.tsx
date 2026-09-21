import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Phone, Mail, ArrowLeft, ChevronRight, Tag, User, RotateCw } from "lucide-react";
import { OtpInput, TextField, Button } from "@/components/m3";
import { FormStepper } from "@/components/app/FormStepper";
import type { FormStep } from "@/components/app/FormStepper";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { getCitizenSession, setCitizenSession } from "@/features/citizen/session";
import { useAuth } from "@/context/useAuth";
import { CitizenLanguageButtons } from "@/features/citizen/CitizenLanguageButtons";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";
import { getCitizens, updateCitizenProfile } from "@/data/appStore";
import {
  sanitizeName,
  sanitizePhone,
  validateName,
  validatePhone,
  validateEmail,
} from "@/lib/validations";
import { sendCitizenOtpApi, verifyCitizenOtpApi } from "@/features/citizen/authApi";

interface SearchParams {
  area?: string;
  specialization?: string;
  service?: string;
}

export const Route = createFileRoute("/citizen-login")({
  head: () => ({ meta: [{ title: "Citizen sign in — CloseUrCase" }] }),

  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    area: typeof s.area === "string" ? s.area : undefined,
    specialization: typeof s.specialization === "string" ? s.specialization : undefined,
    service: typeof s.service === "string" ? s.service : undefined,
  }),

  component: CitizenLogin,
});

type Step = "phone" | "otp";
type LoginMethod = "phone" | "email";

const STEP_IDS: Record<Step, number> = { phone: 1, otp: 2 };
const LOGIN_STEPS: FormStep[] = [
  { id: 1, label: "Your details" },
  { id: 2, label: "Verify OTP" },
];

export function CitizenLogin() {
  const navigate = useNavigate();
  const { loginCitizen } = useAuth();
  const { area, specialization, service } = Route.useSearch();
  const { translate } = useCitizenLanguage();
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  useEffect(() => {
    const session = getCitizenSession();
    if (session.authenticated) {
      if (area || specialization || service) {
        navigate({
          to: "/citizen/create-case",
          search: { area, specialization, service },
        });
      }
    }
  }, [area, specialization, service, navigate]);

  const [step, setStep] = useState<Step>("phone");
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("phone");

  const [fullName, setFullName] = useState("");
  const [fullNameTouched, setFullNameTouched] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resend OTP countdown
  const [resendCountdown, setResendCountdown] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const phoneDigits = phone.replace(/\D/g, "");
  const nameRes = validateName(fullName);
  const phoneRes = validatePhone(phone);
  const emailRes = validateEmail(email);

  const isCurrentContactValid = loginMethod === "phone" ? phoneRes.isValid : emailRes.isValid;
  const isFormValid = nameRes.isValid && isCurrentContactValid;

  useEffect(() => {
    if (step === "otp" && resendCountdown > 0) {
      timerRef.current = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [step, resendCountdown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFullNameTouched(true);
    if (loginMethod === "phone") setPhoneTouched(true);
    if (loginMethod === "email") setEmailTouched(true);

    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    setOtpError("");

    const payload =
      loginMethod === "phone" ? { phone: phoneDigits } : { email: email.trim().toLowerCase() };

    const res = await sendCitizenOtpApi(payload);
    setIsSubmitting(false);

    if (!res.success && res.error) {
      setOtpError(res.error);
      return;
    }

    setStep("otp");
    setOtp("");
    setOtpError("");
    setResendCountdown(30);
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setOtpError("");

    const payload =
      loginMethod === "phone" ? { phone: phoneDigits } : { email: email.trim().toLowerCase() };

    const res = await sendCitizenOtpApi(payload);
    setIsSubmitting(false);

    if (!res.success && res.error) {
      setOtpError(res.error);
      return;
    }

    setResendCountdown(30);
    setOtp("");
  };

  const verifyOtp = async () => {
    // Standard Supabase OTP is 6 digits; accept 6 digits (or 4-digit mock "0000")
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6 && cleanOtp !== "0000") {
      setOtpError("Enter the 6-digit OTP code.");
      return;
    }

    setIsSubmitting(true);
    setOtpError("");

    const nameToSave = fullName.trim();
    const payload = {
      token: cleanOtp,
      name: nameToSave,
      ...(loginMethod === "phone" ? { phone: phoneDigits } : { email: email.trim().toLowerCase() }),
    };

    const res = await verifyCitizenOtpApi(payload);
    setIsSubmitting(false);

    if (!res.success) {
      setOtpError(res.error || "Invalid OTP code. Please try again.");
      return;
    }

    // Link credentials to citizen session in sessionStorage
    setCitizenSession({
      phone: loginMethod === "phone" ? phoneDigits : "",
      email: loginMethod === "email" ? email.trim().toLowerCase() : "",
      fullName: nameToSave,
      authenticated: true,
      casePath: "new",
    });

    // Synchronize with unified AuthContext
    loginCitizen(res.data?.session?.access_token || res.data?.token, {
      id: res.data?.user?.id || `u_${Date.now()}`,
      role: "citizen",
      name: nameToSave || "Citizen",
      phone: loginMethod === "phone" ? phoneDigits : "",
      email: loginMethod === "email" ? email.trim().toLowerCase() : "",
    });

    // Link profile directly to appStore for reactive sync across views
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
    return <PermissionsGate onContinue={acknowledgePermissions} image="/citizen-login.png" />;
  }

  const recipientSubtitle =
    loginMethod === "phone"
      ? `${translate("verifyOtpDesc")} (+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)})`
      : `${translate("verifyOtpDesc")} (${email.trim()})`;

  return (
    <AuthLayout
      centerLogoOnMobile
      centerOnMobile
      image="/citizen-login.png"
      title={step === "phone" ? translate("citizenLoginLabel") : translate("verifyOtpTitle")}
      subtitle={step === "phone" ? translate("citizenLoginSubtitle") : recipientSubtitle}
      footer={
        <>
          {translate("LawyerAdminSignIn")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {translate("lawyerAdminLogin")}
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <div className="hidden lg:block lg:shrink-0">
          <FormStepper
            steps={LOGIN_STEPS}
            current={STEP_IDS[step]}
            furthest={STEP_IDS[step]}
            onStepClick={(id) => setStep(id === 1 ? "phone" : "otp")}
            ariaLabel="Citizen sign-in progress"
          />
        </div>

        {(area || specialization || service) && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <Tag className="h-3.5 w-3.5 shrink-0 text-primary" />
            {area && <span>{area}</span>}
            {specialization && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span>{specialization}</span>
              </>
            )}
            {service && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="font-semibold text-foreground">{service}</span>
              </>
            )}
          </div>
        )}

        <CitizenLanguageButtons size="sm" showLabel={false} className="max-w-fit" />

        {step === "phone" && (
          <form onKeyDown={handleFormEnterKey} onSubmit={handleSendOtp} className="space-y-4">
            {/* Full Name Field */}
            <div className="space-y-1">
              <TextField
                label="Full Name (Letters Only)"
                type="text"
                required
                value={fullName}
                onChange={(v) => {
                  setFullName(sanitizeName(v));
                  setFullNameTouched(true);
                }}
                placeholder="Enter your full name"
                leadingIcon={<User className="h-4 w-4" />}
                error={fullNameTouched && !nameRes.isValid}
                className="w-full"
              />
              {fullNameTouched && !nameRes.isValid && (
                <p className="text-[11px] font-medium text-destructive">{nameRes.error}</p>
              )}
            </div>

            {/* Login Method Segmented Switch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">Sign in with</label>
              </div>
              <div className="grid grid-cols-2 gap-1 rounded-lg border border-border/80 bg-muted/40 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("phone");
                    setOtpError("");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all ${
                    loginMethod === "phone"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Phone className="h-3.5 w-3.5" />
                  {translate("loginWithPhone")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("email");
                    setOtpError("");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-md py-2 text-xs font-semibold transition-all ${
                    loginMethod === "email"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  {translate("loginWithEmail")}
                </button>
              </div>
            </div>

            {/* Mobile Number Input */}
            {loginMethod === "phone" && (
              <div className="space-y-1">
                <TextField
                  label={translate("mobileNumber")}
                  type="tel"
                  required
                  value={phone}
                  onChange={(v) => {
                    setPhone(sanitizePhone(v));
                    setPhoneTouched(true);
                  }}
                  placeholder="10-digit number"
                  leadingIcon={<Phone className="h-4 w-4" />}
                  prefixText="+91"
                  maxLength={10}
                  error={phoneTouched && !phoneRes.isValid}
                  className="w-full"
                />
                {phoneTouched && !phoneRes.isValid && (
                  <p className="text-[11px] font-medium text-destructive">{phoneRes.error}</p>
                )}
              </div>
            )}

            {/* Email Address Input */}
            {loginMethod === "email" && (
              <div className="space-y-1">
                <TextField
                  label={translate("emailAddress")}
                  type="email"
                  required
                  value={email}
                  onChange={(v) => {
                    setEmail(v);
                    setEmailTouched(true);
                  }}
                  placeholder="name@example.com"
                  leadingIcon={<Mail className="h-4 w-4" />}
                  error={emailTouched && !emailRes.isValid}
                  className="w-full"
                />
                {emailTouched && !emailRes.isValid && (
                  <p className="text-[11px] font-medium text-destructive">{emailRes.error}</p>
                )}
              </div>
            )}

            {otpError && (
              <p className="text-center text-xs font-medium text-destructive">{otpError}</p>
            )}

            <Button
              type="submit"
              variant="filled"
              disabled={!isFormValid || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Sending OTP…" : translate("continueBtn")}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-5">
            <Button
              variant="text"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => {
                setStep("phone");
                setOtpError("");
              }}
            >
              {translate("changeContact")}
            </Button>

            <div className="flex justify-center">
              <OtpInput
                length={6}
                value={otp}
                onChange={setOtp}
                error={!!otpError}
                autoFocus
                ariaLabel={translate("verifyOtpTitle")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (otp.length === 6 || otp === "0000")) {
                    e.preventDefault();
                    verifyOtp();
                  }
                }}
              />
            </div>

            {otpError && (
              <p className="text-center text-sm font-medium text-destructive">{otpError}</p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>Didn't receive the code?</span>
              {resendCountdown > 0 ? (
                <span className="font-medium text-foreground">Resend in {resendCountdown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 font-semibold text-primary hover:underline"
                >
                  <RotateCw className="h-3 w-3" />
                  Resend OTP
                </button>
              )}
            </div>

            <Button
              type="button"
              variant="filled"
              onClick={verifyOtp}
              disabled={(otp.length !== 6 && otp !== "0000") || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Verifying…" : translate("verifyContinue")}
            </Button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
