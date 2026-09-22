import { MdLinearProgressEl, MdCircularProgressEl } from "./elements";

export function LinearProgress({
  value,
  indeterminate,
  className,
  ariaLabel,
}: {
  /** 0–1. Omit and pass `indeterminate` for an unknown-duration progress bar. */
  value?: number;
  indeterminate?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <MdLinearProgressEl
      value={value}
      indeterminate={indeterminate}
      className={className}
      aria-label={ariaLabel}
    />
  );
}

export function CircularProgress({
  value,
  indeterminate,
  className,
  ariaLabel,
}: {
  value?: number;
  indeterminate?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <MdCircularProgressEl
      value={value}
      indeterminate={indeterminate}
      className={className}
      aria-label={ariaLabel}
    />
  );
}
