import type { ReactNode, MouseEventHandler, CSSProperties } from "react";
import {
  MdFilledIconButtonEl,
  MdFilledTonalIconButtonEl,
  MdOutlinedIconButtonEl,
  MdIconButtonEl,
} from "./elements";

export type IconButtonVariant = "standard" | "filled" | "tonal" | "outlined";

const VARIANT_EL = {
  standard: MdIconButtonEl,
  filled: MdFilledIconButtonEl,
  tonal: MdFilledTonalIconButtonEl,
  outlined: MdOutlinedIconButtonEl,
};

export function IconButton({
  variant = "standard",
  children,
  className,
  disabled,
  onClick,
  toggle,
  selected,
  ariaLabel,
  title,
  id,
  tabIndex,
  style,
  type = "button",
}: {
  variant?: IconButtonVariant;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  /** Two-state toggle icon button (e.g. favorite/bookmark). */
  toggle?: boolean;
  selected?: boolean;
  ariaLabel?: string;
  title?: string;
  id?: string;
  tabIndex?: number;
  /** Escape hatch for one-off size/color overrides, e.g.
   * `{ "--md-icon-button-icon-size": "20px", "--md-icon-button-state-layer-color": "var(--md-sys-color-error)" }`. */
  style?: CSSProperties;
  /** Defaults to "button" — without this, the underlying native <button>
   * defaults to type="submit" and silently submits any enclosing <form>
   * (e.g. a password-visibility toggle next to a login field). */
  type?: "button" | "submit" | "reset";
}) {
  const Comp = VARIANT_EL[variant];
  return (
    <Comp
      type={type}
      disabled={disabled}
      onClick={onClick}
      toggle={toggle}
      selected={selected}
      className={className}
      id={id}
      aria-label={ariaLabel || title}
      title={title}
      tabIndex={tabIndex}
      style={style}
    >
      {children}
    </Comp>
  );
}
