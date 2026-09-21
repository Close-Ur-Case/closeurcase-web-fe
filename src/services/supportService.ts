/**
 * Support Inquiries & Feedback Service Layer
 * Connects to /api/v1/support endpoints for customer inquiries, contact submissions, and public feedback.
 */

import { apiClient } from "./apiClient";
import type {
  ContactInquiry,
  ContactInquiryPayload,
  UpdateInquiryStatusPayload,
} from "@/types/api";

const LOCAL_SUPPORT_KEY = "cuc_support_inquiries";

function getLocalInquiries(): ContactInquiry[] {
  try {
    const raw = localStorage.getItem(LOCAL_SUPPORT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [
    {
      id: "inq_local_001",
      name: "Vikramaditya Construction Ltd",
      email: "legal@vikramaditya.in",
      category: "corporate",
      subject: "Corporate Empanelment Inquiry",
      message:
        "We would like to empanel our company legal matters on CloseUrCase platform for nationwide dispute management.",
      status: "New",
      createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    },
    {
      id: "inq_local_002",
      name: "Radha Krishna Rao",
      email: "radha.krishna@gmail.com",
      category: "general",
      subject: "Query regarding property verification in Hyderabad",
      message: "Can I hire an advocate specifically for search report and title investigation?",
      status: "In Review",
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
  ];
}

function saveLocalInquiries(items: ContactInquiry[]) {
  try {
    localStorage.setItem(LOCAL_SUPPORT_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const supportService = {
  /**
   * Submit a contact inquiry or public feedback message
   */
  async submitInquiry(payload: ContactInquiryPayload): Promise<ContactInquiry> {
    try {
      const res = await apiClient.post<ContactInquiry>("/support/contact", payload);
      // Cache locally for offline preview
      const local = getLocalInquiries();
      saveLocalInquiries([res, ...local.filter((i) => i.id !== res.id)]);
      return res;
    } catch (err) {
      console.warn("[SupportService] Backend submit fallback to local:", err);
      const fallback: ContactInquiry = {
        id: `inq_local_${Date.now()}`,
        name: payload.name,
        email: payload.email,
        category: payload.category || "general",
        subject: payload.subject || "General Support Inquiry",
        message: payload.message + (payload.phone ? `\n\nContact Phone: ${payload.phone}` : ""),
        status: "New",
        createdAt: new Date().toISOString(),
      };
      const local = getLocalInquiries();
      saveLocalInquiries([fallback, ...local]);
      return fallback;
    }
  },

  /**
   * List all customer contact inquiries (Admin)
   */
  async listInquiries(): Promise<ContactInquiry[]> {
    try {
      const items = await apiClient.get<ContactInquiry[]>("/support/inquiries");
      if (Array.isArray(items) && items.length > 0) {
        saveLocalInquiries(items);
        return items;
      }
      return getLocalInquiries();
    } catch (err) {
      console.warn("[SupportService] Backend list fallback to local:", err);
      return getLocalInquiries();
    }
  },

  /**
   * Update the review status of an inquiry (Admin)
   */
  async updateInquiryStatus(
    id: string,
    status: UpdateInquiryStatusPayload["status"],
  ): Promise<ContactInquiry> {
    try {
      const res = await apiClient.patch<ContactInquiry>(`/support/inquiries/${id}`, { status });
      const local = getLocalInquiries();
      const updated = local.map((item) => (item.id === id ? { ...item, status } : item));
      saveLocalInquiries(updated);
      return res;
    } catch (err) {
      console.warn("[SupportService] Backend update status fallback to local:", err);
      const local = getLocalInquiries();
      let match: ContactInquiry | undefined;
      const updated = local.map((item) => {
        if (item.id === id) {
          match = { ...item, status };
          return match;
        }
        return item;
      });
      saveLocalInquiries(updated);
      if (match) return match;
      throw err;
    }
  },
};
