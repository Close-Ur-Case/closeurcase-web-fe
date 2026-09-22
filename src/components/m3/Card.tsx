import type { ReactNode, MouseEventHandler } from "react";

export type CardVariant = "elevated" | "filled" | "outlined";

const VARIANT_CLASS: Record<CardVariant, string> = {
  elevated:
    "bg-[var(--md-sys-color-surface-container-low)] shadow-[var(--md-sys-elevation-level1)]",
  filled: "bg-[var(--md-sys-color-surface-container-highest)]",
  outlined: "bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)]",
};

/**
 * M3 doesn't ship a Card web component (it's a layout pattern, not a
 * component), so this is hand-built with Tailwind against M3 color/shape
 * tokens to stay visually consistent with the md-* primitives.
 */
export function Card({
  children,
  variant = "elevated",
  className = "",
  onClick,
}: {
  children: ReactNode;
  variant?: CardVariant;
  className?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-[var(--md-sys-shape-corner-medium)] ${VARIANT_CLASS[variant]} ${
        onClick
          ? "cursor-pointer transition-shadow hover:shadow-[var(--md-sys-elevation-level2)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
