import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Video } from "lucide-react";
import type { UserRole, VideoCall } from "@/types";
import { getRecentVideoCalls, addVideoCall, subscribeToStore } from "@/data/appStore";
import { UserAvatar } from "@/components/app/UserAvatar";
import { IconButton } from "@/components/m3";
import { useVideoCall } from "@/features/video-call/VideoCallContext";
import { videoCallService } from "@/services/videoCallService";

function formatCallWhen(iso: string) {
  const then = new Date(iso).getTime();
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString([], { day: "numeric", month: "short" });
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m} min`;
  return `${m} min ${s}s`;
}

function callSubtitle(call: VideoCall) {
  if (call.status === "missed") return "Missed call";
  if (call.status === "cancelled") return "Cancelled";
  if (call.durationSeconds) return formatDuration(call.durationSeconds);
  return "Completed";
}

export function VideoCallsMenu({ role }: { role: UserRole }) {
  const { startCall } = useVideoCall();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [calls, setCalls] = useState(() => getRecentVideoCalls(role));
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({});

  useEffect(() => {
    const sync = () => setCalls(getRecentVideoCalls(role));
    sync();
    const unsub = subscribeToStore(sync);

    videoCallService
      .getCallHistory()
      .then((history) => {
        if (history && Array.isArray(history) && history.length > 0) {
          const current = getRecentVideoCalls(role);
          history.forEach((h) => {
            if (!current.some((c) => c.id === h.id)) {
              addVideoCall({
                id: h.id,
                caseId: h.caseId,
                withName: h.withName,
                role: (h.role as "citizen" | "lawyer") || role,
                status: (h.status as VideoCall["status"]) || "completed",
                durationSeconds: h.durationSeconds,
                at: h.at,
              });
            }
          });
        }
      })
      .catch((err) => console.warn("Failed to sync video call history:", err));

    return unsub;
  }, [role]);

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = 352;
      const gutter = 8;
      const left = Math.min(
        Math.max(gutter, rect.right - width),
        window.innerWidth - width - gutter,
      );
      setPanelStyle({
        top: rect.bottom + 6,
        left,
        width,
        maxHeight: `min(22rem, calc(100vh - ${rect.bottom + 16}px))`,
      });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  if (role !== "citizen" && role !== "lawyer") return null;

  const placeCall = (call: VideoCall) => {
    setOpen(false);
    startCall({ caseId: call.caseId, withName: call.withName, role });
  };

  return (
    <div className="relative" ref={triggerRef}>
      <IconButton ariaLabel="Video calls" title="Video calls" onClick={() => setOpen((v) => !v)}>
        <Video className="h-5 w-5" />
      </IconButton>

      {open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
            <div
              className="fixed z-[70] flex flex-col overflow-hidden rounded-[var(--md-sys-shape-corner-medium)] border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] shadow-[var(--md-sys-elevation-level3)]"
              style={panelStyle}
            >
              <div className="shrink-0 border-b border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-lowest)] px-4 py-3">
                <div className="text-sm font-semibold text-foreground">Recent video calls</div>
                <div className="text-xs text-muted-foreground">
                  Tap the video icon to call again
                </div>
              </div>
              {calls.length === 0 ? (
                <div className="bg-[var(--md-sys-color-surface-container-lowest)] px-4 py-8 text-center text-sm text-muted-foreground">
                  No recent video calls
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto bg-[var(--md-sys-color-surface-container-lowest)] p-1.5">
                  {calls.map((call) => (
                    <div
                      key={call.id}
                      className="flex items-center gap-2 rounded-[var(--md-sys-shape-corner-small)] px-2 py-2"
                    >
                      <UserAvatar name={call.withName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {call.withName}
                        </div>
                        <div
                          className={`truncate text-xs ${
                            call.status === "missed"
                              ? "text-[var(--md-sys-color-error)]"
                              : "text-muted-foreground"
                          }`}
                        >
                          {callSubtitle(call)} · {call.caseId} · {formatCallWhen(call.at)}
                        </div>
                      </div>
                      <IconButton
                        ariaLabel={`Video call ${call.withName}`}
                        title={`Video call ${call.withName}`}
                        onClick={() => placeCall(call)}
                      >
                        <Video className="h-5 w-5" />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
