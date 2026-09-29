import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  MapPin,
  RefreshCw,
  User,
  Mail,
  Phone as PhoneIcon,
  Building2,
  CheckCircle2,
  Lock,
  AlertCircle,
  Crown,
  Zap,
  Award,
  CreditCard,
} from "lucide-react";
import { AvatarUploadField } from "@/components/app/AvatarUploadField";
import { TextField, Button } from "@/components/m3";
import type { UserRole, Subscription } from "@/types";
import { nearestServiceCity, DEFAULT_CITY } from "@/lib/geo";
import { getSubscriptionDateTimes, planTierForCitizen } from "@/data/appStore";
import {
  sanitizeName,
  sanitizePhone,
  validateName,
  validatePhone,
  validateEmail,
} from "@/lib/validations";

import {
  SUBSCRIPTION_TIERS,
  type SubscriptionTierId,
  type SubscriptionTierConfig,
} from "@/data/subscriptionTiers";

export type CitizenPlanTier = SubscriptionTierId;
export const CITIZEN_SUBSCRIPTION_BADGES: Record<CitizenPlanTier, SubscriptionTierConfig> =
  SUBSCRIPTION_TIERS;

export interface ProfileFormFields {
  name: string;
  email: string;
  phone: string;
  city: string;
  currentLocation?: string;
  avatarUrl?: string;
}

export function ProfileForm({
  role,
  defaults,
  defaultPhotoUrl,
  wide = true,
  disableEmail = false,
  disablePhone = false,
  planTier,
  activeSubscription,
  extraField,
  onSave,
}: {
  role: UserRole;
  defaults: {
    name: string;
    email: string;
    phone: string;
    city: string;
    currentLocation?: string;
    aadhar?: string;
    avatarUrl?: string;
  };
  defaultPhotoUrl?: string;
  wide?: boolean;
  disableEmail?: boolean;
  disablePhone?: boolean;
  planTier?: CitizenPlanTier;
  activeSubscription?: Subscription | null;
  extraField?: (fields: ProfileFormFields) => React.ReactNode;
  onSave?: (fields: ProfileFormFields) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(defaults.name);
  const [email, setEmail] = useState(defaults.email);
  const [phone, setPhone] = useState(defaults.phone);
  const [city, setCity] = useState(defaults.city);
  const [currentLocation, setCurrentLocation] = useState(
    defaults.currentLocation || `${DEFAULT_CITY.name}, ${DEFAULT_CITY.state}`,
  );
  const [avatarUrl, setAvatarUrl] = useState(defaults.avatarUrl || defaultPhotoUrl);
  const [isLocating, setIsLocating] = useState(false);
  const [aadhar, setAadhar] = useState(defaults.aadhar ?? "");
  const prevDefaultAvatarRef = useRef(defaults.avatarUrl || defaultPhotoUrl);

  useEffect(() => {
    const nextDefault = defaults.avatarUrl || defaultPhotoUrl;
    if (nextDefault && nextDefault !== prevDefaultAvatarRef.current) {
      prevDefaultAvatarRef.current = nextDefault;
      setAvatarUrl(nextDefault);
    }
  }, [defaults.avatarUrl, defaultPhotoUrl]);

  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const nameRes = validateName(name);
  const phoneRes = disableEmail && !phone.trim() ? { isValid: true } : validatePhone(phone);
  const emailRes = disablePhone && !email.trim() ? { isValid: true } : validateEmail(email);

  const isFormValid = nameRes.isValid && phoneRes.isValid && emailRes.isValid;

  const applyNewLocation = (newLoc: string) => {
    setCurrentLocation(newLoc);
    setIsLocating(false);
    // Auto-save refreshed location immediately
    if (onSave) {
      onSave({
        name,
        email,
        phone,
        city,
        currentLocation: newLoc,
        avatarUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleRefreshLocation = () => {
    setIsLocating(true);
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const nearest = nearestServiceCity(latitude, longitude);
          const newLoc = `${nearest.name}, ${nearest.state}`;
          applyNewLocation(newLoc);
        },
        () => {
          const fallbackLoc = currentLocation.includes("Visakhapatnam")
            ? "Hyderabad, Telangana"
            : "Visakhapatnam, Andhra Pradesh";
          applyNewLocation(fallbackLoc);
        },
        { timeout: 5000, maximumAge: 0 },
      );
    } else {
      const defaultLoc = `${DEFAULT_CITY.name}, ${DEFAULT_CITY.state}`;
      applyNewLocation(defaultLoc);
    }
  };

  const formatAadhar = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const aadharDigits = aadhar.replace(/\s/g, "").length;
  const aadharValid = aadharDigits === 12;

  const roleBadgeLabel =
    role === "citizen"
      ? "Citizen Account"
      : role === "lawyer"
        ? "Verified Advocate"
        : "Super Admin";

  const defaultAadhaarCard = (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0" />
          <h4 className="text-sm font-bold text-foreground">Identity & Security</h4>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
          <Lock className="h-3 w-3 text-emerald-600" /> Sensitive · Encrypted
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-foreground uppercase tracking-wide text-[11px]">
            Aadhaar Card Number
          </label>
          <span className="font-mono font-bold text-muted-foreground text-[11px]">
            {aadharDigits} / 12
          </span>
        </div>

        <TextField
          value={aadhar}
          onChange={(v) => setAadhar(formatAadhar(v))}
          placeholder="XXXX XXXX XXXX"
          className="w-full font-mono tracking-widest"
          error={Boolean(aadhar && !aadharValid)}
        />

        {aadhar && !aadharValid && (
          <p className="text-[11px] font-medium text-destructive">
            Aadhaar number must be exactly 12 digits.
          </p>
        )}
        {aadharValid && (
          <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Valid Aadhaar format
          </p>
        )}
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Your Aadhaar number is used for identity verification only and is never shared with third
          parties.
        </p>
      </div>
    </div>
  );

  const currentFields: ProfileFormFields = {
    name,
    email,
    phone,
    city,
    currentLocation,
    avatarUrl,
  };
  const infoCard = extraField ? extraField(currentFields) : defaultAadhaarCard;

  const effectiveTier: CitizenPlanTier =
    planTier ??
    (role === "citizen"
      ? (planTierForCitizen(name || defaults.name) as CitizenPlanTier) ?? "bronze"
      : "bronze");
  const subBadgeConfig =
    CITIZEN_SUBSCRIPTION_BADGES[effectiveTier] || CITIZEN_SUBSCRIPTION_BADGES.bronze;
  const SubTierIcon = subBadgeConfig.icon;
  const activeDates = activeSubscription ? getSubscriptionDateTimes(activeSubscription) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameTouched(true);
    setEmailTouched(true);
    setPhoneTouched(true);
    if (!isFormValid) return;
    onSave?.(currentFields);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <form className="w-full max-w-4xl mx-auto space-y-6" onSubmit={handleSubmit}>
      {/* Hero Header Card */}
      <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-primary/[0.04] via-surface to-primary/[0.04] p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <div className="shrink-0">
            <AvatarUploadField
              role={role}
              name={name || defaults.name}
              defaultPhotoUrl={avatarUrl || defaultPhotoUrl}
              centered
              planTier={effectiveTier}
              onPhotoChange={(newPhoto) => {
                prevDefaultAvatarRef.current = newPhoto;
                setAvatarUrl(newPhoto);
                onSave?.({
                  name,
                  email,
                  phone,
                  city,
                  currentLocation,
                  avatarUrl: newPhoto,
                });
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
              }}
            />
          </div>
          <div className="space-y-2 text-center sm:text-left min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground truncate max-w-md">
                {name || "User"}
              </h2>
              <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {roleBadgeLabel}
              </span>

              {/* Citizen Subscription Badge with Icon [bronze, silver, gold, micropass] */}
              {role === "citizen" && (
                <Link
                  to="/citizen/subscriptions"
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 ${subBadgeConfig.badgeCls}`}
                  title="Click to view subscription details"
                >
                  <SubTierIcon className="h-3 w-3 shrink-0" />
                  <span>{subBadgeConfig.label}</span>
                </Link>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary/70" />
                  {email}
                </span>
              )}
              {phone && (
                <span className="inline-flex items-center gap-1.5">
                  <PhoneIcon className="h-3.5 w-3.5 text-primary/70" />
                  {phone}
                </span>
              )}
            </div>
            {role === "citizen" && (
              <div className="pt-1 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground text-[11px] font-medium">
                  Subscription Tier:
                </span>
                <Link
                  to="/citizen/subscriptions"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline"
                >
                  <span>{subBadgeConfig.subtext}</span>
                  <span className="text-[10px] text-muted-foreground">→ Details</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Citizen Subscription & Membership Details Card */}
      {role === "citizen" && (
        <div className="space-y-3.5 rounded-2xl border border-border/80 bg-surface/95 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${subBadgeConfig.iconBgClasses} shadow-xs shrink-0`}
              >
                <SubTierIcon className={`h-4.5 w-4.5 ${subBadgeConfig.iconColorClasses}`} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground leading-tight">
                  {activeSubscription ? "Active VIP Subscription" : "Membership & Subscription"}
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  {activeSubscription
                    ? "Priority auto-assign enabled"
                    : "Standard account tier"}
                </p>
              </div>
            </div>
            <Link
              to="/citizen/subscriptions"
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider transition-all hover:scale-105 shrink-0 ${subBadgeConfig.badgeCls}`}
            >
              <SubTierIcon className="h-3 w-3" />
              {subBadgeConfig.label}
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <span>{activeSubscription?.planLabel || "Bronze Free Tier"}</span>
                {activeSubscription ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active VIP
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/30">
                    Bronze Free Tier
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {activeSubscription
                  ? "Your active membership grants instant Auto-Assign priority matching to senior specialist advocates without individual consultation fees."
                  : "Your account is automatically set to the Bronze Free Tier. Subscribe to an Auto-Assign pass (Daily ₹1, Monthly, or Yearly) for automated verified advocate allocation."}
              </p>

              {activeSubscription && activeDates && (
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 border border-border/60 px-2 py-0.5 font-semibold text-foreground">
                    ₹{activeSubscription.amount} billed
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-muted/60 border border-border/60 px-2 py-0.5 text-muted-foreground">
                    Subscribed: {activeDates.subscribedOn}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                    Expires: {activeDates.expiresOn}
                  </span>
                </div>
              )}
            </div>

            <div className="shrink-0 flex items-center self-start sm:self-center">
              <Link
                to="/citizen/subscriptions"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs px-3.5 py-2 transition-all shadow-xs"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>{activeSubscription ? "Manage Plan" : "Upgrade Plan"}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Personal Information Section Card */}
      <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
        <div className="border-b border-border/60 pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Personal Information
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <TextField
              label="Full Name"
              value={name}
              onChange={(v) => {
                setName(sanitizeName(v));
                setNameTouched(true);
              }}
              placeholder="Enter your full name (letters only)"
              leadingIcon={<User className="h-4 w-4 text-primary/70" />}
              error={Boolean(nameTouched && !nameRes.isValid)}
              className="w-full"
            />
            {nameTouched && !nameRes.isValid && (
              <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                <AlertCircle className="h-3 w-3 shrink-0" />
                <span>{nameRes.error}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <TextField
                label="Email Address"
                type="email"
                value={email}
                disabled={disableEmail}
                supportingText={disableEmail ? "Signed up with Email (Primary Login)" : undefined}
                onChange={(v) => {
                  if (!disableEmail) {
                    setEmail(v);
                    setEmailTouched(true);
                  }
                }}
                placeholder="email@example.com"
                leadingIcon={<Mail className="h-4 w-4 text-primary/70" />}
                error={Boolean(!disableEmail && emailTouched && !emailRes.isValid)}
                className="w-full"
              />
              {!disableEmail && emailTouched && !emailRes.isValid && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{emailRes.error}</span>
                </p>
              )}
            </div>

            <div className="space-y-1">
              <TextField
                label="Phone Number"
                type="tel"
                value={phone}
                disabled={disablePhone}
                supportingText={disablePhone ? "Signed up with Mobile (Primary Login)" : undefined}
                onChange={(v) => {
                  if (!disablePhone) {
                    setPhone(sanitizePhone(v));
                    setPhoneTouched(true);
                  }
                }}
                placeholder="10-digit mobile number"
                leadingIcon={<PhoneIcon className="h-4 w-4 text-primary/70" />}
                error={Boolean(!disablePhone && phoneTouched && !phoneRes.isValid)}
                className="w-full"
              />
              {!disablePhone && phoneTouched && !phoneRes.isValid && (
                <p className="flex items-center gap-1 text-[11px] font-medium text-destructive">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{phoneRes.error}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Location Settings Section Card */}
      <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
        <div className="border-b border-border/60 pb-3">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Location & Region
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="District"
            value={city}
            onChange={setCity}
            placeholder="e.g. Hyderabad, Visakhapatnam"
            leadingIcon={<Building2 className="h-4 w-4 text-primary/70" />}
            className="w-full"
          />

          {/* Detected Current Location with Native Trailing Refresh Button */}
          <TextField
            label="Detected Current Location"
            value={currentLocation}
            onChange={setCurrentLocation}
            placeholder="e.g. Visakhapatnam, Andhra Pradesh"
            leadingIcon={<MapPin className="h-4 w-4 text-primary" />}
            trailingIcon={
              <button
                type="button"
                onClick={handleRefreshLocation}
                disabled={isLocating}
                className="flex h-7 w-7 items-center justify-center rounded-full text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh detected location (Manual refresh only)"
                aria-label="Refresh location"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
              </button>
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Security / Role Extra Section Card */}
      {infoCard}

      {/* Bottom Save Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-surface/95 p-4 shadow-2xs">
        <span className="text-xs text-muted-foreground font-medium">
          Ensure all profile details are accurate before saving.
        </span>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in duration-200">
              <CheckCircle2 className="h-4 w-4" /> Profile saved successfully!
            </span>
          )}
          <Button type="submit" variant="filled" className="px-6 font-bold">
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
}
