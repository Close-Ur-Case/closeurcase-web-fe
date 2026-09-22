import type { ReactNode, KeyboardEventHandler, CSSProperties, Ref } from "react";
import { MdOutlinedTextFieldEl } from "./elements";
import type { MdOutlinedTextField } from "@material/web/textfield/outlined-text-field.js";

export type TextFieldType =
  "email" | "number" | "password" | "search" | "tel" | "text" | "url" | "textarea";

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  required,
  error,
  errorText,
  supportingText,
  rows,
  maxLength,
  name,
  leadingIcon,
  trailingIcon,
  prefixText,
  suffixText,
  className,
  autoFocus,
  onKeyDown,
  style,
  ref,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: TextFieldType;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorText?: string;
  supportingText?: string;
  rows?: number;
  maxLength?: number;
  name?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  /** Non-editable text rendered inline before/after the value, e.g. a "+91"
   * country-code or a "kg" unit — native md-outlined-text-field feature,
   * distinct from `leadingIcon`/`trailingIcon` (which are icon slots, not
   * text, and don't reflow the floating label to make room for wide content). */
  prefixText?: string;
  suffixText?: string;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  /** Escape hatch for one-off shape/color overrides, e.g.
   * `{ "--md-outlined-text-field-container-shape": "9999px" }`. */
  style?: CSSProperties;
  /** Forwarded to the underlying md-outlined-text-field element (has its own
   * `.focus()`), for imperative-focus use cases. React 19 passes `ref` as a
   * plain prop, no `forwardRef` wrapper needed. */
  ref?: Ref<MdOutlinedTextField>;
}) {
  return (
    <MdOutlinedTextFieldEl
      ref={ref}
      label={label}
      value={value}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      error={error}
      errorText={errorText}
      supportingText={supportingText}
      rows={rows}
      maxLength={maxLength}
      name={name}
      prefixText={prefixText}
      suffixText={suffixText}
      className={className}
      autoFocus={autoFocus}
      style={style}
      onInput={(e) => onChange((e.target as HTMLInputElement).value)}
      onKeyDown={onKeyDown}
    >
      {leadingIcon && <span slot="leading-icon">{leadingIcon}</span>}
      {trailingIcon && <span slot="trailing-icon">{trailingIcon}</span>}
    </MdOutlinedTextFieldEl>
  );
}
