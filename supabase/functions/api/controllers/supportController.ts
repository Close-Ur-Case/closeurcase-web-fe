import type { Context } from "hono";
import { db } from "../config/db.ts";
import { contactInquiries } from "../models/support.ts";
import { desc } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function submitContactInquiry(c: Context) {
  const { name, email, category, subject, message } = await c.req.json();

  if (!name || !email || !subject || !message) {
    throw ApiError.badRequest("Name, email, subject, and message are required");
  }

  const id = `inq_${Date.now()}`;
  const [created] = await db
    .insert(contactInquiries)
    .values({
      id,
      name,
      email,
      category: category || "general",
      subject,
      message,
      status: "New",
    })
    .returning();

  return ApiResponse.created(c, created, "Your message has been submitted successfully. We will contact you soon!");
}

export async function listContactInquiries(c: Context) {
  const inquiries = await db
    .select()
    .from(contactInquiries)
    .orderBy(desc(contactInquiries.createdAt));

  return ApiResponse.success(c, inquiries, "Contact inquiries retrieved");
}
