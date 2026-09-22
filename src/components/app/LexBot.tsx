import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, X, Send, Minimize2, Maximize2, Scale, Trash2 } from "lucide-react";
import { Fab, IconButton, Button, TextField, SuggestionChip } from "@/components/m3";
import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";

/* ─────────────────────────────────────────────────────────────────────────────
   Legal Knowledge Base (sourced from Indian legal databases & government sites)
───────────────────────────────────────────────────────────────────────────── */
interface QA {
  keywords: string[];
  question: string;
  answer: string;
  followUps?: string[];
}

const KB: QA[] = [
  {
    keywords: ["fir", "first information report", "police complaint", "file fir"],
    question: "How do I file an FIR?",
    answer:
      "To file an FIR in India:\n\n1. **Visit the nearest police station** — you have the right to file at any station, even outside jurisdiction.\n2. **Report the offence orally or in writing** — the officer must record it under Section 173 CrPC.\n3. **Get a free copy** of the FIR immediately — this is your legal right (Section 154(2) CrPC).\n4. If the police refuse, **send the complaint to SP by post** or file directly before the Magistrate.\n5. You can also file an **e-FIR** on your state police portal for certain offences.\n\n⚖️ Source: Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS) § 173",
    followUps: [
      "What is a Zero FIR?",
      "Can police refuse to file an FIR?",
      "What is a cognisable offence?",
    ],
  },
  {
    keywords: ["zero fir", "zero-fir"],
    question: "What is a Zero FIR?",
    answer:
      "A **Zero FIR** is an FIR that can be filed at **any police station**, regardless of where the offence occurred.\n\n- It is numbered '0' and later transferred to the station with jurisdiction.\n- Introduced after the **Nirbhaya case (2012)** to remove barriers in registering serious offences.\n- Especially important for **rape, sexual assault, and heinous crimes** where time is critical.\n- The receiving station **cannot refuse** to register a Zero FIR.\n\n⚖️ Source: MHA Guidelines & BNSS § 173(1)",
    followUps: ["How do I file an FIR?", "What are my rights when arrested?"],
  },
  {
    keywords: ["arrest", "arrested", "rights arrest", "right arrested"],
    question: "What are my rights when arrested?",
    answer:
      "Under Indian law, every arrested person has these rights:\n\n1. **Right to be informed** of grounds of arrest (Article 22, Constitution)\n2. **Right to consult a lawyer** of your choice immediately\n3. **Right to be produced before a Magistrate** within 24 hours\n4. **Right to bail** for bailable offences\n5. **Right to silence** — you cannot be forced to be a witness against yourself (Article 20(3))\n6. **Right to inform a friend/family** about your arrest\n7. **Women arrested after sunset** can only be produced before female officers\n\n⚖️ Source: Articles 20, 21, 22 of the Constitution; BNSS § 47–60",
    followUps: ["What is bail?", "How do I find a criminal lawyer?", "What is anticipatory bail?"],
  },
  {
    keywords: ["bail", "get bail", "bail application"],
    question: "What is bail and how do I get it?",
    answer:
      "**Bail** is temporary release from custody pending trial or investigation.\n\n**Types of bail:**\n- **Regular bail** — granted by Sessions Court or High Court under BNSS § 480\n- **Anticipatory bail** — obtained before arrest, under BNSS § 482\n- **Default bail (Statutory bail)** — if charge sheet not filed within 60/90 days\n\n**How to apply:**\n1. File a bail application through your Lawyer\n2. Present grounds: no flight risk, no witness tampering, cooperating with investigation\n3. Court considers nature of offence, criminal history, and community ties\n\n**Bail cannot be denied** for offences punishable up to 3 years (first-time offenders).\n\n⚖️ Source: BNSS §§ 478–495",
    followUps: ["What is anticipatory bail?", "What is a surety bond?", "How long does bail take?"],
  },
  {
    keywords: ["anticipatory bail", "pre-arrest bail"],
    question: "What is anticipatory bail?",
    answer:
      "**Anticipatory bail** is bail granted **before arrest** to a person who apprehends arrest.\n\n- Applied to Sessions Court or High Court\n- Court considers: nature of accusation, applicant's history, possibility of fleeing\n- Once granted, police cannot arrest without High Court permission\n- Valid until the end of trial unless cancelled by court\n\n**Required documents:**\n- Detailed application stating reasons for apprehension\n- Affidavit of the applicant\n- Copy of FIR (if filed)\n\n⚖️ Source: BNSS § 482 (formerly CrPC § 438)",
    followUps: ["What is regular bail?", "Can bail be cancelled?"],
  },
  {
    keywords: ["property dispute", "property", "land dispute", "land grab", "encroachment"],
    question: "What should I do in a property dispute?",
    answer:
      "Steps to resolve a **property dispute** in India:\n\n1. **Gather documents** — title deed, sale deed, encumbrance certificate, mutation records\n2. **Check mutation records** at the tehsildar/revenue office\n3. **Send a legal notice** to the opposite party through an Lawyer\n4. **File a civil suit** for declaration, injunction, or specific performance\n5. Consider **mediation or Lok Adalat** for faster resolution\n6. In case of physical encroachment, file a **police complaint under IPC § 447**\n\n**Courts:** Civil Court → District Court → High Court → Supreme Court\n\n⚖️ Source: Transfer of Property Act, 1882; Specific Relief Act, 1963",
    followUps: [
      "How do I send a legal notice?",
      "What is Lok Adalat?",
      "How long does a property case take?",
    ],
  },
  {
    keywords: [
      "consumer complaint",
      "consumer forum",
      "defective product",
      "consumer court",
      "consumer rights",
    ],
    question: "How do I file a consumer complaint?",
    answer:
      "File a consumer complaint under the **Consumer Protection Act, 2019**:\n\n**Forums by amount:**\n- **District Commission** — claims up to ₹1 crore\n- **State Commission** — ₹1 crore to ₹10 crore\n- **National Commission (NCDRC)** — above ₹10 crore\n\n**Steps:**\n1. Write a formal complaint with evidence (bill, warranty, correspondence)\n2. File online at **edaakhil.nic.in** or visit the nearest District Commission\n3. Pay the filing fee (very nominal — ₹200–₹2000)\n4. Attend hearings (usually 3–5 months to resolve)\n\n**You can claim:** Refund, replacement, compensation, and litigation costs.\n\n⚖️ Source: Consumer Protection Act, 2019",
    followUps: [
      "What is the time limit for consumer complaint?",
      "Can I file a complaint against an online seller?",
    ],
  },
  {
    keywords: ["divorce", "marriage", "separation", "matrimonial"],
    question: "What are the grounds for divorce in India?",
    answer:
      "**Grounds for divorce** under Hindu Marriage Act, 1955 (Section 13):\n\n- Adultery\n- Cruelty (physical or mental)\n- Desertion for 2+ years\n- Conversion to another religion\n- Mental disorder\n- Communicable disease\n- Renunciation of the world\n- Presumption of death (7+ years missing)\n\n**Mutual consent divorce:** Both spouses can file jointly after 1 year of separation. Court grants divorce after 6-month cooling-off period (waivable).\n\n**Special Marriage Act** applies for inter-religion or civil marriages.\n\n⚖️ Source: Hindu Marriage Act, 1955; Special Marriage Act, 1954",
    followUps: [
      "What is alimony?",
      "How is child custody decided?",
      "How long does a divorce take?",
    ],
  },
  {
    keywords: ["alimony", "maintenance", "spousal support"],
    question: "What is alimony / maintenance?",
    answer:
      "**Alimony (Permanent Alimony)** is financial support paid by one spouse to another after divorce.\n\n**Interim Maintenance** can be claimed during the pendency of divorce proceedings.\n\n**Factors courts consider:**\n- Income and earning capacity of both spouses\n- Duration of marriage\n- Standard of living during marriage\n- Custody of children\n- Age and health of claimant\n\n**Who can claim:** Either spouse, though traditionally the financially weaker spouse.\n\n**Section 125 CrPC / BNSS** allows maintenance even without divorce for wife, children, and parents.\n\n⚖️ Source: Hindu Marriage Act § 25; BNSS § 144 (formerly CrPC § 125)",
    followUps: ["How is child custody decided?", "What documents are needed for divorce?"],
  },
  {
    keywords: ["cyber crime", "online fraud", "cyber", "hacking", "phishing", "online scam"],
    question: "What should I do if I'm a victim of cybercrime?",
    answer:
      "Steps if you're a victim of **cybercrime** in India:\n\n1. **Report immediately** at **cybercrime.gov.in** — the National Cyber Crime Portal\n2. Call **helpline 1930** (Cyber Crime Helpline) — operational 24/7\n3. File an FIR at your nearest police station or Cyber Cell\n4. **Preserve evidence** — screenshots, emails, URLs, transaction IDs\n5. Contact your bank immediately for financial fraud (within 3 days for zero liability)\n\n**Common cybercrimes:** Online banking fraud, social media hacking, phishing, sextortion, job fraud.\n\n**Punishment:** IT Act 2000 + BNS 2023 — up to 3 years imprisonment and ₹5 lakh fine for hacking.\n\n⚖️ Source: IT Act, 2000; Bharatiya Nyaya Sanhita, 2023",
    followUps: ["How do I recover money from online fraud?", "What is the IT Act?"],
  },
  {
    keywords: ["legal notice", "send legal notice", "notice to party"],
    question: "How do I send a legal notice?",
    answer:
      "A **legal notice** is a formal written communication informing the recipient of your legal claim before filing suit.\n\n**Contents of a legal notice:**\n- Full details of sender and recipient\n- Facts of the dispute\n- Relief or action demanded\n- Time limit (usually 15–30 days to respond)\n- Consequences of non-compliance\n\n**Steps:**\n1. Consult an Lawyer to draft the notice\n2. Send via **Registered Post with Acknowledgement Due (RPAD)**\n3. Keep copies and postal receipts as evidence\n\n**When needed:** Before filing civil suits, consumer complaints, cheque bounce cases (mandatory under NI Act § 138).\n\n⚖️ Source: Code of Civil Procedure; NI Act § 138",
    followUps: [
      "What happens if the other party ignores the notice?",
      "How much does a legal notice cost?",
    ],
  },
  {
    keywords: ["cheque bounce", "dishonoured cheque", "cheque return", "cheque case"],
    question: "What to do if a cheque bounces?",
    answer:
      "A bounced cheque (dishonoured cheque) is a criminal offence under **Section 138 of the Negotiable Instruments Act, 1881**.\n\n**Steps:**\n1. Get the **cheque return memo** from your bank immediately\n2. Send a **legal demand notice** to the issuer within **30 days** of receiving the return memo\n3. If payment not made within **15 days** of receiving the notice, file a complaint in the **Magistrate's Court** within 30 days\n\n**Punishment:** Up to 2 years imprisonment, or fine up to **twice the cheque amount**, or both.\n\n**Limitation:** Complaint must be filed within **30 days** of the 15-day demand notice period.\n\n⚖️ Source: Negotiable Instruments Act, 1881 § 138",
    followUps: ["How do I send a legal notice?", "Can I settle a cheque bounce case out of court?"],
  },
  {
    keywords: ["lok adalat", "lok-adalat", "alternative dispute", "mediation", "settlement"],
    question: "What is Lok Adalat?",
    answer:
      "**Lok Adalat** is an alternative dispute resolution forum in India where disputes are settled by mutual consent.\n\n**Key features:**\n- **Free of cost** — no court fees\n- If settled, court fees paid are **refunded**\n- Award is **final and binding** — no appeal\n- Cases can be referred to Lok Adalat by courts or parties\n- Held by State Legal Services Authorities (SLSA)\n\n**Types of cases suited:** Motor accident claims, matrimonial (non-divorce), labour disputes, bank recovery, land acquisition, utility bill disputes.\n\n**Online Lok Adalat** available at nalsa.gov.in\n\n⚖️ Source: Legal Services Authorities Act, 1987",
    followUps: ["How do I apply for Lok Adalat?", "What cases are not allowed in Lok Adalat?"],
  },
  {
    keywords: [
      "labour law",
      "wrongful termination",
      "dismissed",
      "fired",
      "employee rights",
      "workplace",
    ],
    question: "What are my rights if I'm wrongfully terminated?",
    answer:
      "If terminated **without just cause or proper procedure**, you have these rights:\n\n1. **30 days written notice** or pay in lieu (for employees >1 year service)\n2. **Gratuity** after 5 years of service (under Payment of Gratuity Act, 1972)\n3. **Provident Fund** (EPF) — must be transferred within 45 days\n4. **Retrenchment compensation** — 15 days salary per year under Industrial Disputes Act\n5. File complaint with **Labour Commissioner** or **Labour Court**\n\n**For IT/white-collar employees:** File civil suit for wrongful termination or breach of employment contract.\n\n**New Code on Wages, 2019** ensures minimum wages apply to all employees.\n\n⚖️ Source: Industrial Disputes Act, 1947; Payment of Gratuity Act, 1972",
    followUps: ["How do I file a labour complaint?", "What is the Payment of Gratuity Act?"],
  },
  {
    keywords: ["domestic violence", "dv", "domestic abuse", "protection order"],
    question: "What protections exist for domestic violence victims?",
    answer:
      "The **Protection of Women from Domestic Violence Act, 2005** provides:\n\n**Types of orders available:**\n- **Protection Order** — prevents abuser from committing violence\n- **Residence Order** — ensures victim's right to shared household\n- **Monetary Relief** — compensation for losses, medical expenses\n- **Custody Order** — temporary custody of children\n\n**How to seek protection:**\n1. Contact a **Protection Officer** (appointed by govt in each district)\n2. File application before **Magistrate's Court** (free of charge)\n3. Call **helpline 181** (National Domestic Violence Helpline)\n4. File complaint under **BNS § 85–86** for cruelty\n\n**Emergency:** Call **112** for immediate police assistance.\n\n⚖️ Source: PWDVA, 2005; BNS §§ 85–86",
    followUps: ["What is a protection order?", "How do I find legal aid?"],
  },
  {
    keywords: ["legal aid", "free legal", "free lawyer", "nalsa", "slsa"],
    question: "How do I get free legal aid?",
    answer:
      "**Free legal aid** is a constitutional right for eligible persons under Article 39A.\n\n**Who is eligible:**\n- Women and children (unconditionally)\n- SC/ST members\n- Persons with disabilities\n- Industrial workmen\n- Victims of trafficking\n- Persons in custody\n- Annual income below ₹3 lakh (varies by state)\n\n**How to apply:**\n1. Visit your **District Legal Services Authority (DLSA)**\n2. Apply online at **nalsa.gov.in**\n3. Call **helpline 15100** (toll-free NALSA helpline)\n\nA qualified Lawyer will be assigned at **no cost** to represent you in all courts.\n\n⚖️ Source: Legal Services Authorities Act, 1987; Article 39A",
    followUps: ["What is NALSA?", "What is Lok Adalat?"],
  },
];

/* Quick-start suggested questions shown in the chat */
const SUGGESTED: string[] = [
  "How do I file an FIR?",
  "What are my rights when arrested?",
  "How do I file a consumer complaint?",
  "What should I do in a property dispute?",
  "What to do if a cheque bounces?",
  "How do I get free legal aid?",
];

/* ─────────────────────────────────────────────────────────────────────────────
   Response Engine
───────────────────────────────────────────────────────────────────────────── */
interface BotResponse {
  text: string;
  followUps?: string[];
}

function formatAnswer(raw: string): string {
  return raw.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
}

function findAnswer(query: string): BotResponse {
  const q = query.toLowerCase();
  const match = KB.find(
    (item) =>
      item.keywords.some((kw) => q.includes(kw)) ||
      item.question.toLowerCase().includes(q.slice(0, 20)),
  );
  if (match) {
    return { text: formatAnswer(match.answer), followUps: match.followUps };
  }
  return {
    text: "I couldn't find a specific answer for that. Try rephrasing your question, or use one of the suggested topics. For urgent legal matters, please consult a qualified Lawyer through the <strong>Find a Lawyer</strong> feature.",
    followUps: SUGGESTED.slice(0, 3),
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */
type MessageRole = "user" | "bot";
interface Message {
  id: string;
  role: MessageRole;
  html: string;
  followUps?: string[];
  ts: string;
}

function mkId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}
function mkTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const WELCOME: Message = {
  id: mkId(),
  role: "bot",
  html: "👋 Hello! I'm <strong>Legal Bot</strong>, your AI Assistant powered by Indian legal databases.<br/><br/>Ask me anything about Indian law — FIRs, bail, property disputes, consumer rights, and more. Or pick a topic below:",
  followUps: SUGGESTED,
  ts: mkTime(),
};

/* ─────────────────────────────────────────────────────────────────────────────
   Chat Widget Component
───────────────────────────────────────────────────────────────────────────── */
export function LexBot({
  open: openProp,
  onOpenChange,
  hideTrigger = false,
  raised = false,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  /** Lifts the trigger (and panel) on mobile so it clears a fixed bottom tab bar. */
  raised?: boolean;
} = {}) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = onOpenChange ?? setOpenState;
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<MdOutlinedTextField>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: mkId(), role: "user", html: text, ts: mkTime() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    const delay = 900 + Math.random() * 600;
    setTimeout(() => {
      const resp = findAnswer(text);
      const botMsg: Message = {
        id: mkId(),
        role: "bot",
        html: resp.text,
        followUps: resp.followUps,
        ts: mkTime(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setTyping(false);
    }, delay);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  // md-outlined-text-field's internal <input> lives in its own shadow root,
  // so pressing Enter there doesn't trigger the light-DOM <form>'s implicit
  // submission the way a plain native <input> would — submit explicitly.
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleReset = () => {
    setMessages([WELCOME]);
    setInput("");
  };

  const chatH = expanded ? "h-[85vh] sm:h-[560px]" : "h-[70vh] sm:h-[420px]";
  const chatW = expanded
    ? "w-[calc(100vw-2rem)] sm:w-[420px]"
    : "w-[calc(100vw-2rem)] sm:w-[340px]";
  const bottomPos = hideTrigger || raised ? "bottom-24 sm:bottom-6" : "bottom-4 sm:bottom-6";

  return (
    <>
      {/* Floating trigger button (robot icon only, no text name) */}
      {!open && !hideTrigger && (
        <div className={`fixed ${bottomPos} right-4 sm:right-6 z-50 group`}>
          <Fab
            icon={
              <Bot className="h-6 w-6 stroke-[2.2] transition-transform group-hover:rotate-12" />
            }
            onClick={() => setOpen(true)}
            ariaLabel="Open Legal Bot"
            size="medium"
          />
          <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-background bg-success" />
          </span>
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div
          className={`fixed ${bottomPos} right-4 sm:right-6 z-50 flex flex-col rounded-2xl border border-border/80 bg-surface shadow-2xl overflow-hidden transition-all duration-200 ${chatW} ${chatH}`}
          style={{ maxHeight: "calc(100vh - 2rem)" }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-3 bg-primary px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Scale className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-white">Legal Bot</span>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] text-white/70">Legal Intelligence · Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="text"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={handleReset}
                ariaLabel="Clear chat history"
                className="h-auto! min-h-0! px-2! py-1! text-xs"
                style={
                  {
                    "--md-text-button-label-text-color": "rgba(255,255,255,0.8)",
                    "--md-text-button-with-icon-icon-color": "rgba(255,255,255,0.8)",
                    "--md-text-button-hover-label-text-color": "#ffffff",
                    "--md-text-button-hover-state-layer-color": "#ffffff",
                  } as React.CSSProperties
                }
              >
                Clear
              </Button>
              <IconButton
                onClick={() => setExpanded((v) => !v)}
                title={expanded ? "Compact" : "Expand"}
                style={
                  {
                    "--md-icon-button-icon-color": "rgba(255,255,255,0.7)",
                    "--md-icon-button-hover-icon-color": "#ffffff",
                    "--md-icon-button-hover-state-layer-color": "#ffffff",
                    "--md-icon-button-icon-size": "14px",
                  } as React.CSSProperties
                }
              >
                {expanded ? (
                  <Minimize2 className="h-3.5 w-3.5" />
                ) : (
                  <Maximize2 className="h-3.5 w-3.5" />
                )}
              </IconButton>
              <IconButton
                onClick={() => setOpen(false)}
                title="Close"
                style={
                  {
                    "--md-icon-button-icon-color": "rgba(255,255,255,0.7)",
                    "--md-icon-button-hover-icon-color": "#ffffff",
                    "--md-icon-button-hover-state-layer-color": "#ffffff",
                    "--md-icon-button-icon-size": "14px",
                  } as React.CSSProperties
                }
              >
                <X className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-background/60">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                    msg.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-surface border border-border/60 text-foreground"
                  }`}
                  dangerouslySetInnerHTML={{ __html: msg.html }}
                />
                {/* Timestamp */}
                <span className="mt-0.5 px-1 text-[10px] text-muted-foreground">{msg.ts}</span>

                {/* Follow-up quick replies */}
                {msg.role === "bot" && msg.followUps && msg.followUps.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5 max-w-[92%]">
                    {msg.followUps.map((q) => (
                      <SuggestionChip key={q} label={q} onClick={() => sendMessage(q)} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
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

          {/* Bottom Pinned Quick Questions Bar (Always accessible at the bottom) */}
          {!typing && (
            <div className="shrink-0 border-t border-border/50 bg-surface/95 px-3 py-2">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Suggested Questions:
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {(
                  messages
                    .slice()
                    .reverse()
                    .find((m) => m.role === "bot" && m.followUps && m.followUps.length > 0)
                    ?.followUps || SUGGESTED
                ).map((q) => (
                  <SuggestionChip
                    key={q}
                    label={q}
                    onClick={() => sendMessage(q)}
                    className="shrink-0 whitespace-nowrap"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Input bar */}
          <form
            onSubmit={handleSubmit}
            className="shrink-0 flex items-center gap-2 border-t border-border/70 bg-surface px-3 py-2.5"
          >
            <TextField
              ref={inputRef}
              value={input}
              onChange={setInput}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask a legal question..."
              disabled={typing}
              className="flex-1"
            />
            <IconButton
              type="submit"
              variant="filled"
              disabled={!input.trim() || typing}
              ariaLabel="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </IconButton>
          </form>

          {/* Footer */}
          <div className="shrink-0 border-t border-border/40 bg-muted/30 px-3 py-1.5 text-center">
            <span className="text-[9px] text-muted-foreground">
              Powered by Indian legal databases · Not a substitute for legal advice
            </span>
          </div>
        </div>
      )}
    </>
  );
}
