import { useState } from "react";
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
} from "lucide-react";
import { AvatarUploadField } from "@/components/app/AvatarUploadField";
import { TextField, Button } from "@/components/m3";
import type { UserRole } from "@/types";
import { nearestServiceCity, DEFAULT_CITY } from "@/lib/geo";
import {
  sanitizeName,
  sanitizePhone,
  validateName,
  validatePhone,
  validateEmail,
} from "@/lib/validations";

export interface ProfileFormFields {
  name: string;
  email: string;
  phone: string;
  city: string;
  currentLocation?: string;
}

export function ProfileForm({
  role,
  defaults,
  defaultPhotoUrl,
  wide = true,
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
  };
  defaultPhotoUrl?: string;
  wide?: boolean;
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
  const [isLocating, setIsLocating] = useState(false);
  const [aadhar, setAadhar] = useState(defaults.aadhar ?? "");

  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const nameRes = validateName(name);
  const phoneRes = validatePhone(phone);
  const emailRes = validateEmail(email);

  const isFormValid = nameRes.isValid && phoneRes.isValid && emailRes.isValid;

  const handleRefreshLocation = () => {
    setIsLocating(true);
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const nearest = nearestServiceCity(latitude, longitude);
          setCurrentLocation(`${nearest.name}, ${nearest.state}`);
          setIsLocating(false);
        },
        () => {
          setCurrentLocation((prev) =>
            prev.includes("Visakhapatnam")
              ? "Hyderabad, Telangana"
              : "Visakhapatnam, Andhra Pradesh",
          );
          setIsLocating(false);
        },
        { timeout: 5000, maximumAge: 0 },
      );
    } else {
      setCurrentLocation(`${DEFAULT_CITY.name}, ${DEFAULT_CITY.state}`);
      setIsLocating(false);
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

  const currentFields: ProfileFormFields = { name, email, phone, city, currentLocation };
  const infoCard = extraField ? extraField(currentFields) : defaultAadhaarCard;

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
              name={defaults.name}
              defaultPhotoUrl={defaultPhotoUrl}
              centered
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
          </div>
        </div>
      </div>

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
                onChange={(v) => {
                  setEmail(v);
                  setEmailTouched(true);
                }}
                placeholder="email@example.com"
                leadingIcon={<Mail className="h-4 w-4 text-primary/70" />}
                error={Boolean(emailTouched && !emailRes.isValid)}
                className="w-full"
              />
              {emailTouched && !emailRes.isValid && (
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
                onChange={(v) => {
                  setPhone(sanitizePhone(v));
                  setPhoneTouched(true);
                }}
                placeholder="10-digit mobile number"
                leadingIcon={<PhoneIcon className="h-4 w-4 text-primary/70" />}
                error={Boolean(phoneTouched && !phoneRes.isValid)}
                className="w-full"
              />
              {phoneTouched && !phoneRes.isValid && (
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
