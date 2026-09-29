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
  Download,
  X,
  ExternalLink,
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
   MESSAGE DEDUPLICATION & LOCAL STORAGE
══════════════════════════════════════════════════════════ */
const CHAT_KEY = "cuc_case_chats_v1";

export function dedupeMessages(msgs: ChatMessage[]): ChatMessage[] {
  const seenIds = new Set<string>();
  const result: ChatMessage[] = [];

  for (const m of msgs) {
    if (!m || !m.id) continue;
    // 1. Exact ID match check
    if (seenIds.has(m.id)) continue;

    // 2. Check for temporary vs confirmed duplicate or duplicate content sent in same window
    const dupIdx = result.findIndex((existing) => {
      if (existing.caseId !== m.caseId || existing.sender !== m.sender) return false;
      const textMatches = m.text && existing.text && m.text.trim() === existing.text.trim();
      const attachMatches =
        m.attachmentUrl &&
        existing.attachmentUrl &&
        m.attachmentUrl === existing.attachmentUrl;
      if (!textMatches && !attachMatches) return false;

      const timeDiff = Math.abs(new Date(existing.at).getTime() - new Date(m.at).getTime());
      // Reconcile optimistic temp message with confirmed server message
      if ((existing.id.startsWith("temp_") || m.id.startsWith("temp_")) && timeDiff < 30000) {
        return true;
      }
      // Or if two messages have identical content sent within 4 seconds (duplicate click/dispatch)
      if (timeDiff < 4000) {
        return true;
      }
      return false;
    });

    if (dupIdx !== -1) {
      // If incoming message is confirmed server message (not temp) and existing is temp, upgrade it!
      if (!m.id.startsWith("temp_") && result[dupIdx].id.startsWith("temp_")) {
        seenIds.delete(result[dupIdx].id);
        result[dupIdx] = m;
        seenIds.add(m.id);
      }
      continue;
    }

    seenIds.add(m.id);
    result.push(m);
  }

  return result;
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? dedupeMessages(parsed) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[], notify: boolean = true) {
  try {
    const deduped = dedupeMessages(msgs);
    localStorage.setItem(CHAT_KEY, JSON.stringify(deduped));
    if (notify) {
      window.dispatchEvent(new Event("cuc_chat_updated"));
    }
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
   IMAGE LIGHTBOX MODAL
══════════════════════════════════════════════════════════ */
function ImageLightbox({
  url,
  name,
  onClose,
}: {
  url: string;
  name?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="absolute top-4 right-4 flex items-center gap-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={url}
          download={name || "image"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
          title="Download file"
        >
          <Download className="h-5 w-5" />
        </a>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors cursor-pointer"
          title="Close preview"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        className="max-h-[85vh] max-w-[92vw] overflow-hidden rounded-xl shadow-2xl flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={name || "Preview"}
          className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
        />
        {name && (
          <div className="mt-3 text-center text-xs font-medium text-white/80 max-w-[80vw] truncate">
            {name}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   READ TICKS
══════════════════════════════════════════════════════════ */
function Ticks({ read }: { read: boolean }) {
  return read ? (
    <span title="Read" className="inline-flex items-center">
      <CheckCheck className="h-3.5 w-3.5 shrink-0 text-sky-300" />
    </span>
  ) : (
    <span title="Sent" className="inline-flex items-center">
      <Check className="h-3.5 w-3.5 shrink-0 text-primary-foreground/60" />
    </span>
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
        type="button"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90 cursor-pointer ${
          mine
            ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/30"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        }`}
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </button>
      <div className="flex-1 space-y-1.5">
        <div
          className={`relative h-1.5 overflow-hidden rounded-full ${
            mine ? "bg-primary-foreground/25" : "bg-border"
          }`}
        >
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${
              mine ? "bg-primary-foreground" : "bg-primary"
            }`}
            style={{ width: `${progress}%`, transition: "width .1s linear" }}
          />
        </div>
        <div
          className={`flex justify-between text-[10px] ${
            mine ? "text-primary-foreground/70" : "text-muted-foreground"
          }`}
        >
          <span>{fmtDur(cur)}</span>
          <span>{fmtDur(duration)}</span>
        </div>
      </div>
      <Mic
        className={`h-4 w-4 shrink-0 ${
          mine ? "text-primary-foreground/70" : "text-muted-foreground"
        }`}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MESSAGE BUBBLE
══════════════════════════════════════════════════════════ */
function Bubble({
  msg,
  role,
  onImageClick,
}: {
  msg: ChatMessage;
  role: "citizen" | "lawyer";
  onImageClick?: (url: string, name?: string) => void;
}) {
  const mine = msg.sender === role;
  return (
    <div
      className={`flex ${mine ? "justify-end" : "justify-start"} mb-2 px-3 sm:px-5 message-pop`}
    >
      <div
        className={`relative shadow-sm ${
          mine
            ? "bg-primary text-primary-foreground rounded-[18px_18px_4px_18px]"
            : "bg-surface text-foreground border border-border rounded-[18px_18px_18px_4px]"
        }`}
        style={{
          maxWidth: "min(82%, 520px)",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          padding: "10px 14px",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
      >
        {/* Sender label */}
        <div
          className={`mb-1 text-[11px] font-bold ${
            mine ? "text-primary-foreground/80" : "text-primary"
          }`}
        >
          {mine ? "You" : msg.senderName}
        </div>

        {/* Image / Photo attachment */}
        {msg.attachmentType === "image" && msg.attachmentUrl && (
          <div className="mb-2">
            <div
              onClick={() => onImageClick?.(msg.attachmentUrl!, msg.attachmentName)}
              className="group relative cursor-pointer overflow-hidden rounded-xl bg-black/10 transition-transform active:scale-[0.99]"
            >
              <img
                src={msg.attachmentUrl}
                alt={msg.attachmentName || "Case Image"}
                className="w-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-[1.02]"
                style={{ maxHeight: "280px" }}
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 rounded-xl">
                <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-xs">
                  Click to expand
                </span>
              </div>
            </div>
            {msg.attachmentName && (
              <div
                className={`mt-1 truncate text-[11px] ${
                  mine ? "text-primary-foreground/75" : "text-muted-foreground"
                }`}
              >
                {msg.attachmentName}
              </div>
            )}
          </div>
        )}

        {/* File document attachment */}
        {msg.attachmentType === "file" && (
          <a
            href={msg.attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={msg.attachmentName || "case-document"}
            className={`mb-2 flex items-center justify-between gap-3 rounded-xl p-3 no-underline transition-colors ${
              mine
                ? "bg-primary-foreground/15 hover:bg-primary-foreground/25"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  mine ? "bg-primary-foreground/20" : "bg-primary"
                }`}
              >
                <FileText
                  className={`h-5 w-5 ${
                    mine ? "text-primary-foreground" : "text-primary-foreground"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <div
                  className={`truncate text-[13px] font-semibold ${
                    mine ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {msg.attachmentName || "Document"}
                </div>
                <div
                  className={`text-[11px] ${
                    mine ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  {msg.attachmentSize || "File"}
                </div>
              </div>
            </div>
            <div
              className={`shrink-0 rounded-full p-2 ${
                mine
                  ? "text-primary-foreground/80 hover:bg-primary-foreground/15"
                  : "text-muted-foreground hover:bg-background"
              }`}
              title="Download file"
            >
              <Download className="h-4 w-4" />
            </div>
          </a>
        )}

        {/* Audio voice note */}
        {msg.attachmentType === "audio" && msg.attachmentUrl && (
          <div className="mb-2">
            <AudioPlayer url={msg.attachmentUrl} duration={msg.audioDuration} mine={mine} />
          </div>
        )}

        {/* Text message */}
        {msg.text && (
          <span className="whitespace-pre-wrap leading-relaxed select-text">{msg.text}</span>
        )}

        {/* Meta time + read status */}
        <div className={`mt-1 flex items-center gap-1 ${mine ? "justify-end" : "justify-start"}`}>
          <span
            className={`text-[10px] ${
              mine ? "text-primary-foreground/60" : "text-muted-foreground"
            }`}
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
      <span className="rounded-full bg-surface border border-border px-4 py-1 text-[11px] font-medium text-muted-foreground shadow-xs">
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
    <div className="flex justify-end mb-2 px-3 sm:px-5">
      <div className="flex items-center gap-2.5 rounded-2xl bg-primary/10 border border-primary/20 px-3.5 py-2.5 text-xs font-medium text-primary shadow-xs">
        <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
        <span className="max-w-[180px] truncate">Uploading {name}…</span>
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
      alert("Microphone permission denied or not supported.");
    }
  }, []);

  const stop = useCallback(
    (): Promise<{ url: string; blob: Blob; duration: number } | null> =>
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
          reader.onload = () =>
            resolve({
              url: reader.result as string,
              blob,
              duration: dur,
            });
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
   ICON BUTTON helper
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
      className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-all active:scale-95 ${className}`}
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
  const [previewImage, setPreviewImage] = useState<{ url: string; name?: string } | null>(null);

  const dragCounter = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const recorder = useRecorder();

  /* -- animate in -- */
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  /* -- Load local messages instantly for 0ms initial render -- */
  const refreshLocal = useCallback(() => {
    const all = loadMessages();
    const caseMsgs = all.filter((m) => m.caseId === caseItem.id);
    setMessages((prev) => {
      if (
        prev.length === caseMsgs.length &&
        prev.every((m, i) => m.id === caseMsgs[i]?.id && m.read === caseMsgs[i]?.read)
      ) {
        return prev;
      }
      return dedupeMessages(caseMsgs);
    });
  }, [caseItem.id]);

  /* -- Remote Message Synchronization & Real-time Polling -- */
  useEffect(() => {
    refreshLocal();
    window.addEventListener("cuc_chat_updated", refreshLocal);

    const syncRemote = async () => {
      try {
        const remoteMessages = await chatService.getMessages(caseItem.id);
        if (remoteMessages && Array.isArray(remoteMessages)) {
          const current = loadMessages();
          const otherCaseMsgs = current.filter((m) => m.caseId !== caseItem.id);
          const currentCaseMsgs = current.filter((m) => m.caseId === caseItem.id);

          const formattedRemote: ChatMessage[] = remoteMessages.map((rm) => ({
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
          }));

          // Merge current local messages with remote messages and deduplicate
          const merged = dedupeMessages([...currentCaseMsgs, ...formattedRemote]);
          merged.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

          saveMessages([...otherCaseMsgs, ...merged], false);
          setMessages(merged);
        }
      } catch (err) {
        console.warn("[CaseChat] Remote chat messages sync error:", err);
      }
    };

    syncRemote();
    const intervalId = setInterval(syncRemote, 2500);

    // Auto mark remote incoming messages read
    chatService
      .markRead(caseItem.id, role)
      .catch((err) => console.warn("[CaseChat] Remote chat mark read error:", err));

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("cuc_chat_updated", refreshLocal);
    };
  }, [refreshLocal, caseItem.id, role]);

  /* -- Auto scroll to bottom -- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, uploading]);

  /* -- Focus input -- */
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  /* -- Escape & close handler -- */
  const close = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 280);
  }, [onClose]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !previewImage) close();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [close, previewImage]);

  /* -- Prevent body scroll while chat is open -- */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const myName =
    role === "citizen" ? caseItem.citizenName || "Citizen" : caseItem.lawyerName || "Advocate";
  const otherParty =
    role === "citizen"
      ? caseItem.lawyerName || "Assigned Advocate"
      : caseItem.citizenName || "Client";
  const canVideoCall =
    role === "citizen" ? Boolean(caseItem.lawyerName) : Boolean(caseItem.citizenName);

  /* -- send text message -- */
  const sendText = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const msg: ChatMessage = {
      id: tempId,
      caseId: caseItem.id,
      text,
      sender: role,
      senderName: myName,
      at: new Date().toISOString(),
      read: false,
    };

    setInput("");

    // 1. Optimistic append to state
    setMessages((prev) => dedupeMessages([...prev, msg]));

    // 2. Save to local storage without firing redundant self-event
    const current = loadMessages().filter((m) => m.id !== tempId);
    saveMessages([...current, msg], false);

    // 3. Dispatch to Supabase backend API
    try {
      const res = await chatService.sendMessage(caseItem.id, {
        text,
        message: text,
        sender: role,
        senderName: myName,
      });

      if (res && res.id) {
        setMessages((prev) =>
          dedupeMessages(
            prev.map((m) => (m.id === tempId ? { ...m, id: res.id, at: res.at || m.at } : m)),
          ),
        );
        const all = loadMessages().map((m) =>
          m.id === tempId ? { ...m, id: res.id, at: res.at || m.at } : m,
        );
        saveMessages(all, true);
      }
    } catch (err) {
      console.warn("[CaseChat] Remote chat send message error:", err);
    }
  }, [input, role, caseItem.id, myName]);

  /* -- send attachment message -- */
  const sendAttach = useCallback(
    async (
      attachmentType: "image" | "file" | "audio",
      attachmentUrl: string,
      attachmentName: string,
      attachmentSize: string,
      audioDuration?: number,
    ) => {
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const msg: ChatMessage = {
        id: tempId,
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

      setMessages((prev) => dedupeMessages([...prev, msg]));
      const current = loadMessages().filter((m) => m.id !== tempId);
      saveMessages([...current, msg], false);

      // Dispatch to Supabase backend API
      try {
        const res = await chatService.sendMessage(caseItem.id, {
          attachmentType,
          attachmentUrl,
          attachmentName,
          attachmentSize,
          audioDuration,
          sender: role,
          senderName: myName,
        });

        if (res && res.id) {
          setMessages((prev) =>
            dedupeMessages(
              prev.map((m) => (m.id === tempId ? { ...m, id: res.id, at: res.at || m.at } : m)),
            ),
          );
          const all = loadMessages().map((m) =>
            m.id === tempId ? { ...m, id: res.id, at: res.at || m.at } : m,
          );
          saveMessages(all, true);
        }
      } catch (err) {
        console.warn("[CaseChat] Remote chat attachment send error:", err);
      }
    },
    [role, caseItem.id, myName],
  );

  /* -- process file sharing -- */
  const handleFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).slice(0, 10);
      files.forEach(async (file) => {
        // Enforce 25MB max size limit
        if (file.size > 25 * 1024 * 1024) {
          alert(`"${file.name}" exceeds the 25MB limit.`);
          return;
        }

        setUploading((p) => [...p, file.name]);
        const type: "image" | "file" = file.type.startsWith("image/") ? "image" : "file";
        let url = "";

        try {
          const res = await storageService.uploadFile(file, {
            bucket: "case-documents",
            folder: `cases/${caseItem.id}/chat`,
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

        await sendAttach(type, url, file.name, fmtBytes(file.size));
        setUploading((p) => p.filter((n) => n !== file.name));
      });
    },
    [sendAttach, caseItem.id],
  );

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) handleFiles(e.target.files);
    e.target.value = "";
  };

  /* -- Drag & drop handlers -- */
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

  /* -- Audio voice recording -- */
  const onMic = async () => {
    if (recorder.recording) {
      const r = await recorder.stop();
      if (r) {
        setUploading((p) => [...p, "Voice Note.webm"]);
        try {
          const audioFile = new File([r.blob], `voice_${Date.now()}.webm`, {
            type: "audio/webm",
          });
          let cloudUrl = "";
          try {
            const res = await storageService.uploadFile(audioFile, {
              bucket: "case-documents",
              folder: `cases/${caseItem.id}/chat`,
            });
            if (res?.fileUrl) cloudUrl = res.fileUrl;
          } catch {
            // fallback
          }

          sendAttach(
            "audio",
            cloudUrl || r.url,
            "Voice message",
            fmtBytes(r.blob.size),
            r.duration,
          );
        } catch {
          sendAttach("audio", r.url, "Voice message", "", r.duration);
        } finally {
          setUploading((p) => p.filter((n) => n !== "Voice Note.webm"));
        }
      }
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

  /* -- group messages by date -- */
  type G = { label: string; msgs: ChatMessage[] };
  const groups: G[] = [];
  messages.forEach((m) => {
    const label = fmtDate(m.at);
    const last = groups[groups.length - 1];
    if (!last || last.label !== label) groups.push({ label, msgs: [m] });
    else last.msgs.push(m);
  });

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

      {/* Image Lightbox Viewer Modal */}
      {previewImage && (
        <ImageLightbox
          url={previewImage.url}
          name={previewImage.name}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Main chat window container */}
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
          className="relative z-10 flex shrink-0 items-center gap-3 bg-gradient-to-r from-primary to-primary/95 px-3 sm:px-5 shadow-sm"
          style={{ minHeight: "64px", paddingTop: "env(safe-area-inset-top)" }}
        >
          {/* Back button */}
          <IconBtn
            onClick={close}
            title="Back"
            className="text-primary-foreground hover:bg-primary-foreground/15"
          >
            <ArrowLeft className="h-5 w-5" />
          </IconBtn>

          {/* Contact Avatar */}
          <UserAvatar name={otherParty} size="md" className="ring-2 ring-primary-foreground/30" />

          {/* Name & Case Subtitle */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-bold leading-tight text-primary-foreground sm:text-base">
              {otherParty}
            </div>
            <div className="truncate text-[11px] text-primary-foreground/80">
              {caseItem.id} · {caseItem.category || "Case Consultation"} · {caseItem.status}
            </div>
          </div>

          {/* Video Call button */}
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

        {/* ══ CASE BRIEF DOCKET BAR ═══════════════════════════════════════ */}
        <div className="shrink-0 border-b border-border bg-surface px-4 py-2.5 sm:px-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <div className="min-w-0 flex items-center gap-2">
              <span className="font-mono text-[13px] font-bold text-primary">{caseItem.id}</span>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {caseItem.status}
              </span>
              <span className="truncate text-[13px] font-medium text-foreground max-w-[280px] sm:max-w-md hidden sm:inline">
                {caseItem.title}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {caseItem.category && (
                <span className="font-medium text-foreground/80">{caseItem.category}</span>
              )}
              {caseItem.city && <span>· {caseItem.city}</span>}
            </div>
          </div>
        </div>

        {/* ══ MESSAGES SCROLL AREA ════════════════════════════════════════ */}
        <div
          className="relative flex-1 min-h-0 overflow-y-auto overscroll-contain bg-muted/40 py-3"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {/* Drag & drop overlay */}
          {dragging && (
            <div className="pointer-events-none absolute inset-3 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
              <UploadCloud className="h-10 w-10 text-primary animate-bounce" />
              <p className="text-sm font-semibold text-primary">Drop files or photos to send</p>
            </div>
          )}

          {/* Clean empty state (no fake mock data!) */}
          {groups.length === 0 && uploading.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <div className="max-w-sm">
                <p className="text-[16px] font-bold text-foreground">No messages yet</p>
                <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                  Start the consultation about case{" "}
                  <span className="font-semibold text-primary">{caseItem.id}</span>. You can send
                  text messages, evidence photos, and legal documents.
                </p>
              </div>
            </div>
          )}

          {/* Grouped message bubbles */}
          {groups.map((g) => (
            <div key={g.label}>
              <DateSep label={g.label} />
              {g.msgs.map((m) => (
                <Bubble
                  key={m.id}
                  msg={m}
                  role={role}
                  onImageClick={(url, name) => setPreviewImage({ url, name })}
                />
              ))}
            </div>
          ))}

          {/* Uploading progress indicators */}
          {uploading.map((name, i) => (
            <UploadingRow key={`${name}-${i}`} name={name} />
          ))}

          {/* Auto scroll anchor */}
          <div ref={bottomRef} />
        </div>

        {/* ══ VOICE RECORDING BANNER ══════════════════════════════════════ */}
        {recorder.recording && (
          <div className="flex shrink-0 items-center justify-between border-t border-red-200 bg-red-50/90 px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500" />
              </span>
              <span className="text-[14px] font-semibold text-red-600">
                Recording audio note — {fmtDur(recorder.seconds)}
              </span>
            </div>
            <button
              onClick={recorder.cancel}
              className="cursor-pointer rounded-full px-4 py-1.5 text-[12px] font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ══ ATTACHMENT MENU POPOVER ═════════════════════════════════════ */}
        {attachOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setAttachOpen(false)} />
            <div
              className="absolute bottom-[72px] left-3 z-30 flex flex-col gap-1 rounded-2xl border border-border bg-surface p-1.5 shadow-xl sm:left-4"
              style={{ animation: "attachMenuIn 0.16s ease-out" }}
            >
              <button
                onClick={() => {
                  imageInputRef.current?.click();
                  setAttachOpen(false);
                }}
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted cursor-pointer"
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
                className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-foreground transition-colors hover:bg-muted cursor-pointer"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12">
                  <FileText className="h-4.5 w-4.5 text-primary" />
                </span>
                Documents &amp; Files
              </button>
            </div>
          </>
        )}

        {/* ══ INPUT COMPOSER BAR ══════════════════════════════════════════ */}
        <div className="shrink-0 flex items-center gap-1.5 border-t border-border bg-surface px-2.5 py-2.5 sm:gap-2 sm:px-4 sm:py-3 pb-[calc(0.625rem+env(safe-area-inset-bottom))] z-20 shadow-xs">
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

          {/* Paperclip attach button */}
          <IconBtn
            onClick={() => setAttachOpen((v) => !v)}
            title="Attach documents, photos or files"
            className={
              attachOpen ? "bg-primary/12 text-primary" : "text-muted-foreground hover:bg-muted"
            }
          >
            <Paperclip className="h-[22px] w-[22px]" />
          </IconBtn>

          {/* Text input / recording indicator */}
          {!recorder.recording ? (
            <input
              ref={inputRef}
              id={`chat-input-${caseItem.id}`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Type your message…"
              className="flex-1 min-w-0 rounded-full border border-border bg-background px-5 text-[14px] text-foreground outline-none transition-shadow focus:border-primary focus:ring-2 focus:ring-primary/20"
              style={{ height: "46px" }}
            />
          ) : (
            <div
              className="flex flex-1 min-w-0 items-center rounded-full border border-red-200 bg-red-50/50 px-5 text-[14px] italic text-red-600"
              style={{ height: "46px" }}
            >
              Recording audio message…
            </div>
          )}

          {/* Send / Mic Button */}
          {input.trim() && !recorder.recording ? (
            <IconBtn
              onClick={sendText}
              size={46}
              title="Send message"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
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
                  ? "bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-md"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs"
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
      className="relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] transition-colors hover:brightness-95 shadow-xs"
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
