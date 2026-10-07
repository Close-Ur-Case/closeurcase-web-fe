import { useCallback, useEffect, useRef, useState } from "react";
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  ILocalVideoTrack,
  IAgoraRTCRemoteUser,
  NetworkQuality,
} from "agora-rtc-sdk-ng";

// Optimize video encoding profile for 1-on-1 legal consultations (smooth 720p 24fps)
AgoraRTC.setLogLevel(1); // 0: DEBUG, 1: INFO, 2: WARNING, 3: ERROR, 4: NONE

export interface AgoraTokenConfig {
  appId: string;
  channelName: string;
  token: string;
  uid: number;
}

export interface UseAgoraRtcReturn {
  isJoined: boolean;
  isConnecting: boolean;
  remoteUser: IAgoraRTCRemoteUser | null;
  hasRemoteVideo: boolean;
  hasRemoteAudio: boolean;
  peerLeft: boolean;
  peerLeftReason: string | null;
  micOn: boolean;
  camOn: boolean;
  isScreenSharing: boolean;
  networkQuality: number;
  errorMessage: string | null;
  join: (config: AgoraTokenConfig) => Promise<void>;
  leave: () => Promise<void>;
  triggerPeerLeft: (reason?: string) => void;
  toggleMic: () => Promise<void>;
  toggleCam: () => Promise<void>;
  toggleScreenShare: () => Promise<void>;
  playLocalVideo: (element: HTMLElement | null) => void;
  playRemoteVideo: (element: HTMLElement | null) => void;
}

export function useAgoraRtc(): UseAgoraRtcReturn {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);
  const localContainerRef = useRef<HTMLElement | null>(null);
  const remoteContainerRef = useRef<HTMLElement | null>(null);
  const isConnectingRef = useRef(false);
  const isJoinedRef = useRef(false);

  const [isJoined, setIsJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [hasRemoteAudio, setHasRemoteAudio] = useState(false);
  const [peerLeft, setPeerLeft] = useState(false);
  const [peerLeftReason, setPeerLeftReason] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [networkQuality, setNetworkQuality] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerPeerLeft = useCallback((reason: string = "Quit") => {
    setRemoteUser(null);
    setHasRemoteVideo(false);
    setHasRemoteAudio(false);
    setPeerLeft(true);
    setPeerLeftReason(reason);
  }, []);

  const playLocalVideo = useCallback((element: HTMLElement | null) => {
    localContainerRef.current = element;
    if (element && localVideoTrackRef.current) {
      localVideoTrackTrackPlay(element);
    }
  }, []);

  function localVideoTrackTrackPlay(element: HTMLElement) {
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.play(element, { fit: "cover" });
    }
  }

  const playRemoteVideo = useCallback((element: HTMLElement | null) => {
    remoteContainerRef.current = element;
    if (element && remoteUser?.videoTrack) {
      remoteUser.videoTrack.play(element, { fit: "cover" });
    }
  }, [remoteUser]);

  const leave = useCallback(async () => {
    try {
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }

      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }

      if (clientRef.current) {
        const client = clientRef.current;
        clientRef.current = null;
        try {
          await client.leave();
        } finally {
          client.removeAllListeners();
        }
      }
    } catch (err) {
      console.warn("[AgoraRTC] Error leaving channel:", err);
    } finally {
      isJoinedRef.current = false;
      isConnectingRef.current = false;
      setIsJoined(false);
      setIsConnecting(false);
      setRemoteUser(null);
      setHasRemoteVideo(false);
      setHasRemoteAudio(false);
      setIsScreenSharing(false);
      setPeerLeft(false);
      setPeerLeftReason(null);
    }
  }, []);

  const join = useCallback(
    async ({ appId, channelName, token, uid }: AgoraTokenConfig) => {
      if (isConnectingRef.current || isJoinedRef.current) return;
      isConnectingRef.current = true;
      setIsConnecting(true);
      setErrorMessage(null);
      setPeerLeft(false);
      setPeerLeftReason(null);

      // Handle Mock Mode for local offline development
      if (!appId || appId.includes("mock") || appId.includes("placeholder") || token.includes("mock")) {
        console.info("[AgoraRTC] Mock credentials detected. Running in simulated 1-on-1 mode.");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          if (localContainerRef.current) {
            const videoEl = document.createElement("video");
            videoEl.autoplay = true;
            videoEl.muted = true;
            videoEl.playsInline = true;
            videoEl.srcObject = stream;
            videoEl.className = "w-full h-full object-cover";
            localContainerRef.current.replaceChildren(videoEl);
          }
          isJoinedRef.current = true;
          isConnectingRef.current = false;
          setIsJoined(true);
          setIsConnecting(false);
          return;
        } catch {
          setErrorMessage("Camera or microphone permission was denied.");
          isConnectingRef.current = false;
          setIsConnecting(false);
          return;
        }
      }

      try {
        // Initialize Agora RTC Client in 1-on-1 interactive mode
        const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;

        // Remote user published audio/video
        client.on("user-published", async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          setRemoteUser(user);
          setPeerLeft(false);

          if (mediaType === "video") {
            setHasRemoteVideo(true);
            if (remoteContainerRef.current) {
              user.videoTrack?.play(remoteContainerRef.current, { fit: "cover" });
            }
          }

          if (mediaType === "audio") {
            setHasRemoteAudio(true);
            user.audioTrack?.play();
          }
        });

        // Remote user muted or stopped video/audio
        client.on("user-unpublished", (user, mediaType) => {
          if (mediaType === "video") {
            setHasRemoteVideo(false);
          }
          if (mediaType === "audio") {
            setHasRemoteAudio(false);
          }
        });

        // Remote user left consultation
        client.on("user-left", (_user, reason) => {
          setRemoteUser(null);
          setHasRemoteVideo(false);
          setHasRemoteAudio(false);
          setPeerLeft(true);
          setPeerLeftReason(reason);
        });

        // Network quality monitor
        client.on("network-quality", (stats: NetworkQuality) => {
          setNetworkQuality(stats.downlinkNetworkQuality || 1);
        });

        // Join Agora RTC channel
        await client.join(appId, channelName, token, uid);

        // Create local camera and microphone tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: "high_quality_stereo", AEC: true, ANS: true },
          { encoderConfig: "720p_2" }
        );

        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        // Render local preview
        if (localContainerRef.current) {
          videoTrack.play(localContainerRef.current, { fit: "cover" });
        }

        // Publish local media
        await client.publish([audioTrack, videoTrack]);

        isJoinedRef.current = true;
        setIsJoined(true);
      } catch (err: any) {
        console.error("[AgoraRTC] Connection failed:", err);
        setErrorMessage(
          err.message?.includes("PERMISSION_DENIED") || err.name === "NotAllowedError"
            ? "Camera/Microphone permission was denied by browser settings."
            : "Could not connect to Agora video consultation room. Please retry."
        );
      } finally {
        isConnectingRef.current = false;
        setIsConnecting(false);
      }
    },
    []
  );

  const toggleMic = useCallback(async () => {
    if (!localAudioTrackRef.current) return;
    const nextState = !micOn;
    await localAudioTrackRef.current.setEnabled(nextState);
    setMicOn(nextState);
  }, [micOn]);

  const toggleCam = useCallback(async () => {
    if (!localVideoTrackRef.current) return;
    const nextState = !camOn;
    await localVideoTrackRef.current.setEnabled(nextState);
    setCamOn(nextState);
  }, [camOn]);

  const toggleScreenShare = useCallback(async () => {
    const client = clientRef.current;
    if (!client || !isJoined) return;

    if (isScreenSharing) {
      // Revert back to camera track
      if (screenTrackRef.current) {
        await client.unpublish(screenTrackRef.current);
        screenTrackRef.current.stop();
        screenTrackRef.current.close();
        screenTrackRef.current = null;
      }
      if (localVideoTrackRef.current && camOn) {
        await client.publish(localVideoTrackRef.current);
        if (localContainerRef.current) {
          localVideoTrackRef.current.play(localContainerRef.current, { fit: "cover" });
        }
      }
      setIsScreenSharing(false);
    } else {
      // Start screen sharing for case documents
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack(
          { encoderConfig: "1080p_1" },
          "disable"
        );

        const currentScreenTrack = Array.isArray(screenTrack) ? screenTrack[0] : screenTrack;
        screenTrackRef.current = currentScreenTrack;

        // Handle user clicking native browser "Stop sharing" button
        currentScreenTrack.on("track-ended", async () => {
          if (clientRef.current) {
            await clientRef.current.unpublish(currentScreenTrack);
          }
          currentScreenTrack.stop();
          currentScreenTrack.close();
          screenTrackRef.current = null;
          if (localVideoTrackRef.current && camOn && clientRef.current) {
            await clientRef.current.publish(localVideoTrackRef.current);
            if (localContainerRef.current) {
              localVideoTrackRef.current.play(localContainerRef.current, { fit: "cover" });
            }
          }
          setIsScreenSharing(false);
        });

        // Unpublish camera, publish screen track
        if (localVideoTrackRef.current) {
          await client.unpublish(localVideoTrackRef.current);
        }
        await client.publish(currentScreenTrack);

        // Preview screen share locally
        if (localContainerRef.current) {
          currentScreenTrack.play(localContainerRef.current, { fit: "cover" });
        }

        setIsScreenSharing(true);
      } catch (err) {
        console.warn("[AgoraRTC] Screen share cancelled or rejected:", err);
      }
    }
  }, [camOn, isJoined, isScreenSharing]);

  // Cleanup tracks and connection on unmount
  useEffect(() => {
    return () => {
      void leave();
    };
  }, [leave]);

  return {
    isJoined,
    isConnecting,
    remoteUser,
    hasRemoteVideo,
    hasRemoteAudio,
    peerLeft,
    peerLeftReason,
    micOn,
    camOn,
    isScreenSharing,
    networkQuality,
    errorMessage,
    join,
    leave,
    triggerPeerLeft,
    toggleMic,
    toggleCam,
    toggleScreenShare,
    playLocalVideo,
    playRemoteVideo,
  };
}
