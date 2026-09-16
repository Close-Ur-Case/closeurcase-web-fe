import { env } from "./env.ts";

export const agoraConfig = {
  appId: env.AGORA_APP_ID,
  appCertificate: env.AGORA_APP_CERTIFICATE,
  defaultExpirationInSeconds: 3600,
};
