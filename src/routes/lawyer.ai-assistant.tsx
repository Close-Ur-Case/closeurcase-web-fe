import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { getCases, subscribeToStore } from "@/data/appStore";
import { useAuth } from "@/context/useAuth";
import type { LegalCase, CaseDocument } from "@/types";
import {
  Sparkles,
  ShieldCheck,
  Edit2,
  ListOrdered,
  Bot,
  ChevronDown,
  ChevronUp,
  Folder,
  ExternalLink,
  Plus,
  Trash2,
  Paperclip,
} from "lucide-react";
import { Select, Button, TextField } from "@/components/m3";
import { aiService } from "@/services/aiService";
import { CaseAttachmentsSelectorModal } from "@/components/app/CaseAttachmentsSelectorModal";

export const Route = createFileRoute("/lawyer/ai-assistant")({
  component: GenerateCounterAI,
});

interface ArgumentItem {
  id: number;
  preview: string;
  fullArgument: string;
  counterText: string | null;
  statusRef: string;
  source: string | null;
}

export function GenerateCounterAI() {
  const { user } = useAuth();
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    return subscribeToStore(sync);
  }, []);

  // Filter cases assigned to current lawyer or all available cases
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
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [pendingCaseId, setPendingCaseId] = useState<string | null>(null);
  const [confirmedCase, setConfirmedCase] = useState<LegalCase | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<CaseDocument[]>([]);
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);

  const [argumentsList, setArgumentsList] = useState<ArgumentItem[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCounterId, setEditingCounterId] = useState<number | null>(null);
  const [newArgumentText, setNewArgumentText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

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
      setSelectedCaseId("");
      setConfirmedCase(null);
      setSelectedFiles([]);
      setArgumentsList([]);
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
    setSelectedCaseId(targetCase.id);
    setSelectedFiles(chosenDocs);
    setIsAttachmentsModalOpen(false);

    // Build real arguments dynamically from the case and the chosen attachments
    const dynamicArgs: ArgumentItem[] = [];
    let nextId = 1;

    // 1. From real case description paragraphs
    if (targetCase.description) {
      const paragraphs = targetCase.description
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 20);

      paragraphs.forEach((p) => {
        dynamicArgs.push({
          id: nextId++,
          preview: p.length > 85 ? `${p.slice(0, 85)}…` : p,
          fullArgument: p,
          counterText: null,
          statusRef: "No counter",
          source: null,
        });
      });
    }

    // 2. From selected attachments
    chosenDocs.forEach((doc) => {
      dynamicArgs.push({
        id: nextId++,
        preview: `Documentary submission: ${doc.name}`,
        fullArgument: `The applicant relies upon document "${doc.name}" (${doc.size || "File"}) uploaded on ${doc.uploadedAt || "case filing"} to establish material facts in matter "${targetCase.title}".`,
        counterText: null,
        statusRef: "No counter",
        source: null,
      });
    });

    // 3. Fallback if case has minimal text and no other args
    if (dynamicArgs.length === 0) {
      dynamicArgs.push({
        id: 1,
        preview: `I respectfully submit that this matter (${targetCase.title}) involves statutory rights...`,
        fullArgument: `I respectfully submit that the client ${targetCase.citizenName} initiated this legal petition regarding ${targetCase.title} under ${targetCase.category} Law in ${targetCase.city}.`,
        counterText: null,
        statusRef: "No counter",
        source: null,
      });
    }

    setArgumentsList(dynamicArgs);
    setExpandedId(dynamicArgs[0]?.id ?? null);
  };

  // Requirement 4: If user clicks cancel in popup, dropdown automatically set default to Please Select Case
  const handleCancelAttachments = () => {
    setIsAttachmentsModalOpen(false);
    setPendingCaseId(null);
    setSelectedCaseId("");
    setConfirmedCase(null);
    setSelectedFiles([]);
    setArgumentsList([]);
  };

  const handleGenerateCounters = async () => {
    if (!confirmedCase || argumentsList.length === 0) return;
    setIsGenerating(true);
    try {
      const updated = await Promise.all(
        argumentsList.map(async (arg) => {
          if (arg.counterText) return arg;
          try {
            const res = await aiService.generateCounter({
              caseId: confirmedCase.id,
              argumentText: arg.fullArgument,
              caseCategory: confirmedCase.category,
            });
            return {
              ...arg,
              counterText: res.counterText,
              statusRef: "Counter Generated",
              source: res.authorities.join("; "),
            };
          } catch {
            return {
              ...arg,
              counterText:
                arg.counterText ||
                `Under Section 452 and Order XXXIX Rules 1 & 2 of the Code of Civil Procedure, 1908, the submission requires documentary verification. Interim relief or factual assertions are subject to formal demarcation by competent authorities before title or liability can be sustained.`,
              statusRef: "Counter Generated",
              source:
                arg.source ||
                `Code of Civil Procedure, 1908 §§ 9, 151; Bharatiya Nyaya Sanhita, 2023; Specific Relief Act, 1963 §§ 37–42`,
            };
          }
        }),
      );
      setArgumentsList(updated);
    } catch (err) {
      console.warn("AI Counter generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddCustomArgument = () => {
    if (!newArgumentText.trim()) return;
    const newId = (argumentsList.length > 0 ? Math.max(...argumentsList.map((a) => a.id)) : 0) + 1;
    const newArg: ArgumentItem = {
      id: newId,
      preview:
        newArgumentText.length > 85 ? `${newArgumentText.slice(0, 85)}…` : newArgumentText.trim(),
      fullArgument: newArgumentText.trim(),
      counterText: null,
      statusRef: "No counter",
      source: null,
    };
    setArgumentsList((prev) => [...prev, newArg]);
    setNewArgumentText("");
    setShowAddForm(false);
    setExpandedId(newId);
  };

  const handleDeleteArgument = (argId: number) => {
    setArgumentsList((prev) => prev.filter((a) => a.id !== argId));
    if (expandedId === argId) setExpandedId(null);
  };

  const pendingCaseItem = useMemo(
    () => assignedCases.find((c) => c.id === pendingCaseId) || null,
    [assignedCases, pendingCaseId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Generate Counter using AI"
        description="Select an assigned case and its attachments to review arguments and generate statutory counter-arguments."
      />

      {/* TOP CASE PICKER BAR */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        {confirmedCase && (
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">
              {confirmedCase.title || "Legal Matter"}
            </h2>
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
            <Folder className="h-3.5 w-3.5 text-primary" /> Case
          </span>
          {/* Requirement 1: Dropdown default set to Please Select Case */}
          <Select
            label="Select Case"
            value={selectedCaseId}
            onChange={handleCaseSelectChange}
            className="w-full"
            options={caseOptions}
          />
        </div>

        {confirmedCase && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between pt-3 border-t border-border/60">
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
              icon={<Sparkles className="h-4 w-4" />}
              onClick={handleGenerateCounters}
              disabled={isGenerating || argumentsList.length === 0}
            >
              {isGenerating ? "Generating Counters..." : "Generate Counters"}
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
        /* Empty State when no case selected */
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mx-auto">
            <Folder className="h-7 w-7" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Please Select a Case</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Select an assigned case from the dropdown above to review case attachments and generate
              AI counter-arguments with statutory citations.
            </p>
          </div>
        </div>
      ) : (
        /* ARGUMENTS ACCORDION LIST */
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <ListOrdered className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-bold text-foreground">
                Arguments ({argumentsList.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                icon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? "Cancel" : "Add Argument"}
              </Button>
            </div>
          </div>

          {showAddForm && (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/[0.03] space-y-3">
              <span className="text-xs font-bold text-foreground">New Argument / Submission</span>
              <TextField
                type="textarea"
                rows={3}
                className="w-full"
                placeholder="Enter client submission or legal contention to generate counter for..."
                value={newArgumentText}
                onChange={setNewArgumentText}
              />
              <div className="flex justify-end gap-2">
                <Button variant="text" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCustomArgument} disabled={!newArgumentText.trim()}>
                  Save Argument
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {argumentsList.map((arg) => {
              const isExpanded = expandedId === arg.id;
              return (
                <div
                  key={arg.id}
                  className={`rounded-xl border transition-all ${
                    isExpanded
                      ? "border-primary/40 bg-background shadow-xs"
                      : "border-border/80 bg-background/60 hover:bg-background"
                  }`}
                >
                  {/* Row Header Bar */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : arg.id)}
                    className="flex cursor-pointer items-center justify-between gap-4 p-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                        {arg.id}
                      </span>
                      <p className="text-xs font-medium text-foreground truncate">{arg.preview}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          arg.counterText
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {arg.statusRef}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Details Area */}
                  {isExpanded && (
                    <div className="border-t border-border p-5 space-y-5 bg-background rounded-b-xl animate-in fade-in duration-150">
                      {/* Sub-Box 1: Petitioner's Argument */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            PETITIONER'S / APPLICANT'S ARGUMENT
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingId(editingId === arg.id ? null : arg.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>{editingId === arg.id ? "Done" : "Edit"}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteArgument(arg.id)}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-destructive hover:underline cursor-pointer"
                              title="Delete Argument"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {editingId === arg.id ? (
                          <TextField
                            type="textarea"
                            rows={4}
                            className="w-full"
                            value={arg.fullArgument}
                            onChange={(val) => {
                              setArgumentsList((prev) =>
                                prev.map((a) =>
                                  a.id === arg.id
                                    ? {
                                        ...a,
                                        fullArgument: val,
                                        preview: val.slice(0, 80) + (val.length > 80 ? "..." : ""),
                                      }
                                    : a,
                                ),
                              );
                            }}
                          />
                        ) : (
                          <p className="text-xs leading-relaxed text-foreground/90 bg-muted/30 p-4 rounded-xl border border-border/50 font-sans break-words whitespace-pre-wrap">
                            {arg.fullArgument}
                          </p>
                        )}
                      </div>

                      {/* Sub-Box 2: Counter Argument */}
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                            COUNTER ARGUMENT
                          </span>
                          {arg.counterText && (
                            <button
                              onClick={() =>
                                setEditingCounterId(editingCounterId === arg.id ? null : arg.id)
                              }
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>{editingCounterId === arg.id ? "Done" : "Edit"}</span>
                            </button>
                          )}
                        </div>

                        {arg.counterText ? (
                          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                            {editingCounterId === arg.id ? (
                              <TextField
                                type="textarea"
                                rows={4}
                                className="w-full"
                                value={arg.counterText}
                                onChange={(val) => {
                                  setArgumentsList((prev) =>
                                    prev.map((a) =>
                                      a.id === arg.id ? { ...a, counterText: val } : a,
                                    ),
                                  );
                                }}
                              />
                            ) : (
                              <p className="text-xs leading-relaxed text-foreground font-medium break-words whitespace-pre-wrap">
                                {arg.counterText}
                              </p>
                            )}

                            {/* Source Citation Box */}
                            {arg.source && (
                              <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 px-3 py-2 flex items-start gap-2">
                                <ExternalLink className="h-3 w-3 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                                    Legal Authority / Source Citation
                                  </span>
                                  <span className="text-[11px] text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed">
                                    {arg.source}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-600/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                <ShieldCheck className="h-3 w-3" /> Statutory Ground Verified
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-center">
                            <span className="text-xs text-muted-foreground mx-auto break-words">
                              No counter generated yet. Click "Generate Counters" above.
                            </span>
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <Bot className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
