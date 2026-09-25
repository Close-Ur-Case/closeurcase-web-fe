import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { AvatarUploadField } from "@/components/app/AvatarUploadField";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import {
  getLawyers,
  updateLawyerProfile,
  subscribeToStore,
  getActiveCities,
  getActiveLanguages,
  getActiveCourts,
} from "@/data/appStore";
import { lawyerService } from "@/services/lawyerService";
import { useAuth } from "@/context/useAuth";
import {
  ShieldCheck,
  MapPin,
  RefreshCw,
  User,
  Mail,
  Phone as PhoneIcon,
  Building2,
  CheckCircle2,
  Briefcase,
  Award,
  Globe,
  Scale,
  Plus,
  Trash2,
  FileText,
  Upload,
  X,
  Lock,
  IndianRupee,
  Landmark,
  Star,
} from "lucide-react";
import { Button, TextField, Select, Checkbox, InputChip, IconButton } from "@/components/m3";
import {
  getLawyerPracticeAreas,
  type LawyerPracticeArea,
} from "@/components/app/lawyerPracticeAreas";
import { sanitizeName, sanitizePhone } from "@/lib/validations";
import { INDIAN_COURTS, INDIAN_CITIES, INDIAN_LANGUAGES } from "@/data/courts";
import { nearestServiceCity, DEFAULT_CITY } from "@/lib/geo";
import type { LawyerAward, LegalCategory } from "@/types";

export const Route = createFileRoute("/lawyer/profile")({
  component: LawyerProfilePage,
});

interface PracticeEntry {
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
  if (lower.includes("tax")) return "Tax";
  return "Civil";
}

function LawyerProfilePage() {
  const { user } = useAuth();
  const [lawyers, setLawyers] = useState(getLawyers);

  useEffect(() => {
    const sync = () => setLawyers(getLawyers());
    return subscribeToStore(sync);
  }, []);

  const lawyer = useMemo(() => {
    if (user?.id) {
      const found = lawyers.find((l) => l.id === user.id || l.email === user.email);
      if (found) return found;
    }
    return lawyers[0];
  }, [lawyers, user]);

  if (!lawyer) return null;

  return <LawyerProfileForm lawyer={lawyer} />;
}

function LawyerProfileForm({ lawyer }: { lawyer: NonNullable<ReturnType<typeof getLawyers>[0]> }) {
  const [saved, setSaved] = useState(false);

  // Profile Basic Info
  const [name, setName] = useState(lawyer.name);
  const [roleTitle, setRoleTitle] = useState(lawyer.roleTitle || "Advocate");
  const [email, setEmail] = useState(lawyer.email);
  const [phone, setPhone] = useState(lawyer.phone);
  const [city, setCity] = useState(lawyer.city);
  const [cities, setCities] = useState<string[]>(lawyer.cities || [lawyer.city]);
  const [currentLocation, setCurrentLocation] = useState(
    lawyer.currentLocation || `${DEFAULT_CITY.name}, ${DEFAULT_CITY.state}`,
  );
  const [isLocating, setIsLocating] = useState(false);

  // Credentials & Registration Details
  const [barId, setBarId] = useState(lawyer.barId || "");
  const [experienceYears, setExperienceYears] = useState(lawyer.experienceYears || 5);
  const [officeAddress, setOfficeAddress] = useState(lawyer.officeAddress || "");
  const [bio, setBio] = useState(lawyer.bio || "");
  // Admin-controlled suspension locks the lawyer out of changing their own
  // online/offline presence — the toggle greys out and reads "Suspended".
  const suspended = lawyer.status === "Suspended";
  const [availabilityStatus, setAvailabilityStatus] = useState<"Online" | "Offline">(
    lawyer.availabilityStatus === "Offline" ? "Offline" : "Online",
  );
  const [pendingStatus, setPendingStatus] = useState<"Online" | "Offline" | null>(null);
  const [consultationFee, setConsultationFee] = useState<string>(
    String(lawyer.consultationFee ?? 1500),
  );

  // ID Proof File
  const [idProofFileName, setIdProofFileName] = useState(
    lawyer.idProofFileName || (lawyer.idProofUrl ? "ID_Proof_Verified.pdf" : ""),
  );
  const [idProofUrl, setIdProofUrl] = useState(lawyer.idProofUrl || "");
  const idProofInputRef = useRef<HTMLInputElement>(null);

  // Languages & Courts
  const [languages, setLanguages] = useState<string[]>(lawyer.languages || ["English", "Telugu"]);
  const [courts, setCourts] = useState<string[]>(
    lawyer.courts || ["High Court of Telangana", "District & Sessions Court, Visakhapatnam"],
  );

  // Awards
  const [awards, setAwards] = useState<LawyerAward[]>(lawyer.awards || []);
  const [awardTitle, setAwardTitle] = useState("");
  const [awardYear, setAwardYear] = useState("");

  // Bank Account Details — one-time entry; locked once saved
  const bankDetailsLocked = Boolean(lawyer.accountNumber && lawyer.ifscCode);
  const [bankName, setBankName] = useState(lawyer.bankName || "");
  const [accountNumber, setAccountNumber] = useState(lawyer.accountNumber || "");
  const [ifscCode, setIfscCode] = useState(lawyer.ifscCode || "");

  // Live master entities from Admin Data Management
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

  // Practice Areas & 3-Tier Multi-Select State
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>("");
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [selectedServicesMulti, setSelectedServicesMulti] = useState<string[]>([]);
  const [practiceError, setPracticeError] = useState("");

  // Initialize selected practice entries from stored lawyer data
  const [selectedPracticeEntries, setSelectedPracticeEntries] = useState<PracticeEntry[]>(() => {
    if (lawyer.legalServices && lawyer.legalServices.length > 0) {
      return lawyer.legalServices.map((ls, idx) => ({
        id: `init-${idx}`,
        practiceArea: lawyer.category ? `${lawyer.category} Law` : "Civil Law",
        specialization: lawyer.specializations?.[0] || "Litigation",
        legalService: ls,
      }));
    }
    return [
      {
        id: "default-1",
        practiceArea: lawyer.category ? `${lawyer.category} Law` : "Civil Law",
        specialization: lawyer.specializations?.[0] || "High Court Practice",
        legalService: "General Practice & Consultation",
      },
    ];
  });

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

  const handlePracticeAreaChange = (val: string) => {
    setSelectedPracticeArea(val);
    setSelectedSpecialization("");
    setSelectedServicesMulti([]);
    setPracticeError("");
  };

  const handleSpecializationChange = (val: string) => {
    setSelectedSpecialization(val);
    setPracticeError("");
    const spec = availableSpecializations.find((s) => s.case_type === val);
    if (spec && spec.legal_services) {
      setSelectedServicesMulti([...spec.legal_services]);
    } else {
      setSelectedServicesMulti([]);
    }
  };

  const toggleServiceInMulti = (serviceName: string) => {
    setSelectedServicesMulti((prev) =>
      prev.includes(serviceName) ? prev.filter((s) => s !== serviceName) : [...prev, serviceName],
    );
  };

  const selectAllServicesInSpec = () => {
    if (selectedServicesMulti.length === availableLegalServices.length) {
      setSelectedServicesMulti([]);
    } else {
      setSelectedServicesMulti([...availableLegalServices]);
    }
  };

  const handleAddPracticeEntries = () => {
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
  };

  const removePracticeEntry = (id: string) => {
    setSelectedPracticeEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const clearAllPracticeEntries = () => {
    setSelectedPracticeEntries([]);
  };

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

  const handleAddAward = () => {
    const t = awardTitle.trim();
    if (!t) return;
    setAwards((prev) => [
      ...prev,
      { title: t, year: awardYear.trim() || new Date().getFullYear().toString() },
    ]);
    setAwardTitle("");
    setAwardYear("");
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIdProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setIdProofUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const primaryPractice = selectedPracticeEntries[0]?.practiceArea || "Civil Law";
    const category = mapPracticeAreaToCategory(primaryPractice);
    const specializations = Array.from(
      new Set(selectedPracticeEntries.map((pe) => pe.specialization)),
    );
    const legalServices = Array.from(new Set(selectedPracticeEntries.map((pe) => pe.legalService)));
    const practiceAreas = Array.from(new Set(selectedPracticeEntries.map((pe) => pe.practiceArea)));

    updateLawyerProfile(lawyer.id, {
      name,
      roleTitle,
      email,
      phone,
      city,
      cities: cities.length ? cities : [city],
      currentLocation,
      barId,
      experienceYears,
      officeAddress,
      bio,
      category,
      specializations,
      legalServices,
      practiceAreas,
      languages,
      courts,
      awards,
      idProofFileName,
      idProofUrl,
      // A suspended lawyer can't touch their presence — don't persist it.
      ...(suspended ? {} : { availabilityStatus }),
      consultationFee: Number(consultationFee) || 1500,
      ...(bankDetailsLocked
        ? {}
        : {
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim().toUpperCase(),
          }),
    });

    // Backend sync: Update profile
    lawyerService
      .updateProfile(lawyer.id, {
        name,
        bio,
        consultationFee: Number(consultationFee) || 1500,
        experienceYears: Number(experienceYears) || 0,
        cities: cities.length ? cities : [city],
        practiceAreas,
        specializations,
        legalServices,
        languages,
      })
      .catch((err: unknown) => {
        console.warn("[Lawyer Profile] Server profile update notice:", err);
      });

    // Backend sync: Update availability (if not suspended)
    if (!suspended) {
      lawyerService.toggleAvailability(lawyer.id, availabilityStatus).catch((err: unknown) => {
        console.warn("[Lawyer Profile] Server availability update notice:", err);
      });
    }

    // Backend sync: Update bank details if provided and unlocked
    if (!bankDetailsLocked && bankName.trim() && accountNumber.trim() && ifscCode.trim()) {
      lawyerService
        .updateBankDetails(lawyer.id, {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifscCode: ifscCode.trim().toUpperCase(),
          accountHolderName: name.trim(),
        })
        .catch((err: unknown) => {
          console.warn("[Lawyer Profile] Server bank details update notice:", err);
        });
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const isFirm =
    roleTitle.toLowerCase().includes("firm") || roleTitle.toLowerCase().includes("organisation");

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Profile"
        description="Manage your advocate profile, practice credentials, and registration details."
        actionsPosition="below"
      />

      <form className="w-full max-w-4xl mx-auto space-y-6" onSubmit={handleSubmit}>
        {/* Hero Header Card */}
        <div className="rounded-2xl border border-border/80 bg-gradient-to-r from-primary/[0.04] via-surface to-primary/[0.04] p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="shrink-0">
              <AvatarUploadField
                role="lawyer"
                name={name}
                defaultPhotoUrl={lawyer.photoUrl || "/lawyer-login.png"}
                centered
                status={
                  suspended ? "suspended" : availabilityStatus === "Offline" ? "offline" : "online"
                }
              />
            </div>
            <div className="space-y-2.5 text-center sm:text-left min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold text-foreground truncate max-w-md">
                  {name || "Advocate"}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  {lawyer.status === "Approved" ? "Verified Advocate" : "Registration Verified"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {lawyer.rating.toFixed(1)} ({lawyer.ratingCount ?? 0})
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => setRoleTitle("Advocate")}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                    !isFirm
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Individual Lawyer
                </button>
                <button
                  type="button"
                  onClick={() => setRoleTitle("Law Firm / Organisation")}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                    isFirm
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  Law Firm / Organisation
                </button>
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
                    +91 {phone}
                  </span>
                )}
                {barId && (
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-foreground">
                    <Briefcase className="h-3.5 w-3.5 text-primary/70" />
                    {barId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Availability & Consultation Pricing Card */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
          <div className="flex flex-wrap items-center justify-between border-b border-border/60 pb-3 gap-2">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" /> Availability & Consultation Pricing
            </h3>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                suspended
                  ? "border-border bg-muted text-muted-foreground"
                  : availabilityStatus === "Online"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
              }`}
            >
              {suspended ? (
                <X className="h-3 w-3 stroke-3" />
              ) : (
                <span
                  className={`h-2 w-2 rounded-full ${
                    availabilityStatus === "Online" ? "animate-pulse bg-emerald-500" : "bg-red-500"
                  }`}
                />
              )}
              {suspended ? "Suspended" : availabilityStatus === "Online" ? "Online" : "Offline"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Availability Status Toggle — Online / Offline, or a locked
                Suspended state the lawyer can't change (admin-only). */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                Account Availability Status
              </label>

              {suspended ? (
                <>
                  <div className="grid h-9 grid-cols-2 gap-2 rounded-xl border border-border bg-muted p-1 opacity-60">
                    <span className="flex items-center justify-center gap-2 rounded-lg text-xs font-extrabold text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                      Online
                    </span>
                    <span className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-surface text-xs font-extrabold text-red-600 dark:text-red-400">
                      <X className="h-3.5 w-3.5 stroke-3" />
                      Suspended
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-600 dark:text-red-400">
                    Your account has been <strong>suspended by an administrator</strong>. Your
                    profile is hidden from citizens and your availability is locked until it is
                    reinstated.
                  </p>
                </>
              ) : (
                <>
                  <div className="grid h-9 grid-cols-2 gap-2 rounded-xl border border-border bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (availabilityStatus !== "Online") setPendingStatus("Online");
                      }}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg text-xs font-extrabold transition-all ${
                        availabilityStatus === "Online"
                          ? "border border-emerald-500/30 bg-surface text-emerald-600 shadow-xs dark:text-emerald-400"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Online
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (availabilityStatus !== "Offline") setPendingStatus("Offline");
                      }}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg text-xs font-extrabold transition-all ${
                        availabilityStatus === "Offline"
                          ? "border border-red-500/30 bg-surface text-red-600 shadow-xs dark:text-red-400"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Offline
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    When <strong>Online</strong>, your advocate profile is listed in citizen law hub
                    search results, and a green dot shows on your photo everywhere. Offline shows a
                    red dot and pauses new assignments.
                  </p>
                </>
              )}
            </div>

            {/* Consultation Fee Input Field */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wide">
                Consultation Fee (₹)
              </label>
              <TextField
                type="number"
                value={consultationFee}
                onChange={(v) => setConsultationFee(v.replace(/\D/g, ""))}
                placeholder="1500"
                prefixText="₹"
                leadingIcon={<IndianRupee className="h-4 w-4 text-primary/70" />}
                className="w-full font-mono font-bold"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                This fee will be displayed to citizens picking an advocate during case filing, and
                the final payment amount will update accordingly.
              </p>
            </div>
          </div>
        </div>

        {/* Personal & Contact Details */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Personal & Contact Details
            </h3>
          </div>

          <div className="space-y-4">
            <TextField
              label={isFirm ? "Organisation Name" : "Full Name (Letters Only)"}
              value={name}
              onChange={(v) => setName(sanitizeName(v))}
              placeholder={isFirm ? "M/s. Reddy & Associates" : "Adv. Swathi Reddy"}
              leadingIcon={<User className="h-4 w-4 text-primary/70" />}
              className="w-full"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="swathi@law.com"
                leadingIcon={<Mail className="h-4 w-4 text-primary/70" />}
                className="w-full"
              />
              <TextField
                label="Phone Number (10 Digits)"
                type="tel"
                value={phone}
                onChange={(v) => setPhone(sanitizePhone(v))}
                placeholder="98100 12345"
                prefixText="+91"
                leadingIcon={<PhoneIcon className="h-4 w-4 text-primary/70" />}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Location & Service Areas */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" /> Location & Service Districts
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Primary District"
              value={city}
              onChange={setCity}
              placeholder="e.g. Hyderabad, Visakhapatnam"
              leadingIcon={<Building2 className="h-4 w-4 text-primary/70" />}
              className="w-full"
            />

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
                  title="Refresh detected location"
                  aria-label="Refresh location"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLocating ? "animate-spin" : ""}`} />
                </button>
              }
              className="w-full"
            />
          </div>

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

          <TextField
            label="Office / Chamber Address"
            type="textarea"
            rows={2}
            value={officeAddress}
            onChange={setOfficeAddress}
            placeholder="Chamber No. 402, High Court Complex, Hyderabad"
            className="w-full"
          />
        </div>

        {/* Credentials & ID Proof */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0" />
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Bar Credentials & ID Verification
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted/80 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              <Lock className="h-3 w-3 text-emerald-600" /> Admin Verified
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Bar Council Registration ID"
              value={barId}
              onChange={setBarId}
              placeholder="TS/2014/1023"
              className="w-full font-mono tracking-wider"
            />
            <TextField
              label="Years of Experience"
              type="number"
              value={String(experienceYears)}
              onChange={(v) => setExperienceYears(Math.min(50, Math.max(1, Number(v) || 1)))}
              className="w-full"
            />
          </div>

          <div className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3.5">
            <span className="block text-xs font-semibold text-foreground">ID Proof Document</span>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="outlined"
                icon={<Upload className="h-3.5 w-3.5" />}
                onClick={() => idProofInputRef.current?.click()}
              >
                {idProofFileName ? "Replace Document" : "Upload ID Proof"}
              </Button>

              {idProofFileName ? (
                <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-1.5 border border-border/60 text-xs text-foreground">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-semibold truncate max-w-xs">{idProofFileName}</span>
                  {idProofUrl && (
                    <a
                      href={idProofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-primary hover:underline ml-1"
                    >
                      Preview
                    </a>
                  )}
                  <IconButton
                    onClick={() => {
                      setIdProofFileName("");
                      setIdProofUrl("");
                    }}
                    ariaLabel="Remove document"
                  >
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  Aadhaar, Bar ID, or PAN (PDF/JPG up to 5MB)
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
          </div>
        </div>

        {/* Multi-Tier Practice Areas & Legal Services */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" /> Practice Areas & Legal Services
            </h3>
            <Button
              type="button"
              variant="filled"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={handleAddPracticeEntries}
              className="justify-self-end shadow-xs"
            >
              Add to Active Practice Areas
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3">
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

            {selectedSpecialization && availableLegalServices.length > 0 && (
              <div className="space-y-1.5 rounded-xl border border-border bg-muted/30 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    Legal Services ({availableLegalServices.length})
                  </span>
                  <Button
                    type="button"
                    variant="text"
                    onClick={selectAllServicesInSpec}
                    className="h-auto! min-h-0! px-0! text-[10px] text-primary hover:underline"
                  >
                    {selectedServicesMulti.length === availableLegalServices.length
                      ? "Deselect all"
                      : "Select all"}
                  </Button>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {availableLegalServices.map((service) => {
                    const isChecked = selectedServicesMulti.includes(service);
                    return (
                      <label
                        key={service}
                        className="flex items-center gap-2 rounded-lg p-1 text-xs text-foreground hover:bg-background/80 cursor-pointer select-none"
                      >
                        <Checkbox
                          checked={isChecked}
                          onChange={() => toggleServiceInMulti(service)}
                        />
                        <span className="flex-1 leading-snug">{service}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {practiceError && (
              <p className="text-xs font-medium text-destructive">{practiceError}</p>
            )}
          </div>

          <div className="pt-2">
            {selectedPracticeEntries.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Active Practice Specializations ({selectedPracticeEntries.length})
                  </span>
                  <Button
                    type="button"
                    variant="text"
                    icon={<Trash2 className="h-3 w-3" />}
                    onClick={clearAllPracticeEntries}
                    className="h-auto! min-h-0! px-0! text-[11px] text-destructive hover:underline"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
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
            ) : (
              <p className="text-center text-[11px] text-muted-foreground py-2">
                No practice categories added yet. Select area & specialization above.
              </p>
            )}
          </div>
        </div>

        {/* Bio / Professional Overview */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Professional Bio & Overview
            </h3>
          </div>

          <TextField
            label="Advocate Bio / Practice Profile"
            type="textarea"
            rows={3}
            value={bio}
            onChange={setBio}
            placeholder="Tell clients about your practice background, legal track record, court experience, and approach…"
            className="w-full"
          />
        </div>

        {/* Languages & Courts Practiced */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Languages & Court Jurisdictions
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TagDropdownField
              label="Languages Spoken"
              placeholder="-- Select Language --"
              options={managedLanguages.length > 0 ? managedLanguages : INDIAN_LANGUAGES}
              values={languages}
              onAdd={(val) => {
                if (val && !languages.includes(val)) {
                  setLanguages((prev) => [...prev, val]);
                }
              }}
              onRemove={(i) => setLanguages((prev) => prev.filter((_, idx) => idx !== i))}
            />

            <CourtsDropdownField
              label="Courts Practiced In"
              options={managedCourts.length > 0 ? managedCourts : INDIAN_COURTS}
              values={courts}
              onAdd={(val) => {
                if (val && !courts.includes(val)) {
                  setCourts((prev) => [...prev, val]);
                }
              }}
              onRemove={(i) => setCourts((prev) => prev.filter((_, idx) => idx !== i))}
            />
          </div>
        </div>

        {/* Awards & Recognition */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> Awards & Recognition
            </h3>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <TextField
              value={awardTitle}
              onChange={setAwardTitle}
              placeholder="e.g. Best Criminal Defense Advocate"
              className="sm:flex-1"
            />
            <div className="flex gap-2">
              <TextField
                value={awardYear}
                onChange={setAwardYear}
                placeholder="2025"
                className="w-28"
              />
              <Button type="button" variant="outlined" onClick={handleAddAward}>
                Add
              </Button>
            </div>
          </div>

          {awards.length > 0 && (
            <ul className="mt-2 max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {awards.map((a, i) => (
                <li
                  key={`${a.title}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/30 px-3.5 py-2 text-xs"
                >
                  <span className="font-semibold text-foreground">
                    {a.title} <span className="font-normal text-muted-foreground">({a.year})</span>
                  </span>
                  <IconButton
                    onClick={() => setAwards((prev) => prev.filter((_, x) => x !== i))}
                    ariaLabel={`Remove ${a.title}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bank Account Details */}
        <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
          <div className="border-b border-border/60 pb-3">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2">
              <Landmark className="h-4 w-4 text-primary" /> Bank Account Details
            </h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {bankDetailsLocked
                ? "Your bank details are on file and locked for security. Contact support to update them."
                : "Add your bank account once to enable withdrawals. Account number and IFSC code can only be entered here one time."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TextField
              label="Bank Name"
              value={bankName}
              onChange={setBankName}
              placeholder="e.g. State Bank of India"
              disabled={bankDetailsLocked}
            />
            <TextField
              label="Account Number"
              value={bankDetailsLocked ? `••••••••${accountNumber.slice(-4)}` : accountNumber}
              onChange={(v) => setAccountNumber(v.replace(/\D/g, ""))}
              placeholder="Enter account number"
              disabled={bankDetailsLocked}
              trailingIcon={
                bankDetailsLocked ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : undefined
              }
            />
            <TextField
              label="IFSC Code"
              value={bankDetailsLocked ? `••••${ifscCode.slice(-4)}` : ifscCode}
              onChange={(v) => setIfscCode(v.toUpperCase())}
              placeholder="e.g. SBIN0001234"
              disabled={bankDetailsLocked}
              trailingIcon={
                bankDetailsLocked ? (
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                ) : undefined
              }
            />
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-surface/95 p-4 shadow-2xs">
          <span className="text-xs text-muted-foreground font-medium">
            Keep your advocate profile updated for client matching and search accuracy.
          </span>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 animate-in fade-in duration-200">
                <CheckCircle2 className="h-4 w-4" /> Lawyer profile saved successfully!
              </span>
            )}
            <Button type="submit" variant="filled" className="px-6 font-bold">
              Save Profile Changes
            </Button>
          </div>
        </div>

        {/* Confirmation Dialog for the Online / Offline availability switch */}
        <ConfirmDialog
          open={pendingStatus !== null}
          title={pendingStatus === "Offline" ? "Go Offline?" : "Go Online?"}
          message={
            pendingStatus === "Offline"
              ? "Going Offline hides you from citizen law hub search results and pauses new case assignments until you go back Online. A red dot will show on your photo everywhere."
              : "Going Online lists you in citizen law hub search results for immediate case assignments. A green dot will show on your photo everywhere."
          }
          confirmLabel={pendingStatus === "Offline" ? "Go Offline" : "Go Online"}
          cancelLabel="Cancel"
          variant="warning"
          onConfirm={() => {
            if (pendingStatus) {
              setAvailabilityStatus(pendingStatus);
              updateLawyerProfile(lawyer.id, { availabilityStatus: pendingStatus });
              lawyerService.toggleAvailability(lawyer.id, pendingStatus).catch((err: unknown) => {
                console.warn("[Lawyer Profile] Availability toggle server notice:", err);
              });
              setPendingStatus(null);
            }
          }}
          onCancel={() => setPendingStatus(null)}
        />
      </form>
    </div>
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
    <div className="space-y-2">
      <Select
        label={label}
        value={selectedVal}
        onChange={handleSelect}
        options={availableOptions.map((opt) => ({ value: opt, label: opt }))}
        supportingText={placeholder}
        className="w-full"
      />
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          {values.map((v) => (
            <InputChip key={v} label={v} onRemove={() => onRemove(values.indexOf(v))} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourtsDropdownField({
  label,
  values,
  options,
  onAdd,
  onRemove,
}: {
  label: string;
  values: string[];
  options?: string[];
  onAdd: (val: string) => void;
  onRemove: (index: number) => void;
}) {
  const [selectedCourt, setSelectedCourt] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const courtPool = options && options.length > 0 ? options : INDIAN_COURTS;

  const filteredCourts = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return courtPool.filter((c) => !values.includes(c) && (q ? c.toLowerCase().includes(q) : true));
  }, [searchFilter, values, courtPool]);

  const handleAddCourt = (courtName: string) => {
    if (!courtName) return;
    onAdd(courtName);
    setSelectedCourt("");
  };

  return (
    <div className="space-y-2">
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <TextField
            label={label}
            value={searchFilter}
            onChange={setSearchFilter}
            placeholder="Search courts…"
            className="flex-1"
          />
          {searchFilter && (
            <Button type="button" variant="outlined" onClick={() => setSearchFilter("")}>
              Clear
            </Button>
          )}
        </div>

        <Select
          label="Select court to add"
          value={selectedCourt}
          onChange={(val) => {
            setSelectedCourt(val);
            if (val) handleAddCourt(val);
          }}
          options={filteredCourts.map((c) => ({ value: c, label: c }))}
          supportingText={
            filteredCourts.length === 0
              ? "No matching courts found"
              : `${filteredCourts.length} courts available`
          }
          className="w-full"
        />
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
          {values.map((v) => (
            <InputChip
              key={v}
              label={v}
              icon={<Scale className="h-3 w-3" />}
              onRemove={() => onRemove(values.indexOf(v))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
