import { Hono } from "hono";
import {
  generateCounterArgument,
  caseQA,
  summarizeDocument,
} from "../controllers/aiController.ts";
import { optionalAuth } from "../middlewares/auth.ts";

const ai = new Hono();

ai.post("/generate-counter", optionalAuth, generateCounterArgument);
ai.post("/case-qa", optionalAuth, caseQA);
ai.post("/summarize-document", optionalAuth, summarizeDocument);

export default ai;
