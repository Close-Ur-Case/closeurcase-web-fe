import { useEffect, useRef, type CSSProperties } from "react";
import type { MdOutlinedSelect } from "@material/web/select/outlined-select.js";
import { MdOutlinedSelectEl, MdSelectOptionEl } from "./elements";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Runtime shape we rely on: `open` is reactive but typed `private` upstream. */
interface SelectMenuEl extends HTMLElement {
  open: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  required,
  error,
  errorText,
  supportingText,
  className,
  style,
  ariaLabel,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorText?: string;
  supportingText?: string;
  className?: string;
  /** Escape hatch for one-off shape/size overrides, same pattern as Button/TextField. */
  style?: CSSProperties;
  ariaLabel?: string;
}) {
  const selectRef = useRef<MdOutlinedSelect | null>(null);

  useEffect(() => {
    const el = selectRef.current as unknown as SelectMenuEl | null;
    if (!el) return;

    // Timestamp of the most recent menu-open. When the menu opens, Material
    // focuses the selected option, which can make an ancestor scroll container
    // jump to reveal it — that fires a scroll event we must NOT treat as a
    // user scroll, otherwise the menu closes the instant it opens (this is what
    // made the dropdown seem to "only open downward / close on its own" when the
    // field sits low in the viewport).
    let openedAt = 0;
    const markOpening = () => {
      openedAt = Date.now();
    };

    const handleScroll = (e: Event) => {
      if (!el.open) return;
      // Ignore the auto-scroll that immediately follows opening.
      if (Date.now() - openedAt < 400) return;
      // Ignore scrolling that happens inside the menu's own option list.
      if (typeof e.composedPath === "function" && e.composedPath().includes(el)) return;
      el.open = false;
    };

    el.addEventListener("opening", markOpening);
    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    return () => {
      el.removeEventListener("opening", markOpening);
      window.removeEventListener("scroll", handleScroll, { capture: true });
    };
  }, []);

  return (
    <MdOutlinedSelectEl
      ref={selectRef}
      label={label}
      aria-label={ariaLabel || label}
      value={value}
      disabled={disabled}
      required={required}
      error={error}
      errorText={errorText}
      supportingText={supportingText}
      className={className ?? "w-full"}
      style={style}
      // "popover" hoists the menu into the top layer: it is never clipped by an
      // overflow/scroll ancestor, and Material's positioner is free to flip it
      // above the field when there isn't room below. (Falls back to "fixed" on
      // browsers without the Popover API.)
      menuPositioning="popover"
      onChange={(e) => onChange((e.target as unknown as { value: string }).value)}
    >
      {options.map((opt) => (
        <MdSelectOptionEl
          key={opt.value}
          value={opt.value}
          selected={opt.value === value}
          disabled={opt.disabled}
        >
          <div slot="headline" className="truncate">
            {opt.label}
          </div>
        </MdSelectOptionEl>
      ))}
    </MdOutlinedSelectEl>
  );
}
