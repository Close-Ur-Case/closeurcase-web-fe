import crypto from "node:crypto";

export const RtcRole = {
  PUBLISHER: 1,
  SUBSCRIBER: 2,
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

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expireSeconds;
  const salt = Math.floor(Math.random() * 99999999) + 1;

  const uidStr = String(uid);
  const message = Buffer.concat([
    Buffer.from(appId, "utf8"),
    Buffer.from(channelName, "utf8"),
    Buffer.from(uidStr, "utf8"),
    Buffer.from(String(salt), "utf8"),
    Buffer.from(String(privilegeExpiredTs), "utf8"),
    Buffer.from(String(role), "utf8"),
  ]);

  const signature = crypto
    .createHmac("sha256", appCertificate)
    .update(message)
    .digest("hex");

  const tokenPayload = {
    v: "006",
    appId,
    cname: channelName,
    uid: uidStr,
    role,
    salt,
    ts: privilegeExpiredTs,
    sig: signature,
  };

  return Buffer.from(JSON.stringify(tokenPayload)).toString("base64");
}
