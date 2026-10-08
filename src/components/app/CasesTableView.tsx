import { useNavigate } from "@tanstack/react-router";
import {
  Hash,
  Pencil,
  Eye,
  Paperclip,
  Landmark,
  User,
  CalendarClock,
  Download,
  AlertTriangle,
} from "lucide-react";
import { IconButton } from "@/components/m3";
import { StatusBadge, formatCaseVsTitle, getNextEntry } from "@/components/app/caseDocketShared";
import { ChatButton } from "@/components/app/CaseChat";
import { formatDateTime } from "@/lib/dateUtils";
import type { LegalCase } from "@/types";

export interface CasesTableViewProps {
  cases: LegalCase[];
  allCases: LegalCase[];
  role: "lawyer" | "citizen";
  onOpenEditModal: (c: LegalCase) => void;
  onOpenSerialModal: (c: LegalCase) => void;
  onOpenAttachments: (caseId: string) => void;
  onCaseUpdate?: (updatedCase: LegalCase) => void;
}

export function CasesTableView({
  cases,
  allCases,
  role,
  onOpenEditModal,
  onOpenSerialModal,
  onOpenAttachments,
}: CasesTableViewProps) {
  const navigate = useNavigate();
  const isLawyer = role === "lawyer";

  if (cases.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-xs text-muted-foreground">
        <h3 className="text-sm font-semibold text-foreground">No matching cases</h3>
        <p className="mt-1">Try a different search or filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border/80 bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3.5">Serial No / ID</th>
              <th className="px-4 py-3.5">Case Title & Parties</th>
              <th className="px-4 py-3.5">Court & CNR</th>
              <th className="px-4 py-3.5">Client</th>
              <th className="px-4 py-3.5">Stage & Status</th>
              <th className="px-4 py-3.5">Next Hearing</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50 text-foreground">
            {cases.map((c) => {
              const liveCase = allCases.find((ac) => ac.id === c.id) || c;
              const entry = getNextEntry(liveCase);
              const isImported = liveCase.source === "ecourt";
              const formattedTitle = formatCaseVsTitle(liveCase);
              const titleVsParts = formattedTitle.split(/\s+vs\s+/i);
              const attachmentCount = Array.isArray(liveCase.files)
                ? liveCase.files.length
                : (liveCase.files?.files?.length ?? 0);

              const serialDisplay =
                liveCase.serialCaseNumber ||
                liveCase.serial_case_number ||
                (liveCase.caseDetails?.caseNumber && liveCase.caseDetails.caseNumber !== liveCase.id
                  ? liveCase.caseDetails.caseNumber
                  : liveCase.id);

              const hearingDate = entry?.hearingDate ?? entry?.businessOnDate;
              const hearingFormatted = hearingDate
                ? formatDateTime(hearingDate, entry?.time)
                : null;

              return (
                <tr
                  key={c.id}
                  className="group transition-colors hover:bg-muted/30"
                >
                  {/* 1. Serial No with Lawyer Edit Icon */}
                  <td className="px-4 py-3.5 align-top">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary shadow-2xs">
                        <Hash className="h-3 w-3 shrink-0" />
                        <span>{serialDisplay}</span>
                        {isLawyer && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenSerialModal(liveCase);
                            }}
                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded text-primary hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
                            title="Update Serial Case Number"
                            aria-label="Update Serial Case Number"
                          >
                            <Pencil className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                      {serialDisplay !== liveCase.id && (
                        <div className="font-mono text-[10px] text-muted-foreground">
                          ID: {liveCase.id}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 2. Case Title & Parties */}
                  <td className="px-4 py-3.5 align-top max-w-[280px]">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground line-clamp-2 leading-snug">
                        {titleVsParts.length === 2 ? (
                          <>
                            <span>{titleVsParts[0]}</span>
                            <span className="mx-1 inline-flex items-center rounded bg-primary/10 px-1 text-[9px] font-black uppercase text-primary">
                              VS
                            </span>
                            <span className="text-foreground/90">{titleVsParts[1]}</span>
                          </>
                        ) : (
                          formattedTitle
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                        {isImported && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-2 py-0.2 text-[9.5px] font-bold text-primary border border-primary/20">
                            <Download className="h-2.5 w-2.5" />
                            eCourts
                          </span>
                        )}
                        {liveCase.category && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 font-medium text-muted-foreground">
                            {liveCase.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 3. Court & CNR */}
                  <td className="px-4 py-3.5 align-top max-w-[200px]">
                    <div className="space-y-1">
                      <div className="font-mono text-[11px] font-semibold text-foreground">
                        {liveCase.caseDetails?.cnr ? (
                          <span>CNR: {liveCase.caseDetails.cnr}</span>
                        ) : (
                          <span className="text-muted-foreground/60 font-normal">CNR: N/A</span>
                        )}
                      </div>
                      {liveCase.caseDetails?.courtName && (
                        <div
                          className="flex items-center gap-1 text-[11px] text-muted-foreground truncate"
                          title={liveCase.caseDetails.courtName}
                        >
                          <Landmark className="h-3 w-3 shrink-0 text-primary/70" />
                          <span className="truncate">{liveCase.caseDetails.courtName}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 4. Client / Citizen */}
                  <td className="px-4 py-3.5 align-top">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <User className="h-3 w-3 shrink-0 text-primary/70" />
                        <span>{liveCase.citizenName || "Citizen User"}</span>
                      </div>
                      {liveCase.city && (
                        <div className="text-[10px] text-muted-foreground pl-4.5">
                          {liveCase.city}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 5. Stage & Status */}
                  <td className="px-4 py-3.5 align-top">
                    <div className="space-y-1">
                      <StatusBadge status={liveCase} />
                      {liveCase.caseStatus && liveCase.caseStatus !== liveCase.status && (
                        <div className="text-[10px] text-muted-foreground capitalize">
                          {liveCase.caseStatus}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 6. Next Hearing */}
                  <td className="px-4 py-3.5 align-top max-w-[220px]">
                    {hearingFormatted ? (
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 font-bold text-foreground text-[11px]">
                          <CalendarClock className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span>{hearingFormatted}</span>
                        </div>
                        {entry?.purposeOfListing && (
                          <div className="text-[10.5px] text-muted-foreground line-clamp-1">
                            {entry.purposeOfListing}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/50 text-[11px]">No hearing set</span>
                    )}
                  </td>

                  {/* 7. Action Buttons */}
                  <td className="px-4 py-3.5 align-top text-right">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton
                        variant="tonal"
                        title="View case details"
                        ariaLabel={`View case ${liveCase.title}`}
                        onClick={() =>
                          navigate({
                            to: isLawyer ? "/lawyer/cases/$id" : "/citizen/cases/$id",
                            params: { id: liveCase.id },
                          })
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </IconButton>

                      {isLawyer && (
                        <IconButton
                          variant="tonal"
                          title="Edit case stage or details"
                          ariaLabel={`Edit case ${liveCase.id}`}
                          onClick={() => onOpenEditModal(liveCase)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                      )}

                      <IconButton
                        variant="tonal"
                        title={`Attachments${attachmentCount > 0 ? ` (${attachmentCount})` : ""}`}
                        ariaLabel={`Manage attachments for case ${liveCase.id}`}
                        onClick={() => onOpenAttachments(liveCase.id)}
                      >
                        <Paperclip className="h-4 w-4" />
                      </IconButton>

                      {(isLawyer || liveCase.lawyerName) && (
                        <ChatButton caseItem={liveCase} role={role} />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
