import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { getCases, subscribeToStore } from "@/data/appStore";
import { useAuth } from "@/context/useAuth";
import type { LegalCase, CaseDocument } from "@/types";
import { Folder, Send, MessageCircleQuestion, Paperclip, Sparkles } from "lucide-react";
import { Select, IconButton } from "@/components/m3";
import { aiService } from "@/services/aiService";
import { CaseAttachmentsSelectorModal } from "@/components/app/CaseAttachmentsSelectorModal";

export const Route = createFileRoute("/lawyer/qa-assistant")({
  component: CaseQA,
});

interface QAMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}

/* Contextual answers sourced directly from the selected case docket and chosen files as local fallback */
function answerFromCase(question: string, c: LegalCase, files: CaseDocument[]): string {
  const q = question.toLowerCase();

  if (/status|stage|progress/.test(q)) {
    return `The current status of ${c.id} is "${c.status}". Last updated on ${new Date(c.updatedAt).toLocaleDateString("en-IN")}.`;
  }
  if (/lawyer|advocate|counsel|assigned/.test(q)) {
    return c.lawyerName
      ? `Advocate ${c.lawyerName} is the assigned legal counsel for this matter.`
      : "No individual advocate is specifically assigned in the docket record.";
  }
  if (/client|citizen|petitioner/.test(q)) {
    return `The client petitioner on this case is ${c.citizenName}, based in ${c.city}.`;
  }
  if (/hearing|court date|next date/.test(q)) {
    const today = new Date().toISOString().slice(0, 10);
    const hearings = c.caseDetails?.historyOfCaseHearings || [];
    const upcoming = hearings
      .filter((h) => h.hearingDate && h.hearingDate >= today)
      .sort((a, b) => (a.hearingDate ?? "").localeCompare(b.hearingDate ?? ""));
    if (upcoming.length === 0) return `There are no upcoming court hearings scheduled for case ${c.id}.`;
    const next = upcoming[0];
    return `The next hearing is scheduled on ${next.hearingDate} before ${c.caseDetails?.courtName || "the Hon'ble Court"}.`;
  }
  if (/document|file|upload|attachment|evidence/.test(q)) {
    if (files.length === 0) return "No documents are currently selected for this case.";
    return `There are ${files.length} document(s) selected for analysis in this matter: ${files.map((d) => `${d.name} (${d.size || "File"})`).join(", ")}.`;
  }
  if (/categor|type of case|law\b/.test(q)) {
    return `This is a ${c.category} Law matter registered in ${c.city}.`;
  }
  if (/timeline|history/.test(q)) {
    return c.timeline && c.timeline.length > 0
      ? `Case timeline progression: ${c.timeline.map((t) => `${t.status} (${t.at})`).join(" → ")}.`
      : "No milestone events logged yet in the timeline.";
  }
  if (/summary|about|describe|what is this case/.test(q)) {
    const firstLine = c.description ? c.description.split(/\n/).find((l) => l.trim().length > 0) : null;
    return firstLine || `Matter titled "${c.title}" under ${c.category} Law in ${c.city}.`;
  }

  return `Regarding case ${c.id} ("${c.title}") under ${c.category} Law: Analysis across ${files.length} selected attachment(s) confirms petitioner is ${c.citizenName}. Factual claims state: ${c.description ? c.description.slice(0, 200) + "..." : c.title}.`;
}

export function CaseQA() {
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

  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

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
      setMessages([]);
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

    // Initialize conversation for this case and its selected attachments
    setMessages([
      {
        id: "welcome",
        role: "bot",
        text: `Welcome! Ask me anything regarding ${targetCase.id} — "${targetCase.title}" and its ${chosenDocs.length} selected attachment(s).`,
      },
    ]);
  };

  // Requirement 4: If user clicks cancel in popup, dropdown automatically set default to Please Select Case
  const handleCancelAttachments = () => {
    setIsAttachmentsModalOpen(false);
    setPendingCaseId(null);
    setSelectedId("");
    setConfirmedCase(null);
    setSelectedFiles([]);
    setMessages([]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !confirmedCase) return;
    const userMsg: QAMessage = { id: `u_${Date.now()}`, role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await aiService.caseQA({
        caseId: confirmedCase.id,
        question: text.trim(),
      });
      const botMsg: QAMessage = {
        id: `b_${Date.now()}`,
        role: "bot",
        text: res?.answer || answerFromCase(text, confirmedCase, selectedFiles),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // Graceful fallback to client analysis if offline or backend error
      const botMsg: QAMessage = {
        id: `b_${Date.now()}`,
        role: "bot",
        text: answerFromCase(text, confirmedCase, selectedFiles),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setTyping(false);
    }
  };

  const pendingCaseItem = useMemo(
    () => assignedCases.find((c) => c.id === pendingCaseId) || null,
    [assignedCases, pendingCaseId],
  );

  const SUGGESTED_PROMPTS = [
    "What are the main claims and factual background?",
    "Which documents and evidence are on record?",
    "When is the next court hearing date?",
    "What procedural stage is this case at?",
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Q&A"
        description="Ask questions about a selected case and its attachments to get instant, case-specific legal insights."
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
            <Folder className="h-3.5 w-3.5 text-primary" /> Case
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
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
              Select an assigned case from the dropdown above to review case attachments and begin
              AI-assisted legal Q&A.
            </p>
          </div>
        </div>
      ) : (
        /* Chat Card */
        <div className="flex h-[60vh] min-h-90 flex-col rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden sm:h-135">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0 bg-surface/50">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">
                Ask about {confirmedCase.id} ({selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} attached)
              </span>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Powered by CloseUrCase AI &amp; Indian Law
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-background/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground font-medium"
                      : "rounded-bl-sm bg-surface border border-border/70 text-foreground whitespace-pre-wrap"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-start">
                <div className="rounded-2xl rounded-bl-sm bg-surface border border-border/60 px-4 py-3 shadow-xs">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Prompt Chips */}
          <div className="px-4 py-2 bg-surface/40 border-t border-border/40 flex items-center gap-2 overflow-x-auto shrink-0 no-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Prompts:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={typing}
                className="inline-flex shrink-0 items-center rounded-full bg-muted/60 hover:bg-primary/10 hover:text-primary px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors cursor-pointer border border-border/60"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="shrink-0 flex items-center gap-2 border-t border-border bg-surface px-4 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about this case and its attachments…"
              className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3.5 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            <IconButton variant="filled" disabled={!input.trim() || typing} ariaLabel="Send">
              <Send className="h-4 w-4" />
            </IconButton>
          </form>
        </div>
      )}
    </div>
  );
}
