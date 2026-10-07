import { useEffect } from "react";
import { Phone, PhoneOff, Video, ShieldCheck } from "lucide-react";
import { UserAvatar } from "@/components/app/UserAvatar";
import type { IncomingCallInfo } from "@/types/api";

interface IncomingCallDialogProps {
  call: IncomingCallInfo;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCallDialog({ call, onAccept, onDecline }: IncomingCallDialogProps) {
  const callerRoleLabel = call.role === "lawyer" ? "Advocate" : "Client";

  // Handle keyboard shortcuts (Enter to accept, Escape to decline)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onAccept();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onDecline();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onAccept, onDecline]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      role="alertdialog"
      aria-labelledby="incoming-call-title"
      aria-describedby="incoming-call-desc"
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 text-center text-white shadow-2xl shadow-emerald-500/10">
        {/* Subtle Ambient Light Ring */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-36 w-36 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        {/* Legal Badge */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-medium text-slate-300 border border-slate-700/60 shadow-inner">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Case #{call.caseId} Consultation</span>
        </div>

        {/* Pulsing Avatar */}
        <div className="relative my-6 flex justify-center">
          <div className="relative">
            {/* Multiple pulsating radar rings */}
            <span className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-ping opacity-60" />
            <span className="absolute -inset-6 rounded-full bg-emerald-500/10 animate-pulse" />
            <UserAvatar
              name={call.callerName || call.withName}
              size="lg"
              className="relative h-24 w-24 ring-4 ring-emerald-500/40 shadow-2xl"
            />
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md">
              <Video className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Caller Info */}
        <h3 id="incoming-call-title" className="text-xl font-bold tracking-tight text-white">
          {call.callerName || call.withName}
        </h3>
        <p id="incoming-call-desc" className="mt-1 text-xs font-medium text-emerald-400 animate-pulse">
          Incoming video consultation from {callerRoleLabel}…
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-center gap-6">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={onDecline}
              title="Decline Call"
              className="flex h-15 w-15 cursor-pointer items-center justify-center rounded-full bg-red-600/90 text-white hover:bg-red-500 transition-all active:scale-95 shadow-lg shadow-red-600/30 border border-red-500/40 hover:rotate-6"
            >
              <PhoneOff className="h-6 w-6" />
            </button>
            <span className="text-[11px] font-medium text-slate-400">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={onAccept}
              title="Accept Video Call"
              className="flex h-15 w-15 cursor-pointer items-center justify-center rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/40 border border-emerald-400/60 hover:-rotate-6 animate-bounce"
            >
              <Phone className="h-6 w-6" />
            </button>
            <span className="text-[11px] font-semibold text-emerald-400">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
