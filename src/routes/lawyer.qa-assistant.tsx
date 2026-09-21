import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { getCases, subscribeToStore } from "@/data/appStore";
import type { LegalCase } from "@/types";
import { Folder, Send, MessageCircleQuestion } from "lucide-react";
import { Select, IconButton } from "@/components/m3";
import { aiService } from "@/services/aiService";

export const Route = createFileRoute("/lawyer/qa-assistant")({
  component: CaseQA,
});

interface QAMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}

/* Keyword-matched answers sourced from the selected case's own data — same mocked-AI
   convention as the rest of the app (LexBot's KB, CASE_ARGUMENTS_MAP), no real LLM call. */
function answerFromCase(question: string, c: LegalCase): string {
  const q = question.toLowerCase();

  if (/status|stage|progress/.test(q)) {
    return `The current status of ${c.id} is "${c.status}". Last updated on ${c.updatedAt}.`;
  }
  if (/lawyer|Lawyer|assigned/.test(q)) {
    return c.lawyerName
      ? `${c.lawyerName} is the Lawyer assigned to this case.`
      : "No Lawyer has been assigned to this case yet.";
  }
  if (/client|citizen|petitioner/.test(q)) {
    return `The client on this case is ${c.citizenName}, based in ${c.city}.`;
  }
  if (/hearing|court date|next date/.test(q)) {
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = c.caseDetails.historyOfCaseHearings
      .filter((h) => h.hearingDate && h.hearingDate >= today)
      .sort((a, b) => (a.hearingDate ?? "").localeCompare(b.hearingDate ?? ""));
    if (upcoming.length === 0) return "There are no upcoming hearings scheduled for this case.";
    const next = upcoming[0];
    return `The next hearing is on ${next.hearingDate} before ${c.caseDetails.courtName}.`;
  }
  if (/document|file|upload|evidence/.test(q)) {
    const docs = c.files.files;
    return docs.length
      ? `There are ${docs.length} document(s) on file: ${docs.map((d) => d.name).join(", ")}.`
      : "No documents have been uploaded for this case yet.";
  }
  if (/categor|type of case|law\b/.test(q)) {
    return `This is a ${c.category} Law matter, filed in ${c.city}.`;
  }
  if (/timeline|history/.test(q)) {
    return c.timeline.length
      ? `Timeline: ${c.timeline.map((t) => `${t.status} (${t.at})`).join(" → ")}.`
      : "No timeline events recorded yet.";
  }
  if (/summary|about|describe|what is this case/.test(q)) {
    const firstLine = c.description.split(/\n/).find((l) => l.trim().length > 0);
    return firstLine || c.title;
  }
  return `I don't have specific information on that for ${c.id} yet. Try asking about the case status, assigned Lawyer, documents, timeline, or category.`;
}

export function CaseQA() {
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

  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Reset the conversation only when the selected case *id* changes — depending on the
  // whole `selectedCase` object would also reset mid-chat whenever the store updates
  // (e.g. a hearing gets added elsewhere) even though the same case is still selected.
  useEffect(() => {
    if (!selectedCase) return;
    setMessages([
      {
        id: "welcome",
        role: "bot",
        text: `Ask me anything about ${selectedCase.id} — ${selectedCase.title}.`,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCase?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedCase) return;
    const userMsg: QAMessage = { id: `u_${Date.now()}`, role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    try {
      const res = await aiService.caseQA({
        caseId: selectedCase.id,
        question: text.trim(),
      });
      const botMsg: QAMessage = {
        id: `b_${Date.now()}`,
        role: "bot",
        text: res?.answer || answerFromCase(text, selectedCase),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      // Graceful fallback to client analysis if offline or backend error
      const botMsg: QAMessage = {
        id: `b_${Date.now()}`,
        role: "bot",
        text: answerFromCase(text, selectedCase),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setTyping(false);
    }
  };

  if (!selectedCase) {
    return (
      <div className="space-y-6">
        <PageHeader title="Case Q&A" description="No assigned legal cases found." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Case Q&A"
        description="Ask questions about a selected case and get instant, case-specific answers."
      />

      {/* Case Picker Bar */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{selectedCase.title}</h2>
          <p className="text-xs text-muted-foreground">
            Client: {selectedCase.citizenName} · {selectedCase.category} Law
          </p>
        </div>
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Folder className="h-3.5 w-3.5 text-primary" /> Case
          </span>
          <Select
            label="Select Case"
            value={selectedId}
            onChange={setSelectedId}
            className="w-full"
            options={allCases.map((c) => ({ value: c.id, label: `${c.id} — ${c.title}` }))}
          />
        </div>
      </div>

      {/* Chat Card */}
      <div className="flex h-[60vh] min-h-90 flex-col rounded-2xl border border-border bg-surface shadow-2xs overflow-hidden sm:h-130">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3 shrink-0">
          <MessageCircleQuestion className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Ask about {selectedCase.id}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-background/60">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                  msg.role === "user"
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : "rounded-bl-sm bg-surface border border-border/60 text-foreground"
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

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="shrink-0 flex items-center gap-2 border-t border-border bg-surface px-3 py-2.5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this case…"
            className="flex-1 min-w-0 rounded-xl border border-border bg-background px-3.5 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          />
          <IconButton variant="filled" disabled={!input.trim()} ariaLabel="Send">
            <Send className="h-4 w-4" />
          </IconButton>
        </form>
      </div>
    </div>
  );
}
