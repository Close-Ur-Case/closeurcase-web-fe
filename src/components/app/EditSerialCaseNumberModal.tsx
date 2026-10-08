import { useState, useEffect, useRef } from "react";
import {
  Hash,
  Check,
  AlertTriangle,
  Loader2,
  X,
  Pencil,
  ShieldCheck,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Button,
} from "@/components/m3";
import { caseService } from "@/services/caseService";
import { updateCaseSerialCaseNumber } from "@/data/appStore";
import { formatCaseVsTitle } from "@/components/app/caseDocketShared";
import type { LegalCase } from "@/types";

export interface EditSerialCaseNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: LegalCase | null;
  onSuccess?: (updatedCase: LegalCase) => void;
}

export function EditSerialCaseNumberModal({
  isOpen,
  onClose,
  caseItem,
  onSuccess,
}: EditSerialCaseNumberModalProps) {
  const currentSerial =
    caseItem?.serialCaseNumber || caseItem?.serial_case_number || "";

  const [serialValue, setSerialValue] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    status: "idle" | "same" | "unique" | "duplicate" | "error";
    message?: string;
    conflictId?: string;
  }>({ status: "idle" });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when modal opens or target case changes
  useEffect(() => {
    if (isOpen && caseItem) {
      const initial = caseItem.serialCaseNumber || caseItem.serial_case_number || "";
      setSerialValue(initial);
      setCheckResult({ status: "same", message: "Current serial case number" });
      setSaveSuccess(false);
      setSaveError(null);
      setIsChecking(false);
    }
  }, [isOpen, caseItem]);

  // Handle typing & debounced DB uniqueness check
  const handleInputChange = (raw: string) => {
    const val = raw.toUpperCase().trimStart();
    setSerialValue(val);
    setSaveError(null);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = val.trim();
    const currentTrimmed = (
      caseItem?.serialCaseNumber || caseItem?.serial_case_number || ""
    ).trim().toUpperCase();

    if (!trimmed) {
      setIsChecking(false);
      setCheckResult({
        status: "error",
        message: "Serial case number cannot be empty.",
      });
      return;
    }

    if (trimmed === currentTrimmed) {
      setIsChecking(false);
      setCheckResult({
        status: "same",
        message: "This is the current serial case number for this case.",
      });
      return;
    }

    setIsChecking(true);
    setCheckResult({ status: "idle" });

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await caseService.checkSerialCaseNumberUnique(
          trimmed,
          caseItem?.id,
        );
        if (res.unique) {
          setCheckResult({
            status: "unique",
            message: `Serial case number '${trimmed}' is unique and available in the database.`,
          });
        } else {
          setCheckResult({
            status: "duplicate",
            conflictId: res.conflictId,
            message:
              res.message ||
              `Serial case number '${trimmed}' is already in use by case '${res.conflictId || "another docket"}' in the database.`,
          });
        }
      } catch (err: any) {
        setCheckResult({
          status: "error",
          message:
            err?.message || "Failed to crosscheck database uniqueness. Please try again.",
        });
      } finally {
        setIsChecking(false);
      }
    }, 380);
  };

  const handleSave = async () => {
    if (!caseItem) return;
    const clean = serialValue.trim().toUpperCase();
    if (!clean) {
      setSaveError("Serial case number cannot be empty.");
      return;
    }

    const currentTrimmed = (
      caseItem.serialCaseNumber || caseItem.serial_case_number || ""
    ).trim().toUpperCase();

    if (clean === currentTrimmed) {
      onClose();
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // 1. Mandatory crosscheck against DB before saving
      const checkRes = await caseService.checkSerialCaseNumberUnique(
        clean,
        caseItem.id,
      );
      if (!checkRes.unique) {
        setIsSaving(false);
        setCheckResult({
          status: "duplicate",
          conflictId: checkRes.conflictId,
          message:
            checkRes.message ||
            `Cannot save: '${clean}' already exists in database on case '${checkRes.conflictId}'.`,
        });
        setSaveError("Value is not unique in the database. Please provide a unique serial number.");
        return;
      }

      // 2. Persist to database
      await caseService.updateSerialCaseNumber(caseItem.id, clean);

      // 3. Update app store & notify listeners
      const updated = updateCaseSerialCaseNumber(caseItem.id, clean);

      setSaveSuccess(true);
      if (updated && onSuccess) {
        onSuccess(updated);
      }

      // Auto close after brief celebration feedback
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Failed to update serial case number:", err);
      setSaveError(
        err?.message || "Database update failed. Ensure serial case number is unique.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !caseItem) return null;

  const currentTrimmed = (
    caseItem.serialCaseNumber || caseItem.serial_case_number || ""
  ).trim().toUpperCase();
  const inputTrimmed = serialValue.trim().toUpperCase();
  const isChanged = Boolean(inputTrimmed && inputTrimmed !== currentTrimmed);
  const canSave =
    isChanged &&
    !isChecking &&
    checkResult.status === "unique" &&
    !isSaving;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSaving && onClose()} maxWidth="540px">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Pencil className="h-4.5 w-4.5" />
            </div>
            <div>
              <div className="text-base font-bold text-foreground">
                Update Serial Case Number
              </div>
              <div className="text-xs font-normal text-muted-foreground line-clamp-1">
                {formatCaseVsTitle(caseItem)}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogTitle>
      </DialogHeader>

      <DialogContent className="space-y-4 pt-2">
        {/* Case Reference Information */}
        <div className="rounded-xl border border-border/70 bg-surface/80 p-3.5 text-xs text-muted-foreground flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">Case Docket ID:</span>
            <span className="font-mono text-[11px] font-bold text-foreground">{caseItem.id}</span>
          </div>
          {caseItem.caseDetails?.cnr && (
            <div className="flex items-center justify-between">
              <span>Court CNR Number:</span>
              <span className="font-mono text-[11px] font-semibold text-foreground">
                {caseItem.caseDetails.cnr}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span>Current Serial:</span>
            <span className="font-mono text-[11px] font-semibold text-primary">
              {currentSerial || "None"}
            </span>
          </div>
        </div>

        {/* Serial Case Number Input */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
            Serial Case Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Hash className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={serialValue}
              onChange={(e) => handleInputChange(e.target.value)}
              disabled={isSaving}
              placeholder="e.g. CRIM/0831154512/2026"
              className={`w-full rounded-xl border bg-background pl-9 pr-10 py-2.5 font-mono text-sm font-semibold transition-colors focus:outline-none focus:ring-2 ${
                checkResult.status === "duplicate" || checkResult.status === "error" || saveError
                  ? "border-destructive text-destructive focus:ring-destructive/30"
                  : checkResult.status === "unique"
                    ? "border-emerald-500 text-foreground focus:ring-emerald-500/30"
                    : "border-border text-foreground focus:ring-primary/30"
              }`}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {isChecking && (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              )}
              {!isChecking && checkResult.status === "unique" && (
                <Check className="h-4 w-4 text-emerald-500" />
              )}
              {!isChecking && (checkResult.status === "duplicate" || checkResult.status === "error") && (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Standard format: <code className="font-semibold text-foreground">CODE/TIMESTAMP/YEAR</code> (e.g. CIV/0831154512/2026)
          </p>
        </div>

        {/* Real-time Uniqueness Feedback Box */}
        <div className="min-h-[52px]">
          {isChecking && (
            <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary font-medium animate-pulse">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>Cross-checking database for uniqueness...</span>
            </div>
          )}

          {!isChecking && checkResult.status === "unique" && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{checkResult.message || "Unique and available in database."}</span>
            </div>
          )}

          {!isChecking && checkResult.status === "duplicate" && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Database Duplicate Conflict</p>
                <p>{checkResult.message}</p>
              </div>
            </div>
          )}

          {!isChecking && checkResult.status === "same" && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{checkResult.message}</span>
            </div>
          )}

          {!isChecking && checkResult.status === "error" && checkResult.message && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{checkResult.message}</span>
            </div>
          )}

          {saveError && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/15 px-3 py-2 text-xs text-destructive font-semibold">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Serial case number updated successfully!</span>
            </div>
          )}
        </div>
      </DialogContent>

      <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 w-full pt-2">
        <Button
          variant="text"
          onClick={onClose}
          disabled={isSaving}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          variant="filled"
          onClick={handleSave}
          disabled={!canSave || saveSuccess}
          className="w-full sm:w-auto min-w-[130px]"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Saved
            </>
          ) : (
            "Save Serial No"
          )}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
