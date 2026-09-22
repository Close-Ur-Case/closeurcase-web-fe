import type { ReactNode, MouseEventHandler, CSSProperties } from "react";
import {
  MdElevatedButtonEl,
  MdFilledButtonEl,
  MdFilledTonalButtonEl,
  MdOutlinedButtonEl,
  MdTextButtonEl,
} from "./elements";

export type ButtonVariant = "filled" | "tonal" | "outlined" | "text" | "elevated";

const VARIANT_EL = {
  filled: MdFilledButtonEl,
  tonal: MdFilledTonalButtonEl,
  outlined: MdOutlinedButtonEl,
  text: MdTextButtonEl,
  elevated: MdElevatedButtonEl,
};

export function Button({
  variant = "filled",
  children,
  icon,
  className,
  disabled,
  type = "button",
  onClick,
  trailingIcon,
  id,
  ariaLabel,
  style,
}: {
  variant?: ButtonVariant;
  children: ReactNode;
  /** Leading (or trailing, with `trailingIcon`) icon — any 20px-ish icon element, e.g. a lucide-react icon. */
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLElement>;
  /** Render the icon after the label instead of before. */
  trailingIcon?: boolean;
  id?: string;
  ariaLabel?: string;
  /** Escape hatch for one-off color overrides, e.g. a destructive-action button:
   * `{ "--md-filled-button-container-color": "var(--md-sys-color-error)" }`. */
  style?: CSSProperties;
}) {
  const Comp = VARIANT_EL[variant];
  return (
    <Comp
      type={type}
      disabled={disabled}
      onClick={onClick}
      trailingIcon={trailingIcon}
      hasIcon={!!icon}
      id={id}
      className={className}
      style={style}
      aria-label={ariaLabel}
    >
      {icon && (
        <span slot="icon" className="inline-flex items-center justify-center shrink-0">
          {icon}
        </span>
      )}
      {children}
    </Comp>
  );
}
