import { Hono } from "hono";
import {
  getKnowledgeBase,
  addKnowledgeItem,
  deleteKnowledgeItem,
} from "../controllers/knowledgeController.ts";
import { authenticateUser, optionalAuth } from "../middlewares/auth.ts";
import { requireRole } from "../middlewares/roleGuard.ts";

const knowledge = new Hono();

knowledge.get("/", optionalAuth, getKnowledgeBase);
knowledge.post("/", authenticateUser, requireRole("admin"), addKnowledgeItem);
knowledge.delete("/:id", authenticateUser, requireRole("admin"), deleteKnowledgeItem);

export default knowledge;
