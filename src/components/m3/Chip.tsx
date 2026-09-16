import type { ReactNode, MouseEventHandler, CSSProperties } from "react";
import {
  MdAssistChipEl,
  MdFilterChipEl,
  MdInputChipEl,
  MdSuggestionChipEl,
  MdChipSetEl,
} from "./elements";

export function ChipSet({ children, className }: { children: ReactNode; className?: string }) {
  return <MdChipSetEl className={className}>{children}</MdChipSetEl>;
}

/** Static, non-interactive-selection chip — e.g. an action shortcut. */
export function AssistChip({
  label,
  icon,
  elevated,
  disabled,
  onClick,
  className,
  style,
}: {
  label: string;
  icon?: ReactNode;
  elevated?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  /** Escape hatch for one-off color overrides, e.g. `{ "--md-assist-chip-label-text-color": "var(--md-sys-color-error)" }`. */
  style?: CSSProperties;
}) {
  return (
    <MdAssistChipEl
      label={label}
      elevated={elevated}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={style}
    >
      {icon && (
        <span slot="icon" className="inline-flex items-center justify-center shrink-0">
          {icon}
        </span>
      )}
    </MdAssistChipEl>
  );
}

/** Toggleable chip — used for filters and, in this app, status/category pills. */
export function FilterChip({
  label,
  icon,
  selected,
  disabled,
  onClick,
  className,
  style,
}: {
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  /** Escape hatch for one-off sizing, e.g. a denser filter row:
   * `{ "--md-filter-chip-container-height": "26px" }`. */
  style?: CSSProperties;
}) {
  return (
    <MdFilterChipEl
      label={label}
      selected={selected}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={style}
    >
      {icon && (
        <span slot="icon" className="inline-flex items-center justify-center shrink-0">
          {icon}
        </span>
      )}
    </MdFilterChipEl>
  );
}

export function InputChip({
  label,
  icon,
  selected,
  disabled,
  onRemove,
  onClick,
  className,
}: {
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  disabled?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <MdInputChipEl
      label={label}
      selected={selected}
      disabled={disabled}
      onRemove={onRemove}
      onClick={onClick}
      className={className}
    >
      {icon && (
        <span slot="icon" className="inline-flex items-center justify-center shrink-0">
          {icon}
        </span>
      )}
    </MdInputChipEl>
  );
}

export function SuggestionChip({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
}) {
  return <MdSuggestionChipEl label={label} onClick={onClick} className={className} />;
}
