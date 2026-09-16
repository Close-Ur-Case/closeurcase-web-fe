import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import type { ActiveVideoCall } from "@/features/video-call/VideoCallContext";
import { addVideoCall } from "@/data/appStore";
import { UserAvatar } from "@/components/app/UserAvatar";

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function VideoCallOverlay({ call, onEnd }: { call: ActiveVideoCall; onEnd: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const connectedAtRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  const [phase, setPhase] = useState<"connecting" | "connected">("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function startMedia() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) {
          setErrorMessage("Camera and microphone are not available in this browser.");
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        if (!cancelled) {
          setErrorMessage(
            "Camera or microphone access was blocked. You can still continue the call.",
          );
        }
      }
    }

    void startMedia();

    const connectTimer = window.setTimeout(() => {
      if (cancelled || endedRef.current) return;
      connectedAtRef.current = Date.now();
      setPhase("connected");
    }, 1400);

    return () => {
      cancelled = true;
      window.clearTimeout(connectTimer);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (phase !== "connected") return;
    const id = window.setInterval(() => {
      if (!connectedAtRef.current) return;
      setElapsed(Math.floor((Date.now() - connectedAtRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const hangUp = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    const connectedAt = connectedAtRef.current;
    const durationSeconds = connectedAt
      ? Math.max(1, Math.floor((Date.now() - connectedAt) / 1000))
      : undefined;
    addVideoCall({
      caseId: call.caseId,
      withName: call.withName,
      role: call.role,
      status: connectedAt ? "completed" : "cancelled",
      durationSeconds,
    });
    onEnd();
  }, [call.caseId, call.role, call.withName, onEnd]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      hangUp();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [hangUp]);

  const toggleMic = () => {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = next;
    });
    setMicOn(next);
  };

  const toggleCam = () => {
    const next = !camOn;
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = next;
    });
    setCamOn(next);
  };

  const statusLabel = phase === "connecting" ? "Calling…" : formatElapsed(elapsed);

  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col bg-slate-950 text-white"
      role="dialog"
      aria-label={`Video call with ${call.withName}`}
    >
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <UserAvatar name={call.withName} size="lg" className="h-28 w-28 ring-4 ring-white/15" />
        <div className="mt-4 text-xl font-semibold">{call.withName}</div>
        <div className="mt-1 text-sm text-white/70">
          {call.caseId} · {statusLabel}
        </div>
        {errorMessage && (
          <p className="mt-3 max-w-sm text-center text-xs text-amber-200">{errorMessage}</p>
        )}

        <div className="absolute bottom-6 right-6 overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-xl">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`h-36 w-28 object-cover sm:h-44 sm:w-32 ${camOn ? "" : "invisible"}`}
          />
          {!camOn && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-800">
              <VideoOff className="h-5 w-5 text-white/60" />
              <span className="text-[10px] text-white/50">Camera off</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          title={micOn ? "Mute microphone" : "Unmute microphone"}
          onClick={toggleMic}
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-colors ${
            micOn ? "bg-white/15 hover:bg-white/25" : "bg-red-500 hover:bg-red-400"
          }`}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          type="button"
          title={camOn ? "Turn camera off" : "Turn camera on"}
          onClick={toggleCam}
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-colors ${
            camOn ? "bg-white/15 hover:bg-white/25" : "bg-red-500 hover:bg-red-400"
          }`}
        >
          {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>
        <button
          type="button"
          title="End call"
          onClick={hangUp}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-red-600 hover:bg-red-500"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
