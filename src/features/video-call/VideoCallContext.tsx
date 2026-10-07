import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { VideoCallOverlay } from "@/components/app/VideoCallOverlay";
import { IncomingCallDialog } from "@/components/app/IncomingCallDialog";
import { videoCallService } from "@/services/videoCallService";
import { ringtone } from "./ringtone";
import { useAuth } from "@/context/useAuth";
import type { IncomingCallInfo } from "@/types/api";

export interface ActiveVideoCall {
  caseId: string;
  withName: string;
  role: "citizen" | "lawyer";
  callId?: string;
  isInitiator?: boolean;
}

export type CallInvitationStatus =
  | "idle"
  | "ringing"
  | "accepted"
  | "declined"
  | "cancelled"
  | "missed"
  | "completed";

interface VideoCallContextValue {
  active: ActiveVideoCall | null;
  callStatus: CallInvitationStatus;
  isInitiator: boolean;
  startCall: (call: ActiveVideoCall) => void;
  endCall: () => void;
  cancelOutgoingCall: () => void;
}

const VideoCallContext = createContext<VideoCallContextValue | null>(null);

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const { user, role: currentRole } = useAuth();

  const [active, setActive] = useState<ActiveVideoCall | null>(null);
  const [callStatus, setCallStatus] = useState<CallInvitationStatus>("idle");
  const [isInitiator, setIsInitiator] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);

  const activeCallIdRef = useRef<string | null>(null);
  const statusPollRef = useRef<number | null>(null);
  const ringTimeoutRef = useRef<number | null>(null);

  // 1. Poll for incoming calls every 2.5s (only when not in an active call)
  useEffect(() => {
    if (active || incomingCall) return;

    const checkIncoming = async () => {
      try {
        const incoming = await videoCallService.getIncomingCall({
          userId: user?.id,
        });

        if (incoming && incoming.status === "ringing") {
          // Avoid ringing if we initiated this call
          if (activeCallIdRef.current === incoming.id) return;

          setIncomingCall(incoming);
          ringtone.startIncomingRing();
        }
      } catch {
        // Ignore polling errors
      }
    };

    const interval = window.setInterval(() => {
      void checkIncoming();
    }, 2500);

    return () => window.clearInterval(interval);
  }, [active, incomingCall, user?.id]);

  // 2. Clear status polling and timeouts
  const clearTimers = useCallback(() => {
    ringtone.stopRing();
    if (statusPollRef.current !== null) {
      window.clearInterval(statusPollRef.current);
      statusPollRef.current = null;
    }
    if (ringTimeoutRef.current !== null) {
      window.clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  }, []);

  // 3. Start an outgoing call (User A calling User B)
  const startCall = useCallback(
    async (call: ActiveVideoCall) => {
      clearTimers();
      setIsInitiator(true);
      setCallStatus("ringing");
      setActive({ ...call, isInitiator: true });
      ringtone.startOutgoingRing();

      try {
        // Initiate call invitation on backend
        const record = await videoCallService.initiateCall({
          caseId: call.caseId,
          withName: call.withName,
          role: call.role,
          callerId: user?.id,
          callerName: (user as any)?.fullName || (user as any)?.name || "Participant",
        });

        activeCallIdRef.current = record.id;
        setActive((prev) => (prev ? { ...prev, callId: record.id } : null));

        // Set 40-second timeout for unanswered call
        ringTimeoutRef.current = window.setTimeout(async () => {
          clearTimers();
          setCallStatus("missed");
          if (activeCallIdRef.current) {
            await videoCallService.respondCall({
              callId: activeCallIdRef.current,
              action: "missed",
            });
          }
          window.setTimeout(() => {
            setActive(null);
            setCallStatus("idle");
          }, 2000);
        }, 40000);

        // Poll callee response status every 1.5s
        statusPollRef.current = window.setInterval(async () => {
          if (!activeCallIdRef.current) return;
          try {
            const statusData = await videoCallService.getCallStatus(activeCallIdRef.current);
            if (!statusData) return;

            if (statusData.status === "accepted") {
              clearTimers();
              setCallStatus("accepted");
            } else if (statusData.status === "declined") {
              clearTimers();
              setCallStatus("declined");
              window.setTimeout(() => {
                setActive(null);
                setCallStatus("idle");
              }, 2500);
            } else if (statusData.status === "cancelled" || statusData.status === "missed") {
              clearTimers();
              setCallStatus(statusData.status as CallInvitationStatus);
              window.setTimeout(() => {
                setActive(null);
                setCallStatus("idle");
              }, 1500);
            }
          } catch {
            // Ignore status poll errors
          }
        }, 1500);
      } catch (err) {
        console.warn("[VideoCallContext] Failed to initiate call invitation:", err);
        // Fallback directly to accepted so user can still proceed if offline
        clearTimers();
        setCallStatus("accepted");
      }
    },
    [clearTimers, user]
  );

  // 4. Cancel outgoing call before callee answers
  const cancelOutgoingCall = useCallback(async () => {
    const callId = activeCallIdRef.current;
    clearTimers();
    setCallStatus("cancelled");

    if (callId) {
      await videoCallService.respondCall({
        callId,
        action: "cancelled",
      }).catch(() => {});
    }

    setActive(null);
    setCallStatus("idle");
    activeCallIdRef.current = null;
  }, [clearTimers]);

  // 5. Accept incoming call (User B answers)
  const handleAcceptIncoming = useCallback(async () => {
    if (!incomingCall) return;
    ringtone.stopRing();
    const currentIncoming = incomingCall;
    setIncomingCall(null);

    // Notify backend call was accepted
    await videoCallService.respondCall({
      callId: currentIncoming.id,
      action: "accepted",
    }).catch(() => {});

    activeCallIdRef.current = currentIncoming.id;
    setIsInitiator(false);
    setCallStatus("accepted");

    // Open video overlay for callee
    setActive({
      caseId: currentIncoming.caseId,
      withName: currentIncoming.callerName || currentIncoming.withName,
      role: (currentRole as "citizen" | "lawyer") || "citizen",
      callId: currentIncoming.id,
      isInitiator: false,
    });
  }, [incomingCall, currentRole]);

  // 6. Decline incoming call (User B rejects)
  const handleDeclineIncoming = useCallback(async () => {
    if (!incomingCall) return;
    ringtone.stopRing();
    const currentIncoming = incomingCall;
    setIncomingCall(null);

    await videoCallService.respondCall({
      callId: currentIncoming.id,
      action: "declined",
    }).catch(() => {});
  }, [incomingCall]);

  // 7. End active call
  const endCall = useCallback(() => {
    clearTimers();
    if (activeCallIdRef.current) {
      void videoCallService.respondCall({
        callId: activeCallIdRef.current,
        action: "completed",
      }).catch(() => {});
    }
    setActive(null);
    setCallStatus("idle");
    activeCallIdRef.current = null;
  }, [clearTimers]);

  const value = useMemo(
    () => ({
      active,
      callStatus,
      isInitiator,
      startCall,
      endCall,
      cancelOutgoingCall,
    }),
    [active, callStatus, isInitiator, startCall, endCall, cancelOutgoingCall]
  );

  return (
    <VideoCallContext.Provider value={value}>
      {children}

      {/* Global Incoming Call Popup Dialog */}
      {incomingCall && (
        <IncomingCallDialog
          call={incomingCall}
          onAccept={handleAcceptIncoming}
          onDecline={handleDeclineIncoming}
        />
      )}

      {/* Global Video Call Overlay */}
      {active && <VideoCallOverlay call={active} onEnd={endCall} />}
    </VideoCallContext.Provider>
  );
}

export function useVideoCall() {
  const ctx = useContext(VideoCallContext);
  if (!ctx) {
    throw new Error("useVideoCall must be used within VideoCallProvider");
  }
  return ctx;
}
