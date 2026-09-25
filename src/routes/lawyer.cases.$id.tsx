import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCases, getLawyers, updateCaseFields, subscribeToStore } from "@/data/appStore";
import { useCaseDetailSync } from "@/hooks/useCaseSync";
import { useAuth } from "@/context/useAuth";
import type { LegalCase } from "@/types";
import { StatusDot } from "@/components/app/StatusDot";
import { PageHeader } from "@/components/app/PageHeader";
import { TextField, Button } from "@/components/m3";
import {
  STORED_STATUS_TO_FILTER,
  PRE_CNR_STAGES,
  fmtDate,
  getCourtHistory,
  getStageHistory,
} from "@/components/app/caseDocketShared";
import {
  ArrowLeft,
  ChevronRight,
  Printer,
  Landmark,
  MapPin,
  User,
  Users,
  Link2,
  Download,
  CalendarClock,
  Gavel,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileText,
  MessageCircle,
} from "lucide-react";

export const Route = createFileRoute("/lawyer/cases/$id")({
  component: LawyerCaseDetailPage,
});

function formatDate(iso?: string) {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MetaLine({ parts }: { parts: (React.ReactNode | false | undefined)[] }) {
  const filtered = parts.filter(Boolean);
  if (filtered.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
      {filtered.map((p, i) => (
        <span key={i} className="flex items-center gap-x-2">
          {i > 0 && <span className="opacity-40">·</span>}
          {p}
        </span>
      ))}
    </div>
  );
}

export function LawyerCaseDetailPage() {
  const { id } = Route.useParams();
  const [cases, setCases] = useState<LegalCase[]>(getCases);
  // Re-syncs this case's full docket; the merge notifies the store subscription below.
  const { isSyncing } = useCaseDetailSync(id);

  useEffect(() => {
    return subscribeToStore(() => setCases(getCases()));
  }, []);

  const c = cases.find((x) => x.id === id);
  const { user } = useAuth();
  const currentLawyerId = user?.lawyerId || user?.id;
  const lawyersList = getLawyers();
  const currentLawyer = lawyersList.find(
    (l) =>
      (currentLawyerId && (l.id === currentLawyerId || l.id === user?.id)) ||
      (user?.email && l.email?.toLowerCase() === user.email.toLowerCase()),
  );

  const isMyCase =
    c &&
    ((currentLawyerId && (c.lawyerId === currentLawyerId || c.lawyerId === user?.id)) ||
      (currentLawyer &&
        (c.lawyerId === currentLawyer.id ||
          (currentLawyer.name &&
            c.lawyerName?.trim().toLowerCase() === currentLawyer.name.trim().toLowerCase()))));

  // A case that only exists server-side isn't "not found" until its fetch settles.
  if (!c && isSyncing) {
    return (
      <div className="space-y-4">
        <PageHeader title="Loading case…" />
        <p className="text-sm text-muted-foreground">Fetching case {id} from the server.</p>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="space-y-4">
        <PageHeader title="Case not found" />
        <p className="text-sm text-muted-foreground">No case found with ID &quot;{id}&quot;.</p>
        <Link to="/lawyer/cases">
          <Button variant="outlined">Back to My Cases</Button>
        </Link>
      </div>
    );
  }

  if (c && !isMyCase) {
    return (
      <div className="space-y-4">
        <PageHeader title="Access Denied" />
        <p className="text-sm text-muted-foreground">
          You do not have permission to view or manage this case docket.
        </p>
        <Link to="/lawyer/cases">
          <Button variant="outlined">Back to My Cases</Button>
        </Link>
      </div>
    );
  }

  return <LawyerCaseDetailBody caseItem={c} />;
}

function LawyerCaseDetailBody({
  caseItem: c,
  readOnly = false,
}: {
  caseItem: LegalCase;
  readOnly?: boolean;
}) {
  const cd = c.caseDetails;
  const [showLawyers, setShowLawyers] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const nextHearing = [...cd.historyOfCaseHearings]
    .filter((h) => h.hearingDate && h.hearingDate >= today)
    .sort((a, b) => (a.hearingDate ?? "").localeCompare(b.hearingDate ?? ""))[0];

  return (
    <div className="space-y-5">
      <PageHeader
        title={c.title}
        actions={
          <Button
            variant="outlined"
            icon={<Printer className="h-4 w-4" />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        }
      />

      {/* Back Button */}
      <div className="-mt-3">
        <Link
          to="/lawyer/cases"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted transition-all shadow-2xs"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-primary" />
          <span>Back to My Cases</span>
        </Link>
      </div>

      {/* Header card */}
      <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-2xs space-y-4">
        {/* Case facts */}
        <div className="space-y-2.5 border-b border-border pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MetaLine
              parts={[
                cd.caseNumber && (
                  <span className="font-mono font-bold text-foreground">{cd.caseNumber}</span>
                ),
                cd.courtName && (
                  <span className="inline-flex items-center gap-1.5 text-foreground/90">
                    <Landmark className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {cd.courtName}
                  </span>
                ),
                c.lawyerName && (
                  <span className="text-foreground/90">
                    Lawyer: <span className="font-semibold text-foreground">{c.lawyerName}</span>
                  </span>
                ),
              ]}
            />
            <StatusDot status={c.status} />
          </div>

          <MetaLine
            parts={[
              cd.cnr && (
                <span className="text-foreground/90">
                  CNR Number: <span className="font-mono font-bold text-foreground">{cd.cnr}</span>
                </span>
              ),
              cd.purpose && (
                <span className="text-foreground/90">
                  Stage: <span className="font-bold text-foreground">{cd.purpose}</span>
                </span>
              ),
              cd.filingDate && (
                <span className="text-foreground/90">
                  Filing Date:{" "}
                  <span className="font-semibold text-foreground">{formatDate(cd.filingDate)}</span>
                </span>
              ),
            ]}
          />

          {(cd.petitionerAdvocates.length > 0 || cd.respondentAdvocates.length > 0) && (
            <div>
              <button
                onClick={() => setShowLawyers((v) => !v)}
                className="inline-flex cursor-pointer items-center gap-1 text-sm font-bold text-primary hover:underline"
              >
                Petitioner & Respondent Lawyers
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${showLawyers ? "rotate-90" : ""}`}
                />
              </button>
              {showLawyers && (
                <div className="mt-2 space-y-1.5 rounded-xl border border-border bg-background p-3 text-sm">
                  {cd.petitioners.length > 0 && (
                    <p>
                      <span className="font-bold text-foreground">Petitioner:</span>{" "}
                      <span className="text-foreground/80">
                        {cd.petitioners.join(", ")}
                        {cd.petitionerAdvocates.length
                          ? ` — Adv. ${cd.petitionerAdvocates.join(", ")}`
                          : ""}
                      </span>
                    </p>
                  )}
                  {cd.respondents.length > 0 && (
                    <p>
                      <span className="font-bold text-foreground">Respondent:</span>{" "}
                      <span className="text-foreground/80">
                        {cd.respondents.join(", ")}
                        {cd.respondentAdvocates.length
                          ? ` — Adv. ${cd.respondentAdvocates.join(", ")}`
                          : ""}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next hearing + client */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
          {nextHearing?.hearingDate && (
            <div
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--md-extended-color-warning) 10%, transparent)",
                color: "var(--md-extended-color-warning)",
              }}
            >
              <CalendarClock className="h-4 w-4 shrink-0" />
              Next Hearing: <span className="font-bold">{formatDate(nextHearing.hearingDate)}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 text-sm text-foreground/90">
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            Client: <span className="font-bold text-foreground">{c.citizenName}</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <CaseHistoryTab caseItem={c} />
      </div>
    </div>
  );
}

/* ───────────────────────────── Case History tab ─────────────────────────────
   Folds together: KPI stat strip, court-record facts, FIR details (criminal
   cases), this app's own pre-CNR "Stage History" pipeline, the eCourts-shaped
   Case History table (Judge / Business on Date / Hearing Date / Purpose of
   Listing — per case_structure.json's historyOfCaseHearings, with inline
   add/edit/delete for lawyers), and Interim/Judgment Orders. */

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3.5 py-3 text-center">
      <div className="text-lg font-bold text-foreground">{value}</div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

function CaseHistoryTab({ caseItem: c }: { caseItem: LegalCase }) {
  const cd = c.caseDetails;

  const filterKey = STORED_STATUS_TO_FILTER[c.status] ?? c.status;
  const showStageHistory = PRE_CNR_STAGES.includes(filterKey);
  const courtHistory = getCourtHistory(c);
  const categoryPath = cd.caseCategoryFacetPath?.split("/").filter(Boolean) ?? [];
  const hasOrders = cd.interimOrders.length > 0 || cd.judgmentOrders.length > 0;

  return (
    <div className="space-y-5">
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <StatTile label="Hearings" value={cd.hearingCount} />
        <StatTile label="Orders" value={cd.orderCount} />
        <StatTile label="Judgments" value={cd.judgmentCount} />
        <StatTile label="IAs" value={cd.iaCount} />
        <StatTile label="Duration (days)" value={cd.caseDurationDays ?? "—"} />
      </div>

      {/* Court Info */}
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary">
          Court Information
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          {cd.caseType && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Case Type
              </div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">
                {cd.caseTypeRaw || cd.caseType}
              </div>
            </div>
          )}
          {cd.registrationDate && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Registration Date
              </div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">
                {fmtDate(cd.registrationDate)}
              </div>
            </div>
          )}
          {cd.firstHearingDate && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                First Hearing
              </div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">
                {fmtDate(cd.firstHearingDate)}
              </div>
            </div>
          )}
          {cd.decisionDate && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Decision Date
              </div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">
                {fmtDate(cd.decisionDate)}
              </div>
            </div>
          )}
        </div>

        {categoryPath.length > 0 && (
          <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {categoryPath.map((part, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                <span
                  className={i === categoryPath.length - 1 ? "font-semibold text-foreground" : ""}
                >
                  {part}
                </span>
              </span>
            ))}
          </div>
        )}

        {cd.disposalType && (
          <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-muted/60 px-3.5 py-2.5">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <div className="text-xs">
              <span className="font-semibold text-foreground">
                {cd.disposalTypeRaw || cd.disposalType}
              </span>
              {cd.contestedStatus && (
                <span className="ml-1.5 text-muted-foreground">({cd.contestedStatus})</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FIR Details — criminal cases only */}
      {cd.firDetails && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <ShieldAlert className="h-3.5 w-3.5" /> FIR Details
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                FIR No.
              </div>
              <div className="mt-0.5 font-mono text-xs font-semibold text-foreground">
                {cd.firDetails.caseNumber}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Police Station
              </div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">
                {cd.firDetails.policeStation}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Year
              </div>
              <div className="mt-0.5 text-xs font-semibold text-foreground">
                {cd.firDetails.year}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Judges */}
      {cd.judges.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Gavel className="h-3.5 w-3.5" /> Judges
          </div>
          <div className="flex flex-wrap gap-2">
            {cd.judges.map((j, i) => (
              <span
                key={i}
                className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
              >
                {j}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stage History — Part 1 of the case journey (Citizen to Lawyer) */}
      {showStageHistory && (
        <div>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary">
            STAGE HISTORY
          </div>
          <div className="relative ml-3 space-y-3.5 border-l-2 border-border py-1 pl-6">
            {/* Derived from the case's real timeline via `getStageHistory` — this used
                to index `c` by the stage label directly (`(c as any)["Pending by
                Lawyer"]`), which is not a property on `LegalCase` and was always
                `undefined`. Every stage rendered as incomplete with no date, and
                nothing was ever marked "Current". */}
            {getStageHistory(c).map((stage) => {
              return (
                <div key={stage.key} className="relative">
                  <span
                    className={`absolute -left-[29px] top-0.5 h-[14px] w-[14px] rounded-full border-2 ${
                      stage.at
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/50 bg-surface"
                    }`}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-xs font-semibold ${
                        stage.isCurrent
                          ? "text-primary"
                          : stage.at
                            ? "text-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {stage.label}
                      {stage.isCurrent && (
                        <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-primary">
                          Current
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                      {stage.at ? fmtDate(stage.at) : "—"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Case History — Part 2 of the case journey (Lawyer to Court), styled
          as the same timestamped vertical timeline as Stage History above. */}
      <div>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary">
          CASE HISTORY
        </div>

        {courtHistory.length === 0 ? (
          <p className="rounded-lg border border-border/60 bg-background p-4 text-center text-xs text-muted-foreground">
            No case history yet.
          </p>
        ) : (
          <div className="relative ml-3 space-y-3.5 border-l-2 border-border py-1 pl-6">
            {[...courtHistory].reverse().map((row) => (
              <div key={row.id} className="relative">
                <span className="absolute -left-[29px] top-0.5 h-[14px] w-[14px] rounded-full border-2 border-primary bg-primary" />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-foreground">
                    {row.purposeOfListing || "Hearing"}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {row.hearingDate
                      ? `${fmtDate(row.hearingDate)}${row.time ? ", " + row.time : ""}`
                      : "—"}
                  </span>
                </div>
                {row.judge && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground">Judge: {row.judge}</div>
                )}
                <div className="text-[11px] text-muted-foreground">
                  Business on Date: {fmtDate(row.businessOnDate)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders */}
      {hasOrders && (
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Gavel className="h-3.5 w-3.5" /> Orders
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Interim Orders ({cd.interimOrders.length})
              </div>
              {cd.interimOrders.length === 0 ? (
                <p className="text-[11px] italic text-muted-foreground">None on file.</p>
              ) : (
                <ul className="space-y-2">
                  {cd.interimOrders.map((o, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-2 rounded-lg border border-border/60 p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-foreground">
                          {fmtDate(o.orderDate)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{o.description}</div>
                      </div>
                      {o.orderUrl && (
                        <Download
                          className="h-3.5 w-3.5 shrink-0 text-primary"
                          aria-label="View order"
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Judgment Orders ({cd.judgmentOrders.length})
              </div>
              {cd.judgmentOrders.length === 0 ? (
                <p className="text-[11px] italic text-muted-foreground">None on file.</p>
              ) : (
                <ul className="space-y-2">
                  {cd.judgmentOrders.map((o, i) => (
                    <li
                      key={i}
                      className="flex items-start justify-between gap-2 rounded-lg border border-border/60 p-2.5"
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-foreground">
                          {fmtDate(o.orderDate)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{o.orderType}</div>
                      </div>
                      {o.orderUrl && (
                        <Download
                          className="h-3.5 w-3.5 shrink-0 text-primary"
                          aria-label="View order"
                        />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tagged Matters */}
      {cd.taggedMatters.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Link2 className="h-3.5 w-3.5" /> Tagged Matters
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {cd.taggedMatters.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-2.5"
              >
                <span className="text-[11px] font-semibold text-foreground">{m.type}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{m.caseNumber}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Petitioners & Respondents */}
      {(cd.petitioners.length > 0 || cd.respondents.length > 0) && (
        <div>
          <div className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
            <Users className="h-3.5 w-3.5" /> Parties
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Petitioners
              </div>
              {cd.petitioners.length === 0 ? (
                <p className="text-[11px] italic text-muted-foreground">—</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-foreground">
                  {cd.petitioners.map((p, i) => (
                    <li key={i}>
                      <div className="font-semibold">{p}</div>
                      {cd.petitionerAdvocates[i] && (
                        <div className="text-[11px] text-muted-foreground">
                          Adv: {cd.petitionerAdvocates[i]}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-surface p-4">
              <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Respondents
              </div>
              {cd.respondents.length === 0 ? (
                <p className="text-[11px] italic text-muted-foreground">—</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-foreground">
                  {cd.respondents.map((r, i) => (
                    <li key={i}>
                      <div className="font-semibold">{r}</div>
                      {cd.respondentAdvocates[i] && (
                        <div className="text-[11px] text-muted-foreground">
                          Adv: {cd.respondentAdvocates[i]}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
