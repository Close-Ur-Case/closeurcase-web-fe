import { Hono } from "hono";
import {
  requestWithdrawal,
  listWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  getWithdrawalSummary,
} from "../controllers/withdrawalController.ts";
import { optionalAuth } from "../middlewares/auth.ts";

const withdrawal = new Hono();

withdrawal.post("/", optionalAuth, requestWithdrawal);
withdrawal.post("/request", optionalAuth, requestWithdrawal);
withdrawal.get("/", optionalAuth, listWithdrawals);
withdrawal.get("/summary", optionalAuth, getWithdrawalSummary);
withdrawal.patch("/:id/approve", optionalAuth, approveWithdrawal);
withdrawal.patch("/:id/reject", optionalAuth, rejectWithdrawal);

export default withdrawal;

