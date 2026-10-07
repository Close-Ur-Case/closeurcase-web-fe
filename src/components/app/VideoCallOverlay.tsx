import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  ScreenShare,
  ScreenShareOff,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Wifi,
} from "lucide-react";
import type { ActiveVideoCall } from "@/features/video-call/VideoCallContext";
import { addVideoCall } from "@/data/appStore";
import { UserAvatar } from "@/components/app/UserAvatar";
import { videoCallService } from "@/services/videoCallService";
import { useAgoraRtc } from "@/features/video-call/useAgoraRtc";

const CONSULTATION_LIMIT_SECONDS = 30 * 60; // 30 minutes consultation window
const WARNING_LIMIT_SECONDS = 25 * 60; // Warning banner at 25 minutes (5 min left)

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function VideoCallOverlay({
  call,
  onEnd,
}: {
  call: ActiveVideoCall;
  onEnd: () => void;
}) {
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const connectedAtRef = useRef<number | null>(null);
  const endedRef = useRef(false);

  const [elapsed, setElapsed] = useState(0);
  const [tokenLoading, setTokenLoading] = useState(true);

  const {
    isJoined,
    isConnecting,
    remoteUser,
    hasRemoteVideo,
    micOn,
    camOn,
    isScreenSharing,
    networkQuality,
    errorMessage,
    join,
    leave,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    playLocalVideo,
    playRemoteVideo,
  } = useAgoraRtc();

  // 1. Fetch Agora Token and join RTC channel on mount
  useEffect(() => {
    let cancelled = false;

    async function initializeCall() {
      try {
        setTokenLoading(true);
        const channelName = `case_${call.caseId}`;
        const tokenRes = await videoCallService.generateToken({
          channelName,
          role: "publisher",
        });

        if (cancelled) return;

        await join({
          appId: tokenRes.appId,
          channelName: tokenRes.channelName,
          token: tokenRes.token,
          uid: tokenRes.uid,
        });

        connectedAtRef.current = Date.now();
      } catch (err) {
        console.warn("[VideoCallOverlay] Token or join error:", err);
      } finally {
        if (!cancelled) setTokenLoading(false);
      }
    }

    void initializeCall();

    return () => {
      cancelled = true;
    };
  }, [call.caseId, join]);

  // 2. Attach local video to PIP container when camera is active
  useEffect(() => {
    if (camOn && localVideoRef.current && isJoined) {
      playLocalVideo(localVideoRef.current);
    }
  }, [camOn, isJoined, playLocalVideo]);

  // 3. Attach remote video to main container when remote party publishes video
  useEffect(() => {
    if (hasRemoteVideo && remoteVideoRef.current) {
      playRemoteVideo(remoteVideoRef.current);
    }
  }, [hasRemoteVideo, playRemoteVideo]);

  // 4. Consultation timer (30 mins cap with 25 mins warning)
  useEffect(() => {
    if (!isJoined) return;

    const timer = window.setInterval(() => {
      if (!connectedAtRef.current) return;
      const curElapsed = Math.floor((Date.now() - connectedAtRef.current) / 1000);
      setElapsed(curElapsed);

      // Auto-terminate call gracefully when reaching 30 minutes cap
      if (curElapsed >= CONSULTATION_LIMIT_SECONDS) {
        hangUp();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isJoined]);

  // 5. Hang up and log call
  const hangUp = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;

    const connectedAt = connectedAtRef.current;
    const durationSeconds = connectedAt
      ? Math.max(1, Math.floor((Date.now() - connectedAt) / 1000))
      : 0;

    void leave();

    // Persist to local app store
    addVideoCall({
      caseId: call.caseId,
      withName: call.withName,
      role: call.role,
      status: durationSeconds > 5 ? "completed" : "cancelled",
      durationSeconds,
    });

    // Remote log to Supabase backend API
    videoCallService
      .logCall({
        caseId: call.caseId,
        withName: call.withName,
        role: call.role,
        status: durationSeconds > 5 ? "completed" : "cancelled",
        durationSeconds,
        channelName: `case_${call.caseId}`,
        endedAt: new Date().toISOString(),
      })
      .catch((err) => console.warn("[VideoCallOverlay] Remote call log error:", err));

    onEnd();
  }, [call.caseId, call.role, call.withName, leave, onEnd]);

  // 6. Escape key listener to quickly exit
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        hangUp();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [hangUp]);

  const otherRoleLabel = call.role === "citizen" ? "Advocate" : "Client";
  const isWarningTime = elapsed >= WARNING_LIMIT_SECONDS;
  const remainingSeconds = Math.max(0, CONSULTATION_LIMIT_SECONDS - elapsed);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-white select-none"
      role="dialog"
      aria-label={`1-on-1 Legal Video Consultation with ${call.withName}`}
    >
      {/* Top Header Bar */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 py-3 sm:px-6 bg-gradient-to-b from-slate-950/80 to-transparent backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary border border-primary/30">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold leading-tight">{call.withName}</h2>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                {otherRoleLabel}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Case #{call.caseId}</span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <Wifi className="h-3 w-3" />
                {networkQuality <= 2 ? "HD Encrypted" : "Live (Encrypted)"}
              </span>
            </div>
          </div>
        </div>

        {/* Consultation Timer Dock */}
        <div className="flex items-center gap-2">
          {isWarningTime && (
            <div className="hidden sm:flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/40 animate-pulse">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>5m Remaining</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1.5 text-xs font-mono font-medium text-slate-200 border border-slate-700/60 shadow-inner">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>{formatTime(elapsed)}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">30:00</span>
          </div>
        </div>
      </header>

      {/* Main Viewport Stage (Remote Stream or Waiting Room) */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-slate-950">
        {/* Remote Video Container */}
        <div
          ref={remoteVideoRef}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
            hasRemoteVideo ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Remote Camera Off or Waiting State */}
        {!hasRemoteVideo && (
          <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center animate-fade-in">
            {remoteUser ? (
              // Connected, but remote camera is muted
              <div className="flex flex-col items-center">
                <UserAvatar
                  name={call.withName}
                  size="lg"
                  className="h-28 w-28 ring-4 ring-slate-800 shadow-2xl"
                />
                <h3 className="mt-4 text-lg font-semibold">{call.withName}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {otherRoleLabel}&apos;s camera is off • Audio connected
                </p>
              </div>
            ) : (
              // Waiting Room: Remote party has not entered yet
              <div className="flex flex-col items-center max-w-sm">
                <div className="relative">
                  <div className="absolute -inset-2 rounded-full bg-primary/20 blur-md animate-pulse" />
                  <UserAvatar
                    name={call.withName}
                    size="lg"
                    className="relative h-28 w-28 ring-4 ring-white/10 shadow-2xl"
                  />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{call.withName}</h3>
                <p className="mt-1 text-sm text-slate-300 font-medium">
                  {tokenLoading || isConnecting
                    ? "Connecting to secure consultation channel…"
                    : `Waiting for ${otherRoleLabel} to join the consultation…`}
                </p>
                <div className="mt-4 flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400 border border-slate-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Room ID: case_{call.caseId}</span>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mt-6 flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/30 px-3.5 py-2 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}

        {/* PIP Floating Window (Local Participant Preview) */}
        <div className="absolute bottom-24 right-4 sm:bottom-28 sm:right-6 z-20 h-40 w-28 sm:h-48 sm:w-36 overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-2xl transition-all">
          <div
            ref={localVideoRef}
            className={`h-full w-full object-cover ${camOn ? "block" : "hidden"}`}
          />
          {!camOn && (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-slate-800 p-2 text-center">
              <VideoOff className="h-5 w-5 text-slate-400" />
              <span className="text-[11px] font-medium text-slate-400">Camera Off</span>
            </div>
          )}
          <div className="absolute bottom-1.5 left-2 rounded bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-semibold text-slate-300 backdrop-blur-xs">
            You ({call.role === "citizen" ? "Client" : "Advocate"})
          </div>
        </div>
      </main>

      {/* Warning Toast when reaching last 5 minutes */}
      {isWarningTime && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full bg-amber-600/90 px-4 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Consultation will conclude in {Math.ceil(remainingSeconds / 60)} minutes</span>
        </div>
      )}

      {/* Floating Control Action Dock */}
      <footer className="relative z-30 flex shrink-0 items-center justify-center gap-3 sm:gap-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-slate-950 to-transparent">
        {/* Toggle Microphone */}
        <button
          type="button"
          title={micOn ? "Mute microphone" : "Unmute microphone"}
          onClick={() => void toggleMic()}
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all active:scale-95 shadow-md ${
            micOn
              ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
              : "bg-red-500 text-white hover:bg-red-400 shadow-red-500/20"
          }`}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>

        {/* Toggle Camera */}
        <button
          type="button"
          title={camOn ? "Turn camera off" : "Turn camera on"}
          onClick={() => void toggleCam()}
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all active:scale-95 shadow-md ${
            camOn
              ? "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
              : "bg-red-500 text-white hover:bg-red-400 shadow-red-500/20"
          }`}
        >
          {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>

        {/* Toggle Document / Screen Share */}
        <button
          type="button"
          title={isScreenSharing ? "Stop sharing screen" : "Share case document / screen"}
          onClick={() => void toggleScreenShare()}
          className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-full transition-all active:scale-95 shadow-md ${
            isScreenSharing
              ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20"
              : "bg-slate-800 text-white hover:bg-slate-700 border border-slate-700"
          }`}
        >
          {isScreenSharing ? (
            <ScreenShareOff className="h-5 w-5" />
          ) : (
            <ScreenShare className="h-5 w-5" />
          )}
        </button>

        {/* End Consultation Call */}
        <button
          type="button"
          title="End Consultation"
          onClick={hangUp}
          className="flex h-13 w-13 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500 transition-all active:scale-95 shadow-lg shadow-red-600/30"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
      </footer>
    </div>
  );
}
