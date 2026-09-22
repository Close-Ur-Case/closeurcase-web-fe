import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { MdDialogEl } from "./elements";
import type { MdDialog } from "@material/web/dialog/dialog.js";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  maxWidth?: string;
  /** Vertical cap, same clamping treatment as `maxWidth`. Pass "100vh" for a
   * near-fullscreen dialog (e.g. a toggleable document/image preview). */
  maxHeight?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * M3 dialog component using native @material/web md-dialog.
 * Features customizable maxWidth, elevation shadow, backdrop blur scrim,
 * and clean scrollbars for desktop & mobile viewports.
 */
export function Dialog({
  open,
  onOpenChange,
  children,
  maxWidth = "720px",
  maxHeight = "88vh",
  className = "",
  style,
}: DialogProps) {
  const hostRef = useRef<MdDialog | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const root = host.shadowRoot;
    if (!root || root.querySelector("style[data-cuc-dialog-surface]")) return;

    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-cuc-dialog-surface", "");
    styleEl.textContent = `
      :host {
        max-width: var(--md-dialog-container-max-width, min(720px, calc(100vw - 24px))) !important;
        max-height: var(--md-dialog-container-max-height, min(88vh, 780px)) !important;
        width: var(--md-dialog-container-width, auto) !important;
        z-index: 50 !important;
      }
      .container {
        border: 1px solid var(--color-border, rgba(226, 232, 240, 0.8));
        box-shadow:
          0 20px 25px -5px rgba(15, 23, 42, 0.18),
          0 8px 10px -6px rgba(15, 23, 42, 0.12);
        border-radius: var(--md-dialog-container-shape, 24px) !important;
      }
      .scrim {
        background: rgba(15, 23, 42, 0.55) !important;
        backdrop-filter: blur(4px) !important;
        -webkit-backdrop-filter: blur(4px) !important;
        opacity: 1 !important;
        z-index: 40 !important;
      }
      dialog {
        z-index: 41 !important;
      }
      slot[name="icon"]::slotted(*) {
        width: auto !important;
        height: auto !important;
        max-width: none !important;
        max-height: none !important;
        margin-top: 28px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      }
      .has-icon slot[name="headline"]::slotted(*) {
        padding-top: 12px !important;
      }
      .actions {
        display: flex;
        justify-content: inherit;
      }
      .scroller::-webkit-scrollbar {
        width: 6px;
      }
      .scroller::-webkit-scrollbar-track {
        background: transparent;
      }
      .scroller::-webkit-scrollbar-thumb {
        background-color: var(--color-border, #cbd5e1);
        border-radius: 9999px;
      }
      .scroller::-webkit-scrollbar-thumb:hover {
        background-color: var(--color-muted-foreground, #94a3b8);
      }
    `;
    root.appendChild(styleEl);
  }, []);

  return (
    <MdDialogEl
      ref={hostRef}
      open={open}
      onClose={() => onOpenChange(false)}
      onCancel={() => onOpenChange(false)}
      className={className}
      style={
        {
          "--md-dialog-container-width": `min(${maxWidth}, calc(100vw - 24px))`,
          "--md-dialog-container-max-width": `min(${maxWidth}, calc(100vw - 24px))`,
          "--md-dialog-container-max-height": `min(${maxHeight}, calc(100vh - 24px))`,
          "--md-dialog-container-color": "var(--md-sys-color-surface, #ffffff)",
          "--md-dialog-container-shape": "24px",
          width: `min(${maxWidth}, calc(100vw - 24px))`,
          maxWidth: `min(${maxWidth}, calc(100vw - 24px))`,
          maxHeight: `min(${maxHeight}, calc(100vh - 24px))`,
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </MdDialogEl>
  );
}

export function DialogIcon({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div slot="icon" className={`flex items-center justify-center pt-1 ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div slot="headline" className={`min-w-0 w-full ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`min-w-0 ${className}`}>{children}</div>;
}

export function DialogContent({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div slot="content" className={`min-w-0 max-w-full ${className}`}>
      {children}
    </div>
  );
}

export function DialogFooter({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div slot="actions" className={`w-full ${className}`}>
      {children}
    </div>
  );
}
