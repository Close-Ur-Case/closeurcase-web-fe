import { Hono } from "hono";
import {
  createCase,
  listCases,
  getCaseById,
  getCaseByCnr,
  updateCaseStatus,
  assignLawyer,
  addHearing,
  addCaseNote,
} from "../controllers/caseController.ts";
import {
  getCaseMessages,
  sendCaseMessage,
  markCaseMessagesRead,
} from "../controllers/chatController.ts";
import { authenticateUser, optionalAuth } from "../middlewares/auth.ts";

const caseRouter = new Hono();

caseRouter.get("/", optionalAuth, listCases);
caseRouter.post("/", optionalAuth, createCase);
caseRouter.get("/cnr/:cnr", optionalAuth, getCaseByCnr);
caseRouter.get("/:id", optionalAuth, getCaseById);
caseRouter.patch("/:id/status", optionalAuth, updateCaseStatus);
caseRouter.patch("/:id/assign-lawyer", optionalAuth, assignLawyer);
caseRouter.post("/:id/hearings", optionalAuth, addHearing);
caseRouter.post("/:id/notes", optionalAuth, addCaseNote);
caseRouter.get("/:id/messages", optionalAuth, getCaseMessages);
caseRouter.post("/:id/messages", optionalAuth, sendCaseMessage);
caseRouter.patch("/:id/messages/read", optionalAuth, markCaseMessagesRead);

export default caseRouter;

