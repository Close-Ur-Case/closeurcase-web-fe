import type { ReactNode } from "react";
import {
  AlertTriangle,
  Award,
  Briefcase,
  Landmark,
  Languages,
  Mail,
  MapPin,
  Phone,
  ScrollText,
  ShieldCheck,
  Star,
  XCircle,
  IndianRupee,
} from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import type { Lawyer } from "@/types";

const STATUS_STYLE: Record<
  Lawyer["status"],
  { color: string; label: string; icon: typeof ShieldCheck }
> = {
  Approved: { color: "var(--md-extended-color-success)", label: "Verified", icon: ShieldCheck },
  Pending: {
    color: "var(--md-extended-color-warning)",
    label: "Pending Verification",
    icon: AlertTriangle,
  },
  Suspended: { color: "var(--md-sys-color-on-surface-variant)", label: "Suspended", icon: XCircle },
  Rejected: { color: "var(--md-sys-color-error)", label: "Rejected", icon: XCircle },
};

/**
 * Full Lawyer profile display — shared between the citizen "Lawyer
 * detail" route and the admin Lawyer review dialog so both surfaces stay
 * in sync as new profile fields are added.
 */
export function LawyerProfileCard({
  lawyer,
  className = "",
}: {
  lawyer: Lawyer;
  className?: string;
}) {
  const status = STATUS_STYLE[lawyer.status];
  const StatusIcon = status.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
        <UserAvatar name={lawyer.name} photoUrl={lawyer.photoUrl} size="lg" role="lawyer" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="text-lg font-bold text-foreground">{lawyer.name}</h2>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor: `color-mix(in srgb, ${status.color} 15%, transparent)`,
                color: status.color,
              }}
            >
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs font-semibold text-primary">{lawyer.category} Law</p>

          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1">
              <Star
                className="h-3.5 w-3.5"
                style={{
                  fill: "var(--md-extended-color-warning)",
                  color: "var(--md-extended-color-warning)",
                }}
              />
              <span className="font-bold text-foreground">{lawyer.rating.toFixed(1)}</span>
              <span className="font-medium text-muted-foreground">({lawyer.ratingCount ?? 0})</span>
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {lawyer.city}
            </span>
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" /> {lawyer.experienceYears} yrs experience
            </span>
          </div>

          {lawyer.languages && lawyer.languages.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 sm:justify-start">
              <Languages className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{lawyer.languages.join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      {lawyer.bio && <p className="text-xs leading-relaxed text-muted-foreground">{lawyer.bio}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoRow
          icon={<ScrollText className="h-4 w-4" />}
          label="Bar Reg. ID"
          value={lawyer.barId}
          mono
        />
        <InfoRow
          icon={<IndianRupee className="h-4 w-4" />}
          label="Consultation Fee"
          value={`₹${(lawyer.consultationFee ?? 1500).toLocaleString("en-IN")}`}
          mono
        />
        <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={lawyer.email} />
        <InfoRow icon={<Phone className="h-4 w-4" />} label="Phone" value={lawyer.phone} />
        {lawyer.officeAddress && (
          <InfoRow
            icon={<MapPin className="h-4 w-4" />}
            label="Office Address"
            value={lawyer.officeAddress}
            span
          />
        )}
      </div>

      {lawyer.practiceAreas && lawyer.practiceAreas.length > 0 && (
        <div className="space-y-2">
          <SectionTitle icon={<Briefcase className="h-3.5 w-3.5" />}>Practice Areas</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {lawyer.practiceAreas.map((pa, idx) => {
              const name = typeof pa === "string" ? pa : pa?.name;
              return (
                <span
                  key={name || idx}
                  className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {lawyer.specializations && lawyer.specializations.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>Specialization</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {lawyer.specializations.map((s) => (
              <span
                key={s}
                className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {lawyer.legalServices && lawyer.legalServices.length > 0 && (
        <div className="space-y-2">
          <SectionTitle>Legal Services</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {lawyer.legalServices.map((s) => (
              <span
                key={s}
                className="rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {lawyer.courts && lawyer.courts.length > 0 && (
        <div className="space-y-2">
          <SectionTitle icon={<Landmark className="h-3.5 w-3.5" />}>
            Courts Practiced In
          </SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {lawyer.courts.map((c) => (
              <span
                key={c}
                className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {lawyer.awards && lawyer.awards.length > 0 && (
        <div className="space-y-2">
          <SectionTitle icon={<Award className="h-3.5 w-3.5" />}>
            Awards &amp; Recognition
          </SectionTitle>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {lawyer.awards.map((a, i) => (
              <div
                key={`${a.title}-${i}`}
                className="flex items-center gap-2.5 rounded-xl border px-3 py-2"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--md-extended-color-warning) 35%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--md-extended-color-warning) 10%, transparent)",
                }}
              >
                <Award
                  className="h-4 w-4 shrink-0"
                  style={{ color: "var(--md-extended-color-warning)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[11px] font-bold text-foreground" title={a.title}>
                    {a.title}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{a.year}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
      {icon}
      {children}
    </h3>
  );
}

function InfoRow({
  icon,
  label,
  value,
  mono,
  span,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  /** Full-width on >= sm (for long values like an office address). */
  span?: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-linear-to-b from-surface to-muted/40 px-3.5 py-3 shadow-2xs transition-shadow hover:shadow-sm ${
        span ? "sm:col-span-2" : ""
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div
          className={`mt-0.5 text-[13px] font-semibold leading-snug wrap-break-word text-foreground ${
            mono ? "font-mono" : ""
          }`}
          title={value}
        >
          {value}
        </div>
      </div>
    </div>
  );
}
