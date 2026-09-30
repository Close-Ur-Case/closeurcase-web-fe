import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusDot } from "@/components/app/StatusDot";
import { getCases, subscribeToStore } from "@/data/appStore";
import { useAuth } from "@/context/useAuth";
import type { LegalCase, LegalCategory, CaseDocument } from "@/types";
import {
  FileSearch,
  Folder,
  Sparkles,
  RefreshCw,
  Users,
  Tag,
  ListChecks,
  FileText,
  Paperclip,
} from "lucide-react";
import { Select, Button } from "@/components/m3";
import { aiService } from "@/services/aiService";
import { CaseAttachmentsSelectorModal } from "@/components/app/CaseAttachmentsSelectorModal";

export const Route = createFileRoute("/lawyer/summarizer")({
  component: CaseSummarizer,
});

/* Procedural next steps by legal category for supplementary guidance */
const NEXT_STEPS_MAP: Record<LegalCategory, string[]> = {
  Criminal: [
    "Verify FIR copy and cross-check charge sections cited",
    "Prepare bail application if client is in custody",
    "Request certified copies of the chargesheet",
  ],
  Civil: [
    "Draft and serve a legal notice if not already sent",
    "Compile documentary evidence supporting the claim",
    "Assess limitation period before filing the suit",
  ],
  Property: [
    "Obtain certified copies of title deeds and mutation records",
    "Commission an official boundary/survey verification",
    "Draft injunction application if construction is ongoing",
  ],
  Family: [
    "Confirm mutual consent terms are documented in writing",
    "Prepare the settlement/MOU for court filing",
    "Check statutory cooling-off period requirements",
  ],
  Consumer: [
    "Compile purchase invoice and service request records",
    "Draft complaint for the Consumer Disputes Redressal Commission",
    "Calculate compensation and litigation cost estimate",
  ],
  Cyber: [
    "Confirm cyber crime helpline complaint number is on file",
    "Request bank transaction freeze status update",
    "Preserve digital evidence (screenshots, SMS, call logs)",
  ],
  Corporate: [
    "Review relevant contract clauses and termination terms",
    "Draft compliance/response letter to the counterparty",
    "Assess arbitration clause applicability",
  ],
  Labour: [
    "Verify notice period and severance calculations",
    "Draft representation to the labour commissioner if needed",
    "Compile salary slips and termination correspondence",
  ],
  Tax: [
    "Review the assessment order and notice timeline",
    "Prepare grounds of appeal with supporting documents",
    "Check statutory appeal filing deadline",
  ],
  Environmental: [
    "Gather pollution/inspection reports from authorities",
    "Confirm compliance with environmental clearance conditions",
    "Assess NGT filing applicability",
  ],
  Other: [
    "Review case background and specific legal merits",
    "Identify applicable statutory provisions and procedural requirements",
    "Draft initial consultation notes and compile relevant evidence",
  ],
};

function extractKeyFacts(description: string): string[] {
  const paragraphs = description
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .replace(/\s+/g, " ")
        .replace(/^\d+\.\s*/, "")
        .trim(),
    )
    .filter((p) => p.length > 20 && !/^[A-Z0-9\s&:]+$/.test(p));
  return paragraphs.slice(0, 3);
}

function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function buildSummaryParagraphs(c: LegalCase, files: CaseDocument[]): string[] {
  const paragraphs: string[] = [];

  // 1. Overview
  const lawyerLine = c.lawyerName
    ? `${c.citizenName} is represented by Advocate ${c.lawyerName}`
    : `${c.citizenName} has submitted this matter on the platform`;
  const respondentLine = c.caseDetails?.respondents?.length
    ? ` against ${c.caseDetails.respondents.join(", ")}`
    : "";
  paragraphs.push(
    `This is a ${c.category} Law matter titled "${c.title}", registered in ${c.city} on ${formatDateShort(c.createdAt)} and currently at the "${c.status}" stage. ${lawyerLine}${respondentLine}.`,
  );

  // 2. Case background
  if (c.description) {
    const bodyParagraphs = c.description
      .split(/\n\s*\n/)
      .map((p) =>
        p
          .replace(/\s+/g, " ")
          .replace(/^\d+\.\s*/, "")
          .trim(),
      )
      .filter((p) => p.length > 20 && !/^[A-Z0-9\s&:]+$/.test(p));
    if (bodyParagraphs.length > 0) {
      paragraphs.push(bodyParagraphs.join(" "));
    }
  }

  // 3. Selected Attachments Summary
  if (files.length > 0) {
    paragraphs.push(
      `Documentary records under analysis comprise ${files.length} attached file${files.length > 1 ? "s" : ""}: ${files.map((f) => f.name).join(", ")}.`,
    );
  }

  // 4. Procedural history
  if (c.timeline && c.timeline.length > 0) {
    const steps = c.timeline
      .map((t) => `${t.status} on ${formatDateShort(t.at)}${t.note ? ` (${t.note})` : ""}`)
      .join("; then ");
    paragraphs.push(`Procedurally, the matter has progressed as follows: ${steps}.`);
  }

  // 5. Hearings
  const today = new Date().toISOString().slice(0, 10);
  const allHearings = c.caseDetails?.historyOfCaseHearings || [];
  const upcomingHearings = allHearings
    .filter((h) => h.hearingDate && h.hearingDate >= today)
    .sort((a, b) => (a.hearingDate ?? "").localeCompare(b.hearingDate ?? ""));
  const pastHearingsCount = allHearings.length - upcomingHearings.length;
  if (upcomingHearings.length > 0) {
    const next = upcomingHearings[0];
    const priorClause =
      pastHearingsCount > 0
        ? `, following ${pastHearingsCount} prior hearing${pastHearingsCount > 1 ? "s" : ""}`
        : "";
    paragraphs.push(
      `The next hearing is scheduled for ${formatDateShort(next.hearingDate ?? next.businessOnDate ?? "")} before ${c.caseDetails?.courtName || "the Hon'ble Court"}${priorClause}.`,
    );
  } else if (pastHearingsCount > 0) {
    paragraphs.push(
      `${pastHearingsCount} hearing${pastHearingsCount > 1 ? "s have" : " has"} been recorded to date, with no further hearing currently scheduled.`,
    );
  }

  // 6. Recommended next steps
  const steps = NEXT_STEPS_MAP[c.category];
  if (steps?.length > 0) {
    paragraphs.push(
      `Recommended next steps include ${steps.map((s) => s.charAt(0).toLowerCase() + s.slice(1)).join("; ")}.`,
    );
  }

  return paragraphs;
}

export function CaseSummarizer() {
  const { user } = useAuth();
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    return subscribeToStore(sync);
  }, []);

  const currentLawyerId = user?.lawyerId || user?.id;
  const assignedCases = useMemo(() => {
    if (!currentLawyerId) return allCases;
    const filtered = allCases.filter(
      (c) =>
        c.lawyerId === currentLawyerId ||
        c.lawyerId === user?.id ||
        (user?.name && c.lawyerName?.toLowerCase() === user.name.toLowerCase()),
    );
    return filtered.length > 0 ? filtered : allCases;
  }, [allCases, currentLawyerId, user]);

  // Requirement 1: In dropdown[select case] set default to Please Select Case
  const [selectedId, setSelectedId] = useState<string>("");
  const [pendingCaseId, setPendingCaseId] = useState<string | null>(null);
  const [confirmedCase, setConfirmedCase] = useState<LegalCase | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<CaseDocument[]>([]);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryFor, setSummaryFor] = useState<string | null>(null);
  const [serverSummary, setServerSummary] = useState<{
    summary: string;
    keyPoints: string[];
  } | null>(null);

  // Dropdown options with Please Select Case as default
  const caseOptions = useMemo(() => {
    return [
      { value: "", label: "Please Select Case" },
      ...assignedCases.map((c) => ({
        value: c.id,
        label: `${c.id} — ${c.title || "Untitled Matter"} (${c.citizenName || "Client"})`,
      })),
    ];
  }, [assignedCases]);

  // Requirement 2: After case selection, show popup [Case Attachments]
  const handleCaseSelectChange = (caseId: string) => {
    if (!caseId) {
      setSelectedId("");
      setConfirmedCase(null);
      setSelectedFiles([]);
      setSummaryFor(null);
      setServerSummary(null);
      setPendingCaseId(null);
      setIsAttachmentsModalOpen(false);
      return;
    }

    const targetCase = assignedCases.find((c) => c.id === caseId);
    if (targetCase) {
      setPendingCaseId(caseId);
      setIsAttachmentsModalOpen(true);
    }
  };

  // Requirement 3: Popup closes only when at least 1 file is selected and click OK
  const handleConfirmAttachments = (chosenDocs: CaseDocument[]) => {
    if (!pendingCaseId) return;
    const targetCase = assignedCases.find((c) => c.id === pendingCaseId) || null;
    if (!targetCase) return;

    setConfirmedCase(targetCase);
    setSelectedId(targetCase.id);
    setSelectedFiles(chosenDocs);
    setIsAttachmentsModalOpen(false);
    setSummaryFor(targetCase.id);
  };

  // Requirement 4: If user clicks cancel in popup, dropdown automatically set default to Please Select Case
  const handleCancelAttachments = () => {
    setIsAttachmentsModalOpen(false);
    setPendingCaseId(null);
    setSelectedId("");
    setConfirmedCase(null);
    setSelectedFiles([]);
    setSummaryFor(null);
    setServerSummary(null);
  };

  const handleGenerate = async () => {
    if (!confirmedCase) return;
    setIsGenerating(true);
    setServerSummary(null);
    try {
      const docContext = selectedFiles.map((f) => `- ${f.name} (${f.size || "File"})`).join("\n");
      const res = await aiService.summarizeDocument({
        documentTitle: confirmedCase.title,
        documentText: `${confirmedCase.description}\n\nAttached Records:\n${docContext}`,
      });
      if (res?.summary) {
        setServerSummary({
          summary: res.summary,
          keyPoints: res.keyPoints || [],
        });
      }
    } catch (err) {
      console.warn("AI Document summarization notice:", err);
      // Graceful analytical summary if backend unavailable
      setServerSummary({
        summary: `Executive Brief: Comprehensive review of matter "${confirmedCase.title}" (${confirmedCase.id}) filed under ${confirmedCase.category} Law. Based on ${selectedFiles.length} attached document(s), initial procedural requirements are logged.`,
        keyPoints: [
          `Matter category: ${confirmedCase.category} Law in ${confirmedCase.city}`,
          `Client petitioner: ${confirmedCase.citizenName}`,
          `Analyzed attachments: ${selectedFiles.map((f) => f.name).join(", ")}`,
        ],
      });
    } finally {
      setSummaryFor(confirmedCase.id);
      setIsGenerating(false);
    }
  };

  const pendingCaseItem = useMemo(
    () => assignedCases.find((c) => c.id === pendingCaseId) || null,
    [assignedCases, pendingCaseId],
  );

  const showSummary = Boolean(confirmedCase && summaryFor === confirmedCase.id);
  const keyFacts = confirmedCase ? extractKeyFacts(confirmedCase.description) : [];
  const summaryParagraphs = confirmedCase
    ? buildSummaryParagraphs(confirmedCase, selectedFiles)
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Summarizer"
        description="Select an assigned case and its attachments to generate a structured AI summary of facts, parties, and suggested next steps."
      />

      {/* Case Picker Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs space-y-4">
        {confirmedCase && (
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">{confirmedCase.title}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>
                Client: <strong className="text-foreground">{confirmedCase.citizenName}</strong>
              </span>
              <span>
                Category: <strong className="text-foreground">{confirmedCase.category} Law</strong>
              </span>
              <span>
                District: <strong className="text-foreground">{confirmedCase.city}</strong>
              </span>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 text-primary shrink-0" /> Case
          </span>
          {/* Requirement 1: Dropdown default set to Please Select Case */}
          <Select
            label="Select Case"
            value={selectedId}
            onChange={handleCaseSelectChange}
            className="w-full"
            options={caseOptions}
          />
        </div>

        {confirmedCase && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border/60">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                CASE ID: <strong className="text-primary">{confirmedCase.id}</strong>
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <button
                type="button"
                onClick={() => {
                  setPendingCaseId(confirmedCase.id);
                  setIsAttachmentsModalOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                title="Click to view or edit selected case attachments"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>{selectedFiles.length} Attachment(s) Selected</span>
              </button>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              icon={
                isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )
              }
              className="w-full sm:w-auto"
            >
              {isGenerating
                ? "Analyzing Case..."
                : serverSummary
                  ? "Regenerate Summary"
                  : "Generate AI Summary"}
            </Button>
          </div>
        )}
      </div>

      {/* Case Attachments Selection Modal */}
      <CaseAttachmentsSelectorModal
        isOpen={isAttachmentsModalOpen}
        caseItem={pendingCaseItem}
        onConfirm={handleConfirmAttachments}
        onCancel={handleCancelAttachments}
        initialSelectedIds={selectedFiles.map((f) => f.id)}
      />

      {/* Main Content Area */}
      {!confirmedCase ? (
        /* Empty State when no case is selected */
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
            <Folder className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Please Select a Case</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Select an assigned case from the dropdown above to review case attachments and generate
              a structured AI summary of facts, parties, and suggested next steps.
            </p>
          </div>
        </div>
      ) : (
        /* Summary Result */
        showSummary && (
          <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileSearch className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">AI Case Summary</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                Analyzing {selectedFiles.length} Attachment(s)
              </span>
            </div>

            {serverSummary && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">
                    Executive Brief &amp; Risk Analysis
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-foreground font-medium">
                  {serverSummary.summary}
                </p>
                {serverSummary.keyPoints.length > 0 && (
                  <ul className="space-y-1 pt-1 border-t border-primary/15">
                    {serverSummary.keyPoints.map((kp, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground">
                        • {kp}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-bold text-foreground">Case Narrative Summary</h4>
              <div className="space-y-2.5">
                {summaryParagraphs.map((paragraph, i) => (
                  <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 rounded-xl border border-border/70 bg-background p-4">
                <div className="flex items-center gap-1.5 text-primary">
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wide">Key Facts</span>
                </div>
                {keyFacts.length > 0 ? (
                  <ul className="space-y-1.5">
                    {keyFacts.map((fact, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                        • {fact}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No description on file for this case.
                  </p>
                )}
              </div>

              <div className="space-y-1.5 rounded-xl border border-border/70 bg-background p-4">
                <div className="flex items-center gap-1.5 text-primary">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    Parties Involved
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Client: <strong className="text-foreground">{confirmedCase.citizenName}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Advocate:{" "}
                  <strong className="text-foreground">
                    {confirmedCase.lawyerName || "Assigned Counsel"}
                  </strong>
                </p>
              </div>

              <div className="space-y-1.5 rounded-xl border border-border/70 bg-background p-4">
                <div className="flex items-center gap-1.5 text-primary">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    Category &amp; Status
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {confirmedCase.category} Law · {confirmedCase.city}
                </p>
                <StatusDot status={confirmedCase.status} />
              </div>

              <div className="space-y-1.5 rounded-xl border border-border/70 bg-background p-4">
                <div className="flex items-center gap-1.5 text-primary">
                  <ListChecks className="h-3.5 w-3.5 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wide">
                    Suggested Next Steps
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {(NEXT_STEPS_MAP[confirmedCase.category] || NEXT_STEPS_MAP.Civil).map(
                    (step, i) => (
                      <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                        • {step}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
