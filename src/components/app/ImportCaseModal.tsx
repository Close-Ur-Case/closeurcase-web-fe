import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  User,
  Hash,
  BookOpen,
  Gavel,
  Check,
  Download,
  Inbox,
  X,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  TextField,
  Select,
} from "@/components/m3";
import { type CourtOption } from "@/data/courts";
import {
  searchCourtCases,
  toLegalCase,
  importableCourtCases,
  shuffleCourtCases,
  type ImportSearchMethod,
  type ImportableCourtCase,
} from "@/data/courtCasesFixture";
import type { CaseStatus, LegalCategory } from "@/types";
import { addCase, getActiveCourts, subscribeToStore } from "@/data/appStore";
import { caseService } from "@/services/caseService";

type Step = "court" | "method" | "search" | "results";
const STEP_ORDER: Step[] = ["court", "method", "search", "results"];
const STEP_LABEL: Record<Step, string> = {
  court: "Court",
  method: "Method",
  search: "Search",
  results: "Results",
};

export function ImportCaseModal({
  open,
  onOpenChange,
  lawyerId,
  lawyerName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lawyerId: string;
  lawyerName: string;
}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("court");
  const [selectedCourt, setSelectedCourt] = useState<CourtOption | null>(null);
  const [cnrQuery, setCnrQuery] = useState("");
  const [method, setMethod] = useState<ImportSearchMethod | null>(null);
  const [caseType, setCaseType] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseYear, setCaseYear] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ImportableCourtCase[] | null>(null);
  const [importedFixtureIds, setImportedFixtureIds] = useState<Set<string>>(new Set());
  const [lastImportedCaseId, setLastImportedCaseId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [plaintiffDraft, setPlaintiffDraft] = useState("");
  const [respondentDraft, setRespondentDraft] = useState("");

  const [managedCourts, setManagedCourts] = useState<CourtOption[]>(() =>
    getActiveCourts().map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level as CourtOption["level"],
      city: c.city,
      state: c.state,
    })),
  );

  useEffect(() => {
    return subscribeToStore(() => {
      setManagedCourts(
        getActiveCourts().map((c) => ({
          id: c.id,
          name: c.name,
          level: c.level as CourtOption["level"],
          city: c.city,
          state: c.state,
        })),
      );
    });
  }, []);

  function resetAll() {
    setStep("court");
    setSelectedCourt(null);
    setCnrQuery("");
    setMethod(null);
    setCaseType("");
    setCaseNumber("");
    setCaseYear("");
    setQuery("");
    setResults(null);
    setImportedFixtureIds(new Set());
    setLastImportedCaseId(null);
    setConfirmingId(null);
    setPlaintiffDraft("");
    setRespondentDraft("");
  }

  function handleClose(next: boolean) {
    if (!next) resetAll();
    onOpenChange(next);
  }

  function resultsOrFallback(matches: ImportableCourtCase[]) {
    return matches.length > 0 ? matches : shuffleCourtCases(importableCourtCases);
  }

  function runSearch() {
    if (!method) return;
    const matches = searchCourtCases({
      method,
      courtName: selectedCourt?.name,
      caseType,
      caseNumber,
      caseYear,
      query,
    });
    setResults(resultsOrFallback(matches));
    setStep("results");
  }

  const [cnrImportResult, setCnrImportResult] = useState<{
    status: "found" | "not-found";
    source?: "database" | "ecourts";
    title?: string;
  } | null>(null);
  const [isSearchingCnr, setIsSearchingCnr] = useState(false);

  async function runCnrSearch() {
    const query = cnrQuery.trim().toUpperCase();
    if (!query) return;
    setMethod("CNR Number");
    setIsSearchingCnr(true);
    setCnrImportResult(null);

    try {
      // 1st check case_imported table via backend getImportedCase.
      // If not present in case_imported, backend connects to eCourts API and inserts into case_imported.
      const res = await caseService.getImportedCase<any>(query);
      if (res && (res.cnr || res.courtCaseData?.caseNumber || res.data?.courtCaseData?.caseNumber || res.caseDetails?.caseNumber)) {
        const cd = res.courtCaseData || res.data?.courtCaseData || res.caseDetails || res.rawData?.data?.courtCaseData || {};
        const p = Array.isArray(cd.petitioners) ? cd.petitioners : [];
        const r = Array.isArray(cd.respondents) ? cd.respondents : [];
        const title =
          p[0] && r[0] ? `${p[0]} Vs. ${r[0]}` : (cd.caseNumber || query);
        const matchItem: ImportableCourtCase = {
          id: `imp_${query}`,
          courtName: cd.courtName || "District Court",
          caseType: cd.caseType || "Civil",
          caseNumber: cd.caseNumber || `CNR/${query.slice(-8)}`,
          caseYear: cd.filingDate ? cd.filingDate.slice(0, 4) : "2026",
          cnrNumber: query,
          diaryNumber: cd.diaryNumber || `D-${query.slice(-6)}`,
          title,
          category: (cd.category || "Civil") as LegalCategory,
          stage: cd.purpose || cd.caseStatus || "Registered",
          filingDate: cd.filingDate || new Date().toISOString().slice(0, 10),
          petitioners: p.length ? p : ["Petitioner"],
          respondents: r.length ? r : ["Respondent"],
          petitionerLawyers: Array.isArray(cd.petitionerLawyers) ? cd.petitionerLawyers : ["Advocate"],
          respondentLawyers: Array.isArray(cd.respondentLawyers) ? cd.respondentLawyers : ["Advocate"],
          status: "Submitted" as CaseStatus,
          city: cd.city || (typeof cd.courtName === "string" && cd.courtName.includes(",") ? cd.courtName.split(",")[1].trim() : "City"),
          description: cd.purpose || "eCourts imported case",
          historyOfCaseHearings: cd.historyOfCaseHearings || [],
        };
        const source =
          res.source === "database" || res.isNewlyImported === false ? "database" : "ecourts";
        setCnrImportResult({ status: "found", source, title });
        setResults([matchItem]);
        setStep("results");
        setIsSearchingCnr(false);
        return;
      }
    } catch (err) {
      console.warn("[runCnrSearch] Backend import notice:", err);
    }

    // Fallback to local fixtures
    const matches = searchCourtCases({ method: "CNR Number", query });
    if (matches.length > 0) {
      setCnrImportResult({ status: "found", source: "database", title: matches[0].title });
      setResults(matches);
      setStep("results");
    } else {
      setCnrImportResult({ status: "not-found" });
      setResults([]);
    }
    setIsSearchingCnr(false);
  }

  function startConfirmImport(match: ImportableCourtCase) {
    setConfirmingId(match.id);
    setPlaintiffDraft(match.petitioners[0] ?? "");
    setRespondentDraft(match.respondents[0] ?? "");
  }

  function handleImport(match: ImportableCourtCase) {
    const legalCase = toLegalCase(match, lawyerId, lawyerName);
    const plaintiff = plaintiffDraft.trim() || match.petitioners[0];
    const respondent = respondentDraft.trim() || match.respondents[0];
    legalCase.caseDetails.petitioners = plaintiff ? [plaintiff] : legalCase.caseDetails.petitioners;
    legalCase.caseDetails.respondents = respondent
      ? [respondent]
      : legalCase.caseDetails.respondents;
    legalCase.citizenName = plaintiff || legalCase.citizenName;

    // Sync with backend API. The fixture field is `cnrNumber` — guarding on a
    // non-existent `cnr` meant this branch never ran and imports stayed local.
    if (match.cnrNumber) {
      caseService
        .importCase({
          cnr: match.cnrNumber,
          rawData: match,
        })
        .catch((err: unknown) => {
          console.warn("[ImportCaseModal] Backend sync notice:", err);
        });
    }

    addCase(legalCase);
    setImportedFixtureIds((prev) => new Set(prev).add(match.id));
    setLastImportedCaseId(legalCase.id);
    setConfirmingId(null);
  }

  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
          <Download className="h-5 w-5 text-primary" />
          Import Case from eCourts
        </DialogTitle>
      </DialogHeader>

      <DialogContent>
        {/* Stepper */}
        <div className="flex items-start px-4 sm:px-6 pt-5 pb-4">
          {STEP_ORDER.map((s, i) => (
            <div key={s} className="contents">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    i < stepIndex
                      ? "bg-primary text-primary-foreground"
                      : i === stepIndex
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                    i <= stepIndex ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {STEP_LABEL[s]}
                </span>
              </div>
              {i < STEP_ORDER.length - 1 && (
                <div
                  className={`mt-4.5 h-0.5 flex-1 rounded-full transition-colors ${
                    i < stepIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="px-4 sm:px-6 py-5">
          {step === "court" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-2">
                <span className="text-xs font-bold text-foreground">
                  Find directly by CNR Number
                </span>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <TextField
                    value={cnrQuery}
                    onChange={setCnrQuery}
                    placeholder="e.g. TSNI080001912025"
                    className="flex-1"
                  />
                  <Button onClick={runCnrSearch} disabled={!cnrQuery.trim() || isSearchingCnr}>
                    {isSearchingCnr ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Searching...</span>
                      </span>
                    ) : (
                      "Find"
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                Or select a court
                <div className="h-px flex-1 bg-border" />
              </div>

              <Select
                label="Court"
                value={selectedCourt?.id ?? ""}
                onChange={(id) =>
                  setSelectedCourt(managedCourts.find((court) => court.id === id) ?? null)
                }
                options={managedCourts.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.level})`,
                }))}
                className="w-full"
              />
            </div>
          )}

          {step === "method" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Find your case from{" "}
                <span className="font-semibold text-foreground">{selectedCourt?.name}</span> using
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <MethodCard
                  icon={<User className="h-5 w-5" />}
                  label="Party Name"
                  active={method === "Party Name"}
                  onClick={() => setMethod("Party Name")}
                />
                <MethodCard
                  icon={<Hash className="h-5 w-5" />}
                  label="Case Number"
                  active={method === "Case Number"}
                  onClick={() => setMethod("Case Number")}
                />
                <MethodCard
                  icon={<BookOpen className="h-5 w-5" />}
                  label="Diary Number"
                  active={method === "Diary Number"}
                  onClick={() => setMethod("Diary Number")}
                />
                <MethodCard
                  icon={<Gavel className="h-5 w-5" />}
                  label="Lawyer Name"
                  active={method === "Lawyer Name"}
                  onClick={() => setMethod("Lawyer Name")}
                />
              </div>
            </div>
          )}

          {step === "search" && method && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Search by {method}
              </h3>

              <TextField
                label="Court Name"
                value={selectedCourt?.name ?? ""}
                onChange={() => {}}
                disabled
                className="w-full"
              />

              {method === "Case Number" && (
                <>
                  <TextField
                    label="Case Type"
                    value={caseType}
                    onChange={setCaseType}
                    placeholder="e.g. OS"
                  />
                  <TextField
                    label="Case Number"
                    value={caseNumber}
                    onChange={setCaseNumber}
                    placeholder="e.g. 4"
                  />
                  <TextField
                    label="Case Year"
                    value={caseYear}
                    onChange={setCaseYear}
                    placeholder="e.g. 2025"
                  />
                </>
              )}

              {method !== "Case Number" && (
                <TextField
                  label={
                    method === "Party Name"
                      ? "Party Name"
                      : method === "Diary Number"
                        ? "Diary Number"
                        : "Lawyer Name"
                  }
                  value={query}
                  onChange={setQuery}
                  placeholder={`Enter ${method.toLowerCase()}`}
                />
              )}
            </div>
          )}

          {step === "results" && (
            <div className="space-y-4">
              {results && results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((r) => {
                    const isImported = importedFixtureIds.has(r.id);
                    return (
                      <div
                        key={r.id}
                        className="rounded-xl border border-border bg-background p-4 space-y-2"
                      >
                        <div className="text-xs font-bold text-foreground leading-snug">
                          {r.title}
                        </div>
                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="font-mono font-semibold text-foreground/80">
                            {r.caseNumber}
                          </span>
                          <span aria-hidden>•</span>
                          <span>{r.courtName}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          CNR: <span className="font-mono">{r.cnrNumber}</span> · Stage: {r.stage} ·
                          Filed:{" "}
                          {new Date(r.filingDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>

                        {confirmingId === r.id ? (
                          <div className="space-y-2.5 rounded-lg border border-primary/30 bg-primary/5 p-3">
                            <TextField
                              label="Plaintiff / Petitioner Name"
                              value={plaintiffDraft}
                              onChange={setPlaintiffDraft}
                              autoFocus
                            />
                            <TextField
                              label="Respondent Name"
                              value={respondentDraft}
                              onChange={setRespondentDraft}
                            />
                            <div className="flex items-center justify-end gap-2 pt-1">
                              <Button variant="outlined" onClick={() => setConfirmingId(null)}>
                                Cancel
                              </Button>
                              <Button
                                icon={<Download className="h-4 w-4" />}
                                onClick={() => handleImport(r)}
                                disabled={!plaintiffDraft.trim() || !respondentDraft.trim()}
                              >
                                Confirm Import
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-1">
                            <Button
                              icon={<Download className="h-4 w-4" />}
                              onClick={() => startConfirmImport(r)}
                              disabled={isImported}
                            >
                              {isImported ? "Imported" : "Import This Case"}
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-background p-8 text-center">
                  <Inbox className="h-6 w-6 text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">No matching cases found</p>
                  <p className="text-[11px] text-muted-foreground">Try a different search.</p>
                </div>
              )}

              {lastImportedCaseId && (
                <div
                  className="flex items-center justify-between rounded-lg px-4 py-3"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--md-extended-color-success) 10%, transparent)",
                    color: "var(--md-extended-color-success)",
                  }}
                >
                  <span className="text-xs font-semibold">Case imported successfully.</span>
                  <button
                    onClick={() => {
                      const id = lastImportedCaseId;
                      handleClose(false);
                      navigate({ to: "/lawyer/cases/$id", params: { id } });
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                  >
                    View Case <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>

      {/* Pinned to the dialog's fixed actions slot (outside the scrollable content
          area above) so Back/Continue stay put and in reach regardless of how tall
          the current step's content is — they used to scroll away with the step
          content and could end up pushed off-screen on short viewports. */}
      <DialogFooter className="flex w-full items-center justify-between">
        <WizardFooter
          back={
            step === "method"
              ? () => setStep("court")
              : step === "search"
                ? () => setStep("method")
                : step === "results"
                  ? // The CNR quick-find shortcut jumps straight from "court" to
                    // "results", skipping "method"/"search" entirely — so Back from
                    // there must return to "court", not a "search" step that was
                    // never actually filled in.
                    () => setStep(method === "CNR Number" ? "court" : "search")
                  : undefined
          }
          next={
            step === "court"
              ? () => setStep("method")
              : step === "method"
                ? () => setStep("search")
                : step === "search"
                  ? runSearch
                  : undefined
          }
          nextLabel={step === "search" ? "Search" : "Continue"}
          nextDisabled={step === "court" ? !selectedCourt : step === "method" ? !method : false}
        />
      </DialogFooter>
    </Dialog>

      {/* CNR Import Result Popup */}
      {cnrImportResult &&
        createPortal(
          <div
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[110] flex h-screen w-screen min-h-[100dvh] items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setCnrImportResult(null);
            }}
          >
            <div className="w-full max-w-sm rounded-2xl bg-[var(--md-sys-color-surface-container-low,#f5f3f7)] shadow-2xl border border-border/80 p-6 text-foreground">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    cnrImportResult.status === "found"
                      ? "bg-[var(--md-extended-color-success)]/10 text-[var(--md-extended-color-success)]"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {cnrImportResult.status === "found" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {cnrImportResult.status === "found" ? "Case Imported" : "No Match Found"}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {cnrImportResult.status === "found" && cnrImportResult.source === "database" ? (
                  <>The case with this CNR is available in imports , so it will directly imported from imports.</>
                ) : cnrImportResult.status === "found" ? (
                  <>Case with this CNR not present in your imports it will imported from ecourts and will be saved to imports.</>
                ) : (
                  "No matching case found in our database or eCourts for this CNR."
                )}
              </p>
              <div className="mt-5 flex justify-end">
                <Button onClick={() => setCnrImportResult(null)}>OK</Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

function MethodCard({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/50"
      }`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}
      >
        {icon}
      </div>
      <span className="text-xs font-bold text-foreground">{label}</span>
    </button>
  );
}

function WizardFooter({
  back,
  next,
  nextLabel = "Continue",
  nextDisabled = false,
}: {
  back?: () => void;
  next?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <>
      {back ? (
        <Button variant="outlined" icon={<ArrowLeft className="h-4 w-4" />} onClick={back}>
          Back
        </Button>
      ) : (
        <span />
      )}
      {next && (
        <Button
          onClick={next}
          disabled={nextDisabled}
          icon={<ArrowRight className="h-4 w-4" />}
          trailingIcon
        >
          {nextLabel}
        </Button>
      )}
    </>
  );
}
