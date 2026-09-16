import { Hono } from "hono";
import {
  generateAgoraToken,
  logCallSession,
  getCallHistory,
} from "../controllers/videoCallController.ts";
import { authenticateUser } from "../middlewares/auth.ts";

const videoCall = new Hono();

videoCall.post("/token", authenticateUser, generateAgoraToken);
videoCall.post("/log", authenticateUser, logCallSession);
videoCall.get("/history/:caseId", authenticateUser, getCallHistory);

export default videoCall;
