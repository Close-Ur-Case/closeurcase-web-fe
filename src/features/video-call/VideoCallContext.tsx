import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { VideoCallOverlay } from "@/components/app/VideoCallOverlay";

export interface ActiveVideoCall {
  caseId: string;
  withName: string;
  role: "citizen" | "lawyer";
}

interface VideoCallContextValue {
  active: ActiveVideoCall | null;
  startCall: (call: ActiveVideoCall) => void;
  endCall: () => void;
}

const VideoCallContext = createContext<VideoCallContextValue | null>(null);

export function VideoCallProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<ActiveVideoCall | null>(null);

  const startCall = useCallback((call: ActiveVideoCall) => {
    setActive(call);
  }, []);

  const endCall = useCallback(() => {
    setActive(null);
  }, []);

  const value = useMemo(() => ({ active, startCall, endCall }), [active, startCall, endCall]);

  return (
    <VideoCallContext.Provider value={value}>
      {children}
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
