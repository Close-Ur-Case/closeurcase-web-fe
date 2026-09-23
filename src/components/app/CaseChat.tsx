import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  MessageCircle,
  Check,
  CheckCheck,
  Paperclip,
  Mic,
  FileText,
  Image as ImageIcon,
  Play,
  Pause,
  StopCircle,
  ArrowLeft,
  UploadCloud,
  Loader2,
  Video,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { LegalCase } from "@/types";
import { UserAvatar } from "@/components/app/UserAvatar";
import { useVideoCall } from "@/features/video-call/VideoCallContext";
import { chatService } from "@/services/chatService";
import { storageService } from "@/services/storageService";

/* ══════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════ */
export interface ChatMessage {
  id: string;
  caseId: string;
  text?: string;
  sender: "citizen" | "lawyer";
  senderName: string;
  at: string;
  read: boolean;
  attachmentType?: "image" | "file" | "audio";
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentSize?: string;
  audioDuration?: number;
}

/* ══════════════════════════════════════════════════════════
   LOCAL STORAGE
══════════════════════════════════════════════════════════ */
const CHAT_KEY = "cuc_case_chats_v1";

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]) {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(msgs));
    window.dispatchEvent(new Event("cuc_chat_updated"));
  } catch {
    // localStorage write failed — ignore, chat still works in-memory
  }
}

/* ══════════════════════════════════════════════════════════
   FORMATTERS
══════════════════════════════════════════════════════════ */
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}
function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}
function fmtDur(sec: number) {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
}

/* ══════════════════════════════════════════════════════════
   DEMO SEED DATA — gives a case its first few messages so the
   chat box isn't empty on first open. Only used when a case has
   zero stored messages; real messages always take priority.
══════════════════════════════════════════════════════════ */
function seedDemoMessages(caseItem: LegalCase): ChatMessage[] {
  const citizenName = caseItem.citizenName || "Client";
  const lawyerName = caseItem.lawyerName || "Your Lawyer";
  const now = Date.now();
  const minsAgo = (n: number) => new Date(now - n * 60000).toISOString();

  const seed: Omit<ChatMessage, "id">[] = [
    {
      caseId: caseItem.id,
      sender: "lawyer",
      senderName: lawyerName,
      read: true,
      at: minsAgo(180),
      text: `Hi ${citizenName}, I've reviewed case ${caseItem.id} and started preparing the initial paperwork.`,
    },
    {
      caseId: caseItem.id,
      sender: "citizen",
      senderName: citizenName,
      read: true,
      at: minsAgo(170),
      text: "Thank you! Please let me know if you need anything from my side.",
    },
    {
      caseId: caseItem.id,
      sender: "lawyer",
      senderName: lawyerName,
      read: true,
      at: minsAgo(140),
      text: "Could you share a copy of the relevant documents when you get a chance?",
    },
    {
      caseId: caseItem.id,
      sender: "citizen",
      senderName: citizenName,
      read: true,
      at: minsAgo(135),
      text: "Sure — I'll upload it here shortly.",
    },
    {
      caseId: caseItem.id,
      sender: "lawyer",
      senderName: lawyerName,
      read: false,
      at: minsAgo(20),
      text: "Great — once I have it, I'll draft a response and share it for your review.",
    },
  ];

  return seed.map((m, i) => ({ ...m, id: `seed_${caseItem.id}_${i}` }));
}

/* ══════════════════════════════════════════════════════════
   READ TICKS — tuned to sit on the primary-colored bubble
══════════════════════════════════════════════════════════ */
function Ticks({ read }: { read: boolean }) {
  return read ? (
    <CheckCheck className="h-3.5 w-3.5 shrink-0 text-sky-300" />
  ) : (
    <Check className="h-3.5 w-3.5 shrink-0 text-primary-foreground/60" />
  );
}

/* ══════════════════════════════════════════════════════════
   AUDIO PLAYER
══════════════════════════════════════════════════════════ */
function AudioPlayer({
  url,
  duration = 0,
  mine,
}: {
  url: string;
  duration?: number;
  mine: boolean;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cur, setCur] = useState(0);

  const toggle = () => {
    if (!ref.current) return;
    if (playing) {
      ref.current.pause();
    } else {
      ref.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="flex items-center gap-3" style={{ minWidth: "clamp(160px,40vw,240px)" }}>
      <audio
        ref={ref}
        src={url}
        onTimeUpdate={() => {
          const a = ref.current;
          if (!a) return;
          setCur(a.currentTime);
          setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
          setCur(0);
        }}
      />
      <button
        onClick={toggle}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 ${
          mine
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <div className="flex-1 space-y-1.5">
        <div
          className={`relative h-1.5 overflow-hidden rounded-full ${mine ? "bg-primary-foreground/25" : "bg-border"}`}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${mine ? "bg-primary-foreground" : "bg-primary"}`}
            style={{ width: `${progress}%`, transition: "width .1s linear" }}
          />
        </div>
        <div
          className={`flex justify-between text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
        >
          <span>{fmtDur(cur)}</span>
          <span>{fmtDur(duration)}</span>
        </div>
      </div>
      <Mic
        className={`h-4 w-4 shrink-0 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MESSAGE BUBBLE
══════════════════════════════════════════════════════════ */
function Bubble({ msg, role }: { msg: ChatMessage; role: "citizen" | "lawyer" }) {
  const mine = msg.sender === role;
  return (
    <div
      className={`flex ${mine ? "justify-end" : "justify-start"} mb-1.5 px-3 sm:px-5 message-pop`}
    >
      <div
        className={`relative shadow-sm ${
          mine
            ? "bg-primary text-primary-foreground rounded-[18px_18px_4px_18px]"
            : "bg-surface text-foreground border border-border rounded-[18px_18px_18px_4px]"
        }`}
        style={{
          maxWidth: "min(80%, 520px)",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          padding: "9px 13px",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        {/* Sender label — always shown so it's unambiguous who sent what */}
        <div
          className={`mb-0.5 text-[11px] font-bold ${mine ? "text-primary-foreground/80" : "text-primary"}`}
        >
          {mine ? "You" : msg.senderName}
        </div>

        {/* Image */}
        {msg.attachmentType === "image" && msg.attachmentUrl && (
          <div className="mb-2 overflow-hidden rounded-xl">
            <img
              src={msg.attachmentUrl}
              alt={msg.attachmentName}
              className="w-full object-cover"
              style={{ maxHeight: "280px" }}
            />
            {msg.attachmentName && (
              <div
                className={`mt-1 text-[11px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}
              >
                {msg.attachmentName}
              </div>
            )}
          </div>
        )}

        {/* File */}
        {msg.attachmentType === "file" && (
          <a
            href={msg.attachmentUrl}
            download={msg.attachmentName}
            className={`mb-2 flex items-center gap-3 rounded-xl p-3 no-underline transition-colors ${
              mine
                ? "bg-primary-foreground/15 hover:bg-primary-foreground/20"
                : "bg-muted hover:bg-muted/70"
            }`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${mine ? "bg-primary-foreground/20" : "bg-primary"}`}
            >
              <FileText
                className={`h-5 w-5 ${mine ? "text-primary-foreground" : "text-primary-foreground"}`}
              />
            </div>
            <div className="min-w-0">
              <div
                className={`truncate text-[13px] font-semibold ${mine ? "text-primary-foreground" : "text-foreground"}`}
              >
                {msg.attachmentName}
              </div>
              <div
                className={`text-[11px] ${mine ? "text-primary-foreground/65" : "text-muted-foreground"}`}
              >
                {msg.attachmentSize}
              </div>
            </div>
          </a>
        )}

        {/* Audio */}
        {msg.attachmentType === "audio" && msg.attachmentUrl && (
          <div className="mb-2">
            <AudioPlayer url={msg.attachmentUrl} duration={msg.audioDuration} mine={mine} />
          </div>
        )}

        {/* Text */}
        {msg.text && <span>{msg.text}</span>}

        {/* Meta */}
        <div className={`mt-1 flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
          <span
            className={`text-[10px] ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}
          >
            {fmtTime(msg.at)}
          </span>
          {mine && <Ticks read={msg.read} />}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DATE SEPARATOR
══════════════════════════════════════════════════════════ */
function DateSep({ label }: { label: string }) {
  return (
    <div className="my-4 flex items-center justify-center">
      <span className="rounded-full bg-surface border border-border px-4 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
        {label}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   UPLOAD PROGRESS TOAST (staged attachment feedback)
══════════════════════════════════════════════════════════ */
function UploadingRow({ name }: { name: string }) {
  return (
    <div className="flex justify-end mb-1.5 px-3 sm:px-5">
      <div className="flex items-center gap-2.5 rounded-2xl bg-primary/10 border border-primary/20 px-3.5 py-2.5 text-xs font-medium text-primary">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="max-w-[160px] truncate">{name}</span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MIC RECORDER HOOK
══════════════════════════════════════════════════════════ */
function useRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.start();
      mrRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      alert("Microphone permission denied.");
    }
  }, []);

  const stop = useCallback(
    (): Promise<{ url: string; duration: number } | null> =>
      new Promise((resolve) => {
        const mr = mrRef.current;
        if (!mr) {
          resolve(null);
          return;
        }
        const dur = seconds;
        mr.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.onload = () => resolve({ url: reader.result as string, duration: dur });
          reader.readAsDataURL(blob);
          mr.stream.getTracks().forEach((t) => t.stop());
          if (timerRef.current) clearInterval(timerRef.current);
          setRecording(false);
          setSeconds(0);
        };
        mr.stop();
      }),
    [seconds],
  );

  const cancel = useCallback(() => {
    const mr = mrRef.current;
    if (!mr) return;
    mr.onstop = null;
    mr.stop();
    mr.stream.getTracks().forEach((t) => t.stop());
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setSeconds(0);
  }, []);

  return { recording, seconds, start, stop, cancel };
}

/* ══════════════════════════════════════════════════════════
   ICON BUTTON helper — themed to the app's design tokens
══════════════════════════════════════════════════════════ */
function IconBtn({
  onClick,
  title,
  children,
  size = 44,
  className = "text-muted-foreground hover:bg-muted",
}: {
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  size?: number;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      type="button"
      className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-all active:scale-90 ${className}`}
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PANEL
══════════════════════════════════════════════════════════ */
interface CaseChatProps {
  caseItem: LegalCase;
  role: "citizen" | "lawyer";
  onClose: () => void;
}

export function CaseChat({ caseItem, role, onClose }: CaseChatProps) {
  const { startCall } = useVideoCall();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [visible, setVisible] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);
  const [uploading, setUploading] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const dragCounter = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const recorder = useRecorder();

  /* -- animate in -- */
  useEffect(() => {
    // Double-rAF ensures the browser has painted the initial hidden state first
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  /* -- load + mark read (seeding a short demo conversation the first time a case has none) -- */
  const refresh = useCallback(() => {
    const all = loadMessages();
    const existing = all.filter((m) => m.caseId === caseItem.id);
    const withSeed = existing.length > 0 ? all : [...all, ...seedDemoMessages(caseItem)];
    setMessages(withSeed.filter((m) => m.caseId === caseItem.id));
    const updated = withSeed.map((m) =>
      m.caseId === caseItem.id && m.sender !== role ? { ...m, read: true } : m,
    );
    saveMessages(updated);
  }, [caseItem, role]);

  useEffect(() => {
    refresh();
    window.addEventListener("cuc_chat_updated", refresh);

    const syncRemote = () => {
      chatService
        .getMessages(caseItem.id)
        .then((remoteMessages) => {
          if (remoteMessages && Array.isArray(remoteMessages) && remoteMessages.length > 0) {
            const current = loadMessages();
            let changed = false;
            const merged = [...current];

            remoteMessages.forEach((rm) => {
              const exists = merged.some((m) => m.id === rm.id);
              if (!exists) {
                changed = true;
                merged.push({
                  id: rm.id,
                  caseId: rm.caseId,
                  text: rm.text || rm.message || undefined,
                  sender: rm.sender,
                  senderName: rm.senderName,
                  at: rm.at,
                  read: rm.read,
                  attachmentType: rm.attachmentType || undefined,
                  attachmentName: rm.attachmentName || undefined,
                  attachmentUrl: rm.attachmentUrl || undefined,
                  attachmentSize: rm.attachmentSize || undefined,
                  audioDuration: rm.audioDuration || undefined,
                });
              }
            });

            if (changed) {
              saveMessages(merged);
              setMessages(merged.filter((m) => m.caseId === caseItem.id));
            }
          }
        })
        .catch((err) => console.warn("Remote chat messages sync error:", err));
    };

    syncRemote();
    const intervalId = setInterval(syncRemote, 3500);

    // Mark remote messages read
    chatService
      .markRead(caseItem.id)
      .catch((err) => console.warn("Remote chat mark read error:", err));

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("cuc_chat_updated", refresh);
    };
  }, [refresh, caseItem.id]);

  /* -- hide any global floating widget (e.g. a support/webbot bubble) while a chat is open --
     Toggle a class on <body> and pair it with a CSS rule in your global stylesheet, e.g.:
       body.case-chat-open #webbot-icon { display: none !important; }
     Swap in the real selector/id your webbot widget uses. */
  useEffect(() => {
    document.body.classList.add("case-chat-open");
    return () => document.body.classList.remove("case-chat-open");
  }, []);

  /* -- keep the latest message in view, like WhatsApp — only the message list scrolls -- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, uploading]);

  /* -- focus input -- */
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  /* -- escape + close on outside click -- */
  const close = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [close]);

  /* -- prevent body scroll while open -- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const myName =
    role === "citizen" ? caseItem.citizenName || "Citizen" : caseItem.lawyerName || "Lawyer";
  const otherParty =
    role === "citizen"
      ? caseItem.lawyerName || "Assigned Lawyer"
      : caseItem.citizenName || "Client";
  const canVideoCall =
    role === "citizen" ? Boolean(caseItem.lawyerName) : Boolean(caseItem.citizenName);

  /* -- send text -- */
  const sendText = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      caseId: caseItem.id,
      text,
      sender: role,
      senderName: myName,
      at: new Date().toISOString(),
      read: false,
    };
    saveMessages([...loadMessages(), msg]);
    setMessages((p) => [...p, msg]);
    setInput("");

    // Asynchronously dispatch to Supabase backend API
    chatService
      .sendMessage(caseItem.id, {
        text,
        message: text,
        sender: role,
        senderName: myName,
      })
      .catch((err) => console.warn("Remote chat send message error:", err));
  }, [input, role, caseItem, myName]);

  /* -- send attachment -- */
  const sendAttach = useCallback(
    (
      attachmentType: "image" | "file" | "audio",
      attachmentUrl: string,
      attachmentName: string,
      attachmentSize: string,
      audioDuration?: number,
    ) => {
      const msg: ChatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        caseId: caseItem.id,
        sender: role,
        senderName: myName,
        at: new Date().toISOString(),
        read: false,
        attachmentType,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        audioDuration,
      };
      saveMessages([...loadMessages(), msg]);
      setMessages((p) => [...p, msg]);

      // Asynchronously dispatch to Supabase backend API
      chatService
        .sendMessage(caseItem.id, {
          attachmentType,
          attachmentUrl,
          attachmentName,
          attachmentSize,
          audioDuration,
          sender: role,
          senderName: myName,
        })
        .catch((err) => console.warn("Remote chat attachment send error:", err));
    },
    [role, caseItem, myName],
  );

  /* -- process one or many files, each with a brief "uploading" state for premium feel -- */
  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).slice(0, 8); // sane cap per batch
      files.forEach(async (file) => {
        setUploading((p) => [...p, file.name]);
        const type: "image" | "file" = file.type.startsWith("image/") ? "image" : "file";
        let url = "";

        try {
          const res = await storageService.uploadFile(file, {
            bucket: "case-documents",
            folder: `chat_${caseItem.id}`,
          });
          if (res?.fileUrl) {
            url = res.fileUrl;
          }
        } catch (uploadErr) {
          console.warn("[CaseChat] Cloud attachment upload fallback to local:", uploadErr);
        }

        if (!url) {
          url = await storageService.readFileAsDataUrl(file);
        }

        sendAttach(type, url, file.name, fmtBytes(file.size));
        setUploading((p) => p.filter((n) => n !== file.name));
      });
    },
    [sendAttach, caseItem.id],
  );

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) handleFiles(e.target.files);
    e.target.value = "";
  };

  /* -- drag & drop -- */
  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes("Files")) setDragging(true);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragging(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  /* -- mic -- */
  const onMic = async () => {
    if (recorder.recording) {
      const r = await recorder.stop();
      if (r) sendAttach("audio", r.url, "Voice message", "", r.duration);
    } else {
      await recorder.start();
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  /* -- group by date -- */
  type G = { label: string; msgs: ChatMessage[] };
  const groups: G[] = [];
  messages.forEach((m) => {
    const label = fmtDate(m.at);
    const last = groups[groups.length - 1];
    if (!last || last.label !== label) groups.push({ label, msgs: [m] });
    else last.msgs.push(m);
  });

  /* ── render ── */
  return (
    <>
      <style>{`
        @keyframes messagePop {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .message-pop { animation: messagePop 0.22s ease-out; }
        @keyframes attachMenuIn {
          from { opacity: 0; transform: translateY(6px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* ══ PAGE — proper flex column: header → scrollable content → input bar ══ */}
      <div
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        className="flex h-full min-h-0 w-full flex-col bg-background"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.22s ease",
        }}
      >
        {/* ══ TOP HEADER BAR ══════════════════════════════════════════════ */}
        <div
          className="relative z-0 flex shrink-0 items-center gap-3 bg-gradient-to-r from-primary to-primary/90 px-3 sm:px-5"
          style={{ minHeight: "64px", paddingTop: "env(safe-area-inset-top)" }}
        >
          {/* Back */}
          <IconBtn
            onClick={close}
            title="Back"
            className="text-primary-foreground hover:bg-primary-foreground/15"
          >
            <ArrowLeft className="h-5 w-5" />
          </IconBtn>

          {/* Avatar */}
          <UserAvatar name={otherParty} size="md" className="ring-2 ring-primary-foreground/30" />

          {/* Name + status */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold leading-tight text-primary-foreground sm:text-base">
              {otherParty}
            </div>
            <div className="truncate text-[11px] text-primary-foreground/75">
              {caseItem.id} · {caseItem.category} · {caseItem.status}
            </div>
          </div>

          <IconBtn
            onClick={() => {
              if (!canVideoCall) return;
              startCall({ caseId: caseItem.id, withName: otherParty, role });
            }}
            title={canVideoCall ? `Video call ${otherParty}` : "No assigned contact to call"}
            className={
              canVideoCall
                ? "text-primary-foreground hover:bg-primary-foreground/15"
                : "cursor-not-allowed text-primary-foreground/40"
            }
          >
            <Video className="h-5 w-5" />
          </IconBtn>
        </div>

        {/* ══ CASE DETAILS — sits on top of the chat box ═══════════════════ */}
        <div className="shrink-0 border-b border-border bg-surface px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[13px] font-bold text-primary">{caseItem.id}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {caseItem.status}
                </span>
              </div>
              <div className="mt-0.5 truncate text-[13px] font-semibold text-foreground">
                {caseItem.title}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">{caseItem.category}</span>
              </span>
              {caseItem.city && <span>{caseItem.city}</span>}
              {caseItem.createdAt && <span>Filed {caseItem.createdAt}</span>}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
            <span>
              Citizen:{" "}
              <span className="font-semibold text-foreground">{caseItem.citizenName || "—"}</span>
            </span>
            <span>
              Lawyer:{" "}
              <span className="font-semibold text-foreground">
                {caseItem.lawyerName || "Pending assignment"}
              </span>
            </span>
          </div>
        </div>

        {/* ══ MESSAGES AREA ═══════════════════════════════════════════════ */}
        <div
          className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain bg-muted/40 py-3"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {/* Drag & drop overlay */}
          {dragging && (
            <div className="pointer-events-none absolute inset-2 z-10 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
              <UploadCloud className="h-9 w-9 text-primary" />
              <p className="text-sm font-semibold text-primary">Drop files to send</p>
            </div>
          )}

          {/* Empty state */}
          {groups.length === 0 && uploading.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/12">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-foreground">No messages yet</p>
                <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
                  Start the conversation about case{" "}
                  <span className="font-semibold text-primary">{caseItem.id}</span>
                </p>
              </div>
            </div>
          )}

          {/* Message groups */}
          {groups.map((g) => (
            <div key={g.label}>
              <DateSep label={g.label} />
              {g.msgs.map((m) => (
                <Bubble key={m.id} msg={m} role={role} />
              ))}
            </div>
          ))}

          {/* In-flight uploads */}
          {uploading.map((name, i) => (
            <UploadingRow key={`${name}-${i}`} name={name} />
          ))}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* ══ RECORDING BANNER ════════════════════════════════════════════ */}
        {recorder.recording && (
          <div className="flex shrink-0 items-center justify-between border-t-2 border-red-200 bg-red-50 px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500" />
              </span>
              <span className="text-[14px] font-semibold text-red-600">
                Recording — {fmtDur(recorder.seconds)}
              </span>
            </div>
            <button
              onClick={recorder.cancel}
              className="cursor-pointer rounded-full px-4 py-1.5 text-[12px] font-semibold text-red-500 transition-colors hover:bg-red-100"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ══ ATTACH MENU (popover) ═══════════════════════════════════════ */}
        {attachOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setAttachOpen(false)} />
            <div
              className="absolute bottom-[70px] left-2 z-30 flex flex-col gap-1 rounded-2xl border border-border bg-surface p-1.5 shadow-xl sm:left-4"
              style={{ animation: "attachMenuIn 0.16s ease-out" }}
            >
              <button
                onClick={() => {
                  imageInputRef.current?.click();
                  setAttachOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12">
                  <ImageIcon className="h-4.5 w-4.5 text-primary" />
                </span>
                Photos &amp; Videos
              </button>
              <button
                onClick={() => {
                  docInputRef.current?.click();
                  setAttachOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                </span>
                Document
              </button>
            </div>
          </>
        )}

        {/* ══ INPUT BAR ═══════════════════════════════════════════════════ */}
        <div className="shrink-0 flex items-center gap-1.5 border-t border-border bg-surface px-2 py-2.5 sm:gap-2 sm:px-4 sm:py-3 pb-[calc(0.625rem+env(safe-area-inset-bottom))] z-30">
          {/* Hidden file inputs */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={onFile}
          />
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.zip"
            multiple
            className="hidden"
            onChange={onFile}
          />

          {/* Attach */}
          <IconBtn
            onClick={() => setAttachOpen((v) => !v)}
            title="Attach file or image"
            className={
              attachOpen ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted"
            }
          >
            <Paperclip className="h-[22px] w-[22px]" />
          </IconBtn>

          {/* Text / voice placeholder */}
          {!recorder.recording ? (
            <input
              ref={inputRef}
              id={`chat-input-${caseItem.id}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Type a message"
              className="flex-1 min-w-0 rounded-full border border-border bg-background px-5 text-[14px] text-foreground outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              style={{ height: "46px" }}
            />
          ) : (
            <div
              className="flex flex-1 min-w-0 items-center rounded-full border border-border bg-background px-5 text-[14px] italic text-muted-foreground"
              style={{ height: "46px" }}
            >
              Voice message…
            </div>
          )}

          {/* Send / Mic */}
          {input.trim() && !recorder.recording ? (
            <IconBtn
              onClick={sendText}
              size={46}
              title="Send"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <Send style={{ width: 20, height: 20 }} />
            </IconBtn>
          ) : (
            <IconBtn
              onClick={onMic}
              size={46}
              title={recorder.recording ? "Stop & send voice note" : "Record voice note"}
              className={
                recorder.recording
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              }
            >
              {recorder.recording ? (
                <StopCircle style={{ width: 22, height: 22 }} />
              ) : (
                <Mic style={{ width: 22, height: 22 }} />
              )}
            </IconBtn>
          )}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   CHAT TRIGGER BUTTON
══════════════════════════════════════════════════════════ */
interface ChatButtonProps {
  caseItem: LegalCase;
  role: "citizen" | "lawyer";
}

export function ChatButton({ caseItem, role }: ChatButtonProps) {
  const [unread, setUnread] = useState(0);

  const count = useCallback(() => {
    setUnread(
      loadMessages().filter((m) => m.caseId === caseItem.id && m.sender !== role && !m.read).length,
    );
  }, [caseItem.id, role]);

  useEffect(() => {
    count();
    window.addEventListener("cuc_chat_updated", count);
    return () => window.removeEventListener("cuc_chat_updated", count);
  }, [count]);

  return (
    <Link
      id={`chat-btn-${caseItem.id}`}
      to={role === "citizen" ? "/citizen/chat/$id" : "/lawyer/chat/$id"}
      params={{ id: caseItem.id }}
      className="relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] transition-colors hover:brightness-95"
      title={`Chat about case ${caseItem.id}`}
      aria-label={`Chat about case ${caseItem.id}`}
    >
      <MessageCircle className="h-4 w-4" />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] animate-pulse items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
