import type { Context } from "hono";
import { db } from "../config/db.ts";
import { withdrawalRequests } from "../models/withdrawals.ts";
import { eq, desc } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function requestWithdrawal(c: Context) {
  const { lawyerId, lawyerName, amount, bankName, accountNumber, ifscCode } = await c.req.json();

  const id = `w_${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  const [record] = await db
    .insert(withdrawalRequests)
    .values({
      id,
      lawyerId,
      lawyerName: lawyerName || "Lawyer",
      amount: Number(amount),
      requestedAt: today,
      status: "Pending",
      bankName,
      accountNumber,
      ifscCode,
    })
    .returning();

  return ApiResponse.created(c, record, "Withdrawal request submitted successfully");
}

export async function listWithdrawals(c: Context) {
  const lawyerId = c.req.query("lawyerId");
  let query = db.select().from(withdrawalRequests);
  if (lawyerId) {
    query = query.where(eq(withdrawalRequests.lawyerId, lawyerId)) as any;
  }
  const results = await query.orderBy(desc(withdrawalRequests.requestedAt));
  return ApiResponse.success(c, results, "Withdrawal requests retrieved successfully");
}

export async function approveWithdrawal(c: Context) {
  const id = c.req.param("id")!;
  const today = new Date().toISOString().slice(0, 10);
  const refId = `TXN_${Date.now().toString().slice(-8)}`;

  const [updated] = await db
    .update(withdrawalRequests)
    .set({
      status: "Approved",
      processedAt: today,
      referenceId: refId,
    })
    .where(eq(withdrawalRequests.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Withdrawal request '${id}' not found`);
  return ApiResponse.success(c, updated, "Withdrawal request approved successfully");
}

export async function rejectWithdrawal(c: Context) {
  const id = c.req.param("id")!;
  const { rejectionReason } = await c.req.json();
  const today = new Date().toISOString().slice(0, 10);

  const [updated] = await db
    .update(withdrawalRequests)
    .set({
      status: "Rejected",
      processedAt: today,
      rejectionReason: rejectionReason || "Verification failed",
    })
    .where(eq(withdrawalRequests.id, id))
    .returning();

  if (!updated) throw ApiError.notFound(`Withdrawal request '${id}' not found`);
  return ApiResponse.success(c, updated, "Withdrawal request rejected");
}

export async function getWithdrawalSummary(c: Context) {
  const lawyerId = c.req.query("lawyerId") || c.req.param("lawyerId");
  if (!lawyerId) {
    throw ApiError.badRequest("lawyerId is required");
  }

  const allReqs = await db
    .select()
    .from(withdrawalRequests)
    .where(eq(withdrawalRequests.lawyerId, lawyerId));

  const totalWithdrawn = allReqs
    .filter((r) => r.status === "Approved")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const pendingWithdrawal = allReqs
    .filter((r) => r.status === "Pending")
    .reduce((acc, curr) => acc + curr.amount, 0);

  return ApiResponse.success(
    c,
    {
      lawyerId,
      totalWithdrawn,
      pendingWithdrawal,
      requestCount: allReqs.length,
    },
    "Withdrawal summary retrieved"
  );
}

