import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarClock,
  Landmark,
  User,
  Hash,
  Download,
  Eye,
  FileText,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { LegalCase } from "@/types";
import {
  StatusBadge,
  STATUS_LIST,
  STATUS_META,
  getStatusStyle,
  resolveCaseFilterStatus,
} from "@/components/app/caseDocketShared";
import { ChatButton } from "@/components/app/CaseChat";
import { IconButton } from "@/components/m3";
import { formatCaseVsTitle } from "@/components/app/caseDocketShared";
import { formatDateTime } from "@/lib/dateUtils";
import { updateCaseStatus } from "@/data/appStore";
import { caseService } from "@/services/caseService";
import { useAuth } from "@/context/useAuth";

function nextHearing(caseItem: LegalCase) {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = caseItem.caseDetails.historyOfCaseHearings
    .filter((h) => h.hearingDate && h.hearingDate >= today)
    .sort((a, b) => (a.hearingDate ?? "").localeCompare(b.hearingDate ?? ""));
  return upcoming[0];
}

function formatDate(iso?: string, time?: string): string | undefined {
  if (!iso) return undefined;
  return formatDateTime(iso, time);
}

export function CaseListCard({ caseItem }: { caseItem: LegalCase }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLawyer = user?.role === "lawyer" || (typeof window !== "undefined" && window.location.pathname.startsWith("/lawyer"));
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function handleQuickStatusChange(newFilterStatus: string) {
    if (updatingStatus) return;
    setUpdatingStatus(true);
    try {
      updateCaseStatus(caseItem.id, newFilterStatus as any);
      await Promise.allSettled([
        caseService.updateCase(caseItem.id, {
          status: newFilterStatus,
          caseStatus: newFilterStatus,
        }),
        caseService.updateCaseStage(caseItem.id, {
          stage: newFilterStatus,
          status: newFilterStatus,
        }),
      ]);
    } catch (err) {
      console.error("[CaseListCard] Status update notice:", err);
    } finally {
      setUpdatingStatus(false);
    }
  }

  const nextHearingObj = nextHearing(caseItem);
  const hearingDateFormatted = formatDate(nextHearingObj?.hearingDate, nextHearingObj?.time);
  const caseRef = caseItem.caseDetails.caseNumber;
  const isImported = caseItem.source === "ecourt";
  const formattedTitle = formatCaseVsTitle(caseItem);
  const titleVsParts = formattedTitle.split(/\s+vs\s+/i);

  return (
    <div className="relative flex h-full min-h-64 flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-surface via-surface/98 to-surface/90 p-4.5 shadow-2xs sm:p-5">
      <div className="space-y-3.5">
        {/* Title & Badges */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-base font-bold text-foreground leading-snug tracking-tight">
              {titleVsParts.length === 2 ? (
                <>
                  <span>{titleVsParts[0]}</span>
                  <span className="mx-1.5 inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary align-middle">
                    VS
                  </span>
                  <span className="text-foreground/90">{titleVsParts[1]}</span>
                </>
              ) : (
                formattedTitle
              )}
            </h3>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-1.5 self-start sm:self-auto">
            {isImported && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                eCourts
              </span>
            )}
            {isLawyer ? (
              <div
                className="relative inline-flex items-center"
                onClick={(e) => e.stopPropagation()}
              >
                {(() => {
                  const filterKey = resolveCaseFilterStatus(caseItem);
                  const meta = STATUS_META[filterKey] || STATUS_META["Pending by Lawyer"];
                  const style = getStatusStyle(meta.color);
                  return (
                    <div className="relative inline-flex items-center">
                      <select
                        aria-label={`Case Status for ${caseItem.id}`}
                        value={filterKey}
                        onChange={(e) => handleQuickStatusChange(e.target.value)}
                        disabled={updatingStatus}
                        className={`cursor-pointer appearance-none rounded-lg pl-6 pr-6 py-1 text-xs font-semibold border border-border/60 transition-all focus:outline-none focus:ring-1 focus:ring-primary ${style.bg} ${
                          updatingStatus ? "opacity-60 pointer-events-none" : ""
                        }`}
                        title={`Case Status: ${meta.label} — ${meta.meaning}`}
                      >
                        {STATUS_LIST.map((s) => (
                          <option
                            key={s}
                            value={s}
                            className="bg-card text-foreground font-medium text-xs"
                          >
                            {STATUS_META[s].label}
                          </option>
                        ))}
                      </select>
                      {updatingStatus ? (
                        <Loader2 className="absolute left-2 h-3 w-3 animate-spin text-primary pointer-events-none" />
                      ) : (
                        <span
                          className={`absolute left-2.5 h-1.5 w-1.5 shrink-0 rounded-full pointer-events-none ${style.dot}`}
                        />
                      )}
                      <ChevronDown className="absolute right-2 h-3.5 w-3.5 pointer-events-none text-current opacity-70" />
                    </div>
                  );
                })()}
              </div>
            ) : (
              <StatusBadge status={caseItem} />
            )}
          </div>
        </div>

        {/* Metadata Chips Grid */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-bold text-primary shadow-2xs">
            <Hash className="h-3 w-3" />
            {caseRef && caseRef !== caseItem.id ? caseRef : caseItem.id}
          </span>
          {caseItem.caseDetails.courtName && (
            <span
              className="inline-flex max-w-[220px] items-center gap-1 truncate rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground shadow-2xs sm:max-w-xs"
              title={caseItem.caseDetails.courtName}
            >
              <Landmark className="h-3 w-3 shrink-0 text-primary/70" />
              <span className="truncate">{caseItem.caseDetails.courtName}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 font-mono text-[11px] text-muted-foreground shadow-2xs">
            CNR:{" "}
            <span
              className={
                caseItem.caseDetails.cnr
                  ? "font-bold text-foreground"
                  : "font-normal text-muted-foreground/60"
              }
            >
              {caseItem.caseDetails.cnr || "N/A"}
            </span>
          </span>
          {caseItem.citizenName && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground shadow-2xs">
              <User className="h-3 w-3 text-primary/70" />
              Client: <span className="font-semibold text-foreground">{caseItem.citizenName}</span>
            </span>
          )}
        </div>

        {/* Next Hearing Strip */}
        {hearingDateFormatted && (
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/[0.04] to-transparent p-3 text-xs text-foreground shadow-2xs">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary" />
            <div className="flex items-start gap-2.5 pl-1">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <CalendarClock className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="font-bold text-foreground text-[12px]">
                    Next Hearing: {hearingDateFormatted}
                  </span>
                </div>
                {nextHearingObj?.purposeOfListing && (
                  <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-muted-foreground">
                    {nextHearingObj.purposeOfListing}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Action Bar */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
        <div className="text-[11px] text-muted-foreground">
          {isImported ? (
            <span className="inline-flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Download className="h-3 w-3 shrink-0 text-primary" />
              <span>Imported eCourts</span>
            </span>
          ) : (
            <span className="text-muted-foreground/50 font-medium">Direct Platform Case</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <IconButton
            variant="tonal"
            title="View case details"
            ariaLabel={`View details for case ${caseItem.title}`}
            onClick={() => navigate({ to: "/lawyer/cases/$id", params: { id: caseItem.id } })}
          >
            <Eye className="h-4 w-4" />
          </IconButton>
          <ChatButton caseItem={caseItem} role="lawyer" />
        </div>
      </div>
    </div>
  );
}
