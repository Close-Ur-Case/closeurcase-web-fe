import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusDot } from "@/components/app/StatusDot";
import { getCases, subscribeToStore } from "@/data/appStore";
import type { LegalCase, LegalCategory } from "@/types";
import {
  FileSearch,
  Folder,
  Sparkles,
  RefreshCw,
  Users,
  Tag,
  ListChecks,
  FileText,
} from "lucide-react";
import { Select, Button } from "@/components/m3";
import { aiService } from "@/services/aiService";

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
};

/* Case descriptions are formatted as structured paragraphs separated by blank lines,
   so split on blank lines rather than sentence punctuation
   — a naive period-split breaks on abbreviations like "Plot No. 44". */
function extractKeyFacts(description: string): string[] {
  const paragraphs = description
    .split(/\n\s*\n/)
    .map((p) =>
      p
        .replace(/\s+/g, " ")
        .replace(/^\d+\.\s*/, "")
        .trim(),
    )
    .filter((p) => p.length > 20 && !/^[A-Z0-9\s&:]+$/.test(p)); // drop ALL-CAPS header lines
  return paragraphs.slice(0, 2);
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/* A longer narrative summary (up to ~300 words), distinct from the Key Facts bullets —
   assembled from several of the case's own real fields (description, timeline, hearings, category)
   so it reads as a proper case brief rather than a blurb. */
function buildSummaryParagraphs(c: LegalCase): string[] {
  const paragraphs: string[] = [];

  // 1. Overview
  const LawyerLine = c.lawyerName
    ? `${c.citizenName} is being represented by Lawyer ${c.lawyerName}`
    : `${c.citizenName} has not yet been assigned an Lawyer on the platform`;
  const respondentLine = c.caseDetails.respondents.length
    ? ` against ${c.caseDetails.respondents.join(", ")}`
    : "";
  paragraphs.push(
    `This is a ${c.category} Law matter titled "${c.title}", filed in ${c.city} on ${formatDateShort(c.createdAt)} and currently at the "${c.status}" stage. ${LawyerLine}${respondentLine}.`,
  );

  // 2. Case background — the case's own description, in full (not just the first
  // couple of paragraphs the Key Facts card shows)
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

  // 3. Procedural history, from the case's own timeline
  if (c.timeline.length > 0) {
    const steps = c.timeline
      .map((t) => `${t.status} on ${formatDateShort(t.at)}${t.note ? ` (${t.note})` : ""}`)
      .join("; then ");
    paragraphs.push(`Procedurally, the matter has progressed as follows: ${steps}.`);
  }

  // 4. Hearings, from the case's own hearing calendar
  const today = new Date().toISOString().slice(0, 10);
  const allHearings = c.caseDetails.historyOfCaseHearings;
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
      `The next hearing is scheduled for ${formatDateShort(next.hearingDate ?? next.businessOnDate)} before ${c.caseDetails.courtName}${priorClause}.`,
    );
  } else if (pastHearingsCount > 0) {
    paragraphs.push(
      `${pastHearingsCount} hearing${pastHearingsCount > 1 ? "s have" : " has"} been recorded to date, with no further hearing currently scheduled.`,
    );
  }

  // 5. Recommended next steps
  const steps = NEXT_STEPS_MAP[c.category];
  if (steps?.length > 0) {
    paragraphs.push(
      `Recommended next steps include ${steps.map((s) => s.charAt(0).toLowerCase() + s.slice(1)).join("; ")}.`,
    );
  }

  // Cap the combined summary at ~300 words, trimming (never expanding) whatever was
  // actually assembled from the case's real data above.
  const WORD_BUDGET = 300;
  const capped: string[] = [];
  let remaining = WORD_BUDGET;
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/);
    if (words.length <= remaining) {
      capped.push(paragraph);
      remaining -= words.length;
    } else if (remaining > 15) {
      capped.push(`${words.slice(0, remaining).join(" ")}…`);
      break;
    } else {
      break;
    }
  }
  return capped;
}

export function CaseSummarizer() {
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    return subscribeToStore(sync);
  }, []);

  const [selectedId, setSelectedId] = useState<string>(allCases[0]?.id ?? "");
  const selectedCase = useMemo(
    () => allCases.find((c) => c.id === selectedId) ?? allCases[0],
    [allCases, selectedId],
  );

  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryFor, setSummaryFor] = useState<string | null>(null);
  const [serverSummary, setServerSummary] = useState<{
    summary: string;
    keyPoints: string[];
  } | null>(null);

  const handleGenerate = async () => {
    if (!selectedCase) return;
    setIsGenerating(true);
    setServerSummary(null);
    try {
      const res = await aiService.summarizeDocument({
        documentTitle: selectedCase.title,
        documentText: selectedCase.description,
      });
      if (res?.summary) {
        setServerSummary({
          summary: res.summary,
          keyPoints: res.keyPoints || [],
        });
      }
    } catch (err) {
      console.warn("AI Document summarization error:", err);
    } finally {
      setSummaryFor(selectedCase.id);
      setIsGenerating(false);
    }
  };

  if (!selectedCase) {
    return (
      <div className="space-y-6">
        <PageHeader title="Case Summarizer" description="No assigned legal cases found." />
      </div>
    );
  }

  const showSummary = summaryFor === selectedCase.id;
  const keyFacts = extractKeyFacts(selectedCase.description);
  const summaryParagraphs = buildSummaryParagraphs(selectedCase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Summarizer"
        description="Select a case to generate a structured AI summary of facts, parties, and suggested next steps."
      />

      {/* Case Picker Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{selectedCase.title}</h2>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              Client: <strong className="text-foreground">{selectedCase.citizenName}</strong>
            </span>
            <span>
              Category: <strong className="text-foreground">{selectedCase.category} Law</strong>
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 text-primary shrink-0" /> Case
          </span>
          <Select
            label="Select Case"
            value={selectedId}
            onChange={setSelectedId}
            className="w-full"
            options={allCases.map((c) => ({ value: c.id, label: `${c.id} — ${c.title}` }))}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t border-border/60">
          <span className="text-xs text-muted-foreground font-mono">
            CASE REGISTRATION ID: <strong className="text-primary">{selectedCase.id}</strong>
          </span>
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
              : showSummary
                ? "Regenerate Summary"
                : "Generate Summary"}
          </Button>
        </div>
      </div>

      {/* Summary Result */}
      {showSummary && (
        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <FileSearch className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">AI Case Summary</h3>
          </div>

          {serverSummary && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-primary">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wide">
                  Executive Brief & Risk Analysis
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
            <h4 className="text-sm font-bold text-foreground">Summary</h4>
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
                Client: <strong className="text-foreground">{selectedCase.citizenName}</strong>
              </p>
              <p className="text-xs text-muted-foreground">
                Lawyer:{" "}
                <strong className="text-foreground">
                  {selectedCase.lawyerName || "Unassigned"}
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
                {selectedCase.category} Law · {selectedCase.city}
              </p>
              <StatusDot status={selectedCase.status} />
            </div>

            <div className="space-y-1.5 rounded-xl border border-border/70 bg-background p-4">
              <div className="flex items-center gap-1.5 text-primary">
                <ListChecks className="h-3.5 w-3.5 shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wide">
                  Suggested Next Steps
                </span>
              </div>
              <ul className="space-y-1.5">
                {NEXT_STEPS_MAP[selectedCase.category].map((step, i) => (
                  <li key={i} className="text-xs text-muted-foreground leading-relaxed">
                    • {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
