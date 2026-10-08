import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Calendar as CalendarIcon,
  BookOpen,
  Check,
  Loader2,
  AlertCircle,
  Briefcase,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Button,
  Switch,
} from "@/components/m3";
import { dairyService } from "@/services/dairyService";
import { formatCaseVsTitle } from "@/components/app/caseDocketShared";
import { cn } from "@/lib/utils";
import type { LegalCase, DairyNote } from "@/types";

export interface AddDailyNoteModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (note: DairyNote) => void;
  userId: string;
  initialDate?: string; // YYYY-MM-DD
  cases?: LegalCase[];
  noteToEdit?: DairyNote | null;
}

const CATEGORY_PRESETS = [
  { label: "Court Hearing", icon: "⚖️" },
  { label: "Client Follow-up", icon: "📞" },
  { label: "Filing & Docs", icon: "📄" },
  { label: "Legal Research", icon: "🔍" },
  { label: "General Note", icon: "📝" },
];

export function AddDailyNoteModal({
  open,
  onClose,
  onSuccess,
  userId,
  initialDate,
  cases = [],
  noteToEdit,
}: AddDailyNoteModalProps) {
  const isEditing = Boolean(noteToEdit);
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const tomorrowIso = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }, []);

  const [date, setDate] = useState<string>(initialDate || todayIso);
  const [noteText, setNoteText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedCaseId, setSelectedCaseId] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Sync date and note data when modal opens or noteToEdit changes
  useEffect(() => {
    if (open) {
      if (noteToEdit) {
        setDate(noteToEdit.entryDate || todayIso);
        setNoteText(noteToEdit.notes || "");
        setSelectedCategory(noteToEdit.category || "");
        setSelectedCaseId(noteToEdit.caseId || "");
        setIsCompleted(Boolean(noteToEdit.isCompleted));
      } else {
        setDate(initialDate || todayIso);
        setNoteText("");
        setSelectedCategory("");
        setSelectedCaseId("");
        setIsCompleted(false);
      }
      setErrorMessage(null);
      setIsSaving(false);
      // Auto-focus after dialog opens
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, noteToEdit, initialDate, todayIso]);

  // Formatted date string for user-friendly display
  const formattedDate = useMemo(() => {
    if (!date) return "";
    try {
      const [y, m, d] = date.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  }, [date]);

  // Toggle category preset
  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("");
      return;
    }
    setSelectedCategory(category);
    const prefix = `[${category}] `;
    if (!noteText.startsWith("[")) {
      setNoteText((prev) => `${prefix}${prev}`);
    } else {
      const clean = noteText.replace(/^\[[^\]]+\]\s*/, "");
      setNoteText(`${prefix}${clean}`);
    }
    textareaRef.current?.focus();
  };

  // Optional case link handler
  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
    if (!caseId) return;

    const chosen = cases.find((c) => c.id === caseId);
    if (chosen) {
      const caseRef = `Ref: ${formatCaseVsTitle(chosen)} (${chosen.serialCaseNumber || chosen.id})`;
      if (!noteText.includes(chosen.id)) {
        setNoteText((prev) => (prev ? `${prev}\n${caseRef}` : caseRef));
      }
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = noteText.trim();
    if (!trimmed) {
      setErrorMessage("Please enter note remarks before saving.");
      return;
    }
    if (isSaving) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      if (noteToEdit) {
        const result = await dairyService.updateNote(noteToEdit.id, {
          entryDate: date || todayIso,
          notes: trimmed,
          category: selectedCategory.trim() || null,
          caseId: selectedCaseId.trim() || null,
          isCompleted,
        });

        if (result) {
          onSuccess(result);
          onClose();
        } else {
          throw new Error("Failed to update note in backend");
        }
      } else {
        const result = await dairyService.createNote({
          userId,
          entryDate: date || todayIso,
          notes: trimmed,
          category: selectedCategory.trim() || null,
          caseId: selectedCaseId.trim() || null,
          isCompleted,
        });

        onSuccess(result);
        onClose();
      }
    } catch (err: any) {
      console.error("[AddDailyNoteModal] Failed to save note:", err);
      setErrorMessage(
        err?.message || "Failed to save daily note to backend. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Support Ctrl+Enter / Cmd+Enter for quick submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isSaving) onClose();
      }}
      maxWidth="560px"
    >
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-2xs">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-base font-bold text-foreground flex items-center gap-2">
                <span>{isEditing ? "Edit Daily Note" : "Add Daily Note"}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>{isEditing ? "Update Entry" : "Daily Diary"}</span>
                </span>
              </div>
              <div className="text-xs font-normal text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <CalendarIcon className="h-3 w-3 text-primary/70" />
                <span>{formattedDate}</span>
                {date === todayIso && (
                  <span className="font-semibold text-primary">(Today)</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
            title="Close"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogTitle>
      </DialogHeader>

      <DialogContent className="space-y-4 pt-2">
          {/* Error Message Alert */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Date Picker Row with Fast Preset Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                Note Date
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDate(todayIso)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-colors cursor-pointer border",
                    date === todayIso
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground",
                  )}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDate(tomorrowIso)}
                  className={cn(
                    "rounded-md px-2 py-0.5 text-[10.5px] font-semibold transition-colors cursor-pointer border",
                    date === tomorrowIso
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground",
                  )}
                >
                  Tomorrow
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isSaving}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>
          </div>

          {/* Category Chips Preset */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Category Preset (Optional)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_PRESETS.map((cat) => (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => handleCategorySelect(cat.label)}
                  disabled={isSaving}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer",
                    selectedCategory === cat.label
                      ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                      : "border-border/70 bg-surface text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Case Docket Link */}
          {cases.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 text-primary" />
                <span>Link to Case Docket (Optional)</span>
              </label>
              <select
                value={selectedCaseId}
                onChange={(e) => handleCaseSelect(e.target.value)}
                disabled={isSaving}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">-- No case linked (General Diary Note) --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatCaseVsTitle(c)} • {c.serialCaseNumber || c.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Note Content Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
                Note Content <span className="text-destructive">*</span>
              </label>
              <span className="text-[11px] text-muted-foreground">
                {noteText.length} characters
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={noteText}
              onChange={(e) => {
                setNoteText(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              placeholder="Write your daily note remarks, court impressions, hearing notes, or client instructions here... (e.g. Received certified copy of bail order from registry; deliver to client tomorrow)"
              rows={5}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm font-medium text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed"
              required
            />
            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Tip: Press ⌘+Enter or Ctrl+Enter to save</span>
            </div>
          </div>

          {/* Completion Status Toggle (Material 3 Switch) */}
          <div className="flex items-center justify-between rounded-xl border border-border/80 bg-surface/70 p-3 shadow-2xs">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span>Status:</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border",
                    isCompleted
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                  )}
                >
                  {isCompleted ? "Completed" : "Pending"}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Toggle to save this note as already completed
              </div>
            </div>

            <Switch
              selected={isCompleted}
              onChange={setIsCompleted}
              disabled={isSaving}
              ariaLabel="Mark as completed on creation"
            />
          </div>
        </DialogContent>

      <DialogFooter className="flex items-center justify-end gap-2 border-t border-border/60 p-4">
        <Button
          type="button"
          variant="text"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="filled"
          onClick={handleSave}
          disabled={isSaving || !noteText.trim()}
          className="gap-2 shadow-xs"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isEditing ? "Updating Note..." : "Saving Note..."}</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>{isEditing ? "Update Note" : "Save Note"}</span>
            </>
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
