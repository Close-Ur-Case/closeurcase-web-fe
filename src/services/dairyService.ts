import { apiClient } from "./apiClient";
import {
  getDairyNotes,
  addDairyNote,
  updateDairyNote,
  toggleDairyNoteCompleted,
  deleteDairyNote,
  syncDairyNotes,
} from "@/data/appStore";
import type { DairyNote } from "@/types";

export interface ListDairyNotesParams {
  userId?: string;
  date?: string; // YYYY-MM-DD
  caseId?: string;
}

export interface CreateDairyNotePayload {
  userId: string;
  entryDate: string; // YYYY-MM-DD
  notes: string;
  category?: string | null;
  caseId?: string | null;
  isCompleted?: boolean;
}

export interface UpdateDairyNotePayload {
  notes?: string;
  entryDate?: string;
  category?: string | null;
  caseId?: string | null;
  isCompleted?: boolean;
}

export const dairyService = {
  /**
   * READ: Fetch dairy notes from backend API, with fallback to local store
   */
  async listNotes(params?: ListDairyNotesParams): Promise<DairyNote[]> {
    try {
      const res = await apiClient.get<any[]>("/dairy", {
        params: {
          ...(params?.userId ? { userId: params.userId } : {}),
          ...(params?.date ? { date: params.date } : {}),
          ...(params?.caseId ? { caseId: params.caseId } : {}),
        },
      });
      if (Array.isArray(res)) {
        const mapped: DairyNote[] = res.map((r) => ({
          id: r.id,
          userId: r.user_id || r.userId,
          entryDate: r.entry_date || r.entryDate,
          notes: r.notes,
          category: r.category || null,
          caseId: r.case_id || r.caseId || null,
          isCompleted: Boolean(r.is_completed ?? r.isCompleted),
          createdAt: r.created_at || r.createdAt,
          updatedAt: r.updated_at || r.updatedAt,
        }));
        syncDairyNotes(mapped, params?.userId);
        return mapped;
      }
    } catch (err) {
      console.warn("[dairyService] listNotes API fallback to local store:", err);
    }
    return getDairyNotes(params?.date, params?.userId);
  },

  /**
   * CREATE: Post new dairy note to backend API
   */
  async createNote(payload: CreateDairyNotePayload): Promise<DairyNote> {
    const isCompletedVal = Boolean(payload.isCompleted);
    const categoryVal = payload.category && payload.category.trim() ? payload.category.trim() : null;
    const caseIdVal = payload.caseId && payload.caseId.trim() ? payload.caseId.trim() : null;

    try {
      const res = await apiClient.post<any>("/dairy", {
        userId: payload.userId,
        entryDate: payload.entryDate,
        notes: payload.notes,
        category: categoryVal,
        caseId: caseIdVal,
        case_id: caseIdVal,
        is_completed: isCompletedVal,
        isCompleted: isCompletedVal,
      });
      if (res && res.id) {
        const mapped: DairyNote = {
          id: res.id,
          userId: res.user_id || res.userId || payload.userId,
          entryDate: res.entry_date || res.entryDate || payload.entryDate,
          notes: res.notes || payload.notes,
          category: res.category || categoryVal,
          caseId: res.case_id || res.caseId || caseIdVal,
          isCompleted: Boolean(res.is_completed ?? res.isCompleted ?? isCompletedVal),
          createdAt: res.created_at || res.createdAt || new Date().toISOString(),
          updatedAt: res.updated_at || res.updatedAt || new Date().toISOString(),
        };
        addDairyNote(mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("[dairyService] createNote API fallback to local store:", err);
    }
    return addDairyNote(payload);
  },

  /**
   * UPDATE: Patch existing note fields (notes, date, category, caseId, isCompleted)
   */
  async updateNote(
    noteId: string,
    updates: UpdateDairyNotePayload,
  ): Promise<DairyNote | null> {
    const isCompletedVal = updates.isCompleted;
    const categoryVal = updates.category !== undefined
      ? (updates.category && updates.category.trim() ? updates.category.trim() : null)
      : undefined;
    const caseIdVal = updates.caseId !== undefined
      ? (updates.caseId && updates.caseId.trim() ? updates.caseId.trim() : null)
      : undefined;

    // Optimistic local update
    const local = updateDairyNote(noteId, {
      ...(updates.notes !== undefined ? { notes: updates.notes.trim() } : {}),
      ...(updates.entryDate !== undefined ? { entryDate: updates.entryDate } : {}),
      ...(categoryVal !== undefined ? { category: categoryVal } : {}),
      ...(caseIdVal !== undefined ? { caseId: caseIdVal } : {}),
      ...(isCompletedVal !== undefined ? { isCompleted: isCompletedVal } : {}),
    });

    try {
      const patchBody: Record<string, any> = {};
      if (updates.notes !== undefined) patchBody.notes = updates.notes.trim();
      if (updates.entryDate !== undefined) {
        patchBody.entry_date = updates.entryDate;
        patchBody.entryDate = updates.entryDate;
      }
      if (categoryVal !== undefined) patchBody.category = categoryVal;
      if (caseIdVal !== undefined) {
        patchBody.case_id = caseIdVal;
        patchBody.caseId = caseIdVal;
      }
      if (isCompletedVal !== undefined) {
        patchBody.is_completed = isCompletedVal;
        patchBody.isCompleted = isCompletedVal;
      }

      const res = await apiClient.patch<any>(`/dairy/${noteId}`, patchBody);
      if (res && res.id) {
        const mapped: DairyNote = {
          id: res.id,
          userId: res.user_id || res.userId || local?.userId || "",
          entryDate: res.entry_date || res.entryDate || local?.entryDate || "",
          notes: res.notes ?? local?.notes ?? "",
          category: res.category !== undefined ? res.category : (local?.category ?? null),
          caseId: res.case_id || res.caseId || local?.caseId || null,
          isCompleted: Boolean(res.is_completed ?? res.isCompleted ?? local?.isCompleted),
          createdAt: res.created_at || res.createdAt || local?.createdAt || new Date().toISOString(),
          updatedAt: res.updated_at || res.updatedAt || new Date().toISOString(),
        };
        updateDairyNote(noteId, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("[dairyService] updateNote API fallback to local store:", err);
    }
    return local;
  },

  /**
   * UPDATE (Toggle): Specific helper to toggle isCompleted status
   */
  async toggleCompleted(noteId: string, isCompleted: boolean): Promise<DairyNote | null> {
    // Optimistic local update
    const updated = toggleDairyNoteCompleted(noteId, isCompleted);
    try {
      const res = await apiClient.patch<any>(`/dairy/${noteId}`, {
        is_completed: isCompleted,
        isCompleted,
      });
      if (res && res.id) {
        const mapped: DairyNote = {
          id: res.id,
          userId: res.user_id || res.userId || updated?.userId || "",
          entryDate: res.entry_date || res.entryDate || updated?.entryDate || "",
          notes: res.notes ?? updated?.notes ?? "",
          category: res.category !== undefined ? res.category : (updated?.category ?? null),
          caseId: res.case_id || res.caseId || updated?.caseId || null,
          isCompleted: Boolean(res.is_completed ?? res.isCompleted ?? isCompleted),
          createdAt: res.created_at || res.createdAt || updated?.createdAt || new Date().toISOString(),
          updatedAt: res.updated_at || res.updatedAt || new Date().toISOString(),
        };
        updateDairyNote(noteId, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("[dairyService] toggleCompleted API fallback to local store:", err);
    }
    return updated;
  },

  /**
   * DELETE: Delete note from backend API and local store
   */
  async deleteNote(noteId: string): Promise<boolean> {
    deleteDairyNote(noteId);
    try {
      await apiClient.delete<any>(`/dairy/${noteId}`);
      return true;
    } catch (err) {
      console.warn("[dairyService] deleteNote API fallback to local store:", err);
      return false;
    }
  },
};
