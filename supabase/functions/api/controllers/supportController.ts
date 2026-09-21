import type { Context } from "hono";
import { db } from "../config/db.ts";
import { contactInquiries } from "../models/support.ts";
import { desc, eq } from "drizzle-orm";
import { ApiResponse } from "../utils/apiResponse.ts";
import { ApiError } from "../utils/apiError.ts";

export async function submitContactInquiry(c: Context) {
  const { name, email, phone, category, subject, message } = await c.req.json();

  if (!name || !email || !message) {
    throw ApiError.badRequest("Name, email, and message are required");
  }

  const finalSubject = subject && subject.trim().length > 0 ? subject.trim() : "General Support Inquiry";
  const finalMessage = phone && phone.trim().length > 0 ? `${message.trim()}\n\nContact Phone: ${phone.trim()}` : message.trim();

  const id = `inq_${Date.now()}`;
  const [created] = await db
    .insert(contactInquiries)
    .values({
      id,
      name: name.trim(),
      email: email.trim(),
      category: category || "general",
      subject: finalSubject,
      message: finalMessage,
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

export async function updateInquiryStatus(c: Context) {
  const { id } = c.req.param();
  const { status } = await c.req.json();

  if (!status) {
    throw ApiError.badRequest("Status is required");
  }

  const [updated] = await db
    .update(contactInquiries)
    .set({ status })
    .where(eq(contactInquiries.id, id))
    .returning();

  if (!updated) {
    throw ApiError.notFound(`Inquiry '${id}' not found`);
  }

  return ApiResponse.success(c, updated, "Inquiry status updated successfully");
}
