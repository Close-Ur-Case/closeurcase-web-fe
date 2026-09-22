import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogIcon,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Button,
} from "@/components/m3";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Reusable confirmation dialog. Use for any destructive or irreversible
 * actions (deletions, suspensions, deactivations).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";
  const accentVar = isDanger
    ? "var(--md-sys-color-error, #dc2626)"
    : "var(--md-extended-color-warning, #d97706)";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()} maxWidth="460px">
      <DialogIcon>
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full shrink-0 shadow-xs"
          style={{
            backgroundColor: `color-mix(in srgb, ${accentVar} 14%, transparent)`,
            border: `1.5px solid color-mix(in srgb, ${accentVar} 25%, transparent)`,
          }}
        >
          <AlertTriangle className="h-6 w-6 shrink-0" style={{ color: accentVar }} />
        </div>
      </DialogIcon>
      <DialogHeader className="pt-2">
        <DialogTitle className="text-center text-base sm:text-lg font-bold text-foreground">
          {title}
        </DialogTitle>
      </DialogHeader>
      <DialogContent>
        <p className="text-center text-xs sm:text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </DialogContent>
      <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-center gap-3 w-full pt-2">
        <Button variant="outlined" onClick={onCancel} className="w-full sm:w-auto">
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          className="w-full sm:w-auto"
          style={
            {
              "--md-filled-button-container-color": accentVar,
              "--md-filled-button-label-text-color": "#ffffff",
            } as React.CSSProperties
          }
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
