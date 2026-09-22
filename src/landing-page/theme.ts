import type { CSSProperties } from "react";

/** Metallic gold treatment for m3 filled `Button`s across the landing page —
 * passed via `Button`'s documented `style` escape hatch rather than
 * inventing a new button component. */
export const goldButtonStyle = {
  "--md-filled-button-container-color": "transparent",
  "--md-filled-button-label-text-color": "#090d16",
  background: "linear-gradient(135deg, #e8d5a3 0%, #d4af37 38%, #b8942a 72%, #c9a84c 100%)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 14px rgba(212,175,55,0.22)",
} as CSSProperties;

/** Small gold-tinted icon-circle background, reused by every section's
 * feature/step icons. */
export const goldIconCircle = "bg-[#d4af37]/12 text-[#a9853f] ring-1 ring-[#d4af37]/20";
