import { RtcTokenBuilder, RtcRole as AgoraRtcRole } from "agora-token";

export const RtcRole = {
  PUBLISHER: AgoraRtcRole?.PUBLISHER ?? 1,
  SUBSCRIBER: AgoraRtcRole?.SUBSCRIBER ?? 2,
};

export function buildAgoraRtcToken({
  appId,
  appCertificate,
  channelName,
  uid = 0,
  role = RtcRole.PUBLISHER,
  expireSeconds = 3600,
}: {
  appId: string;
  appCertificate: string;
  channelName: string;
  uid?: number | string;
  role?: number;
  expireSeconds?: number;
}) {
  if (!appId || !appCertificate) {
    throw new Error("AGORA_APP_ID and AGORA_APP_CERTIFICATE must be configured");
  }

  const numericUid = Number(uid) || 0;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireSeconds;

  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    numericUid,
    role,
    privilegeExpiredTs,
    privilegeExpiredTs
  );
}
