import type { ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

/**
 * @material/web has no stable tooltip component, so this keeps Radix for
 * positioning/accessibility behavior and restyles it to M3's plain-tooltip
 * look (inverse-surface container, small shape).
 */
export function TooltipProvider({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Provider delayDuration={300}>{children}</TooltipPrimitive.Provider>;
}

export function Tooltip({
  children,
  label,
  side = "top",
}: {
  children: ReactNode;
  label: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-50 rounded-[var(--md-sys-shape-corner-extra-small)] bg-[var(--md-sys-color-inverse-surface)] px-3 py-1.5 text-xs font-medium text-[var(--md-sys-color-inverse-on-surface)] shadow-[var(--md-sys-elevation-level2)] animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          {label}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
