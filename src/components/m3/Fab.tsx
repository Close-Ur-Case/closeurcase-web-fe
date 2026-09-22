import type { ReactNode, MouseEventHandler } from "react";
import { MdFabEl } from "./elements";

export function Fab({
  icon,
  label,
  size = "medium",
  variant = "primary",
  lowered,
  className,
  onClick,
  ariaLabel,
}: {
  icon: ReactNode;
  label?: string;
  size?: "medium" | "small" | "large";
  variant?: "primary" | "secondary" | "tertiary" | "surface";
  lowered?: boolean;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  ariaLabel?: string;
}) {
  return (
    <MdFabEl
      size={size}
      variant={variant}
      lowered={lowered}
      label={label}
      className={className}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span slot="icon">{icon}</span>
    </MdFabEl>
  );
}
