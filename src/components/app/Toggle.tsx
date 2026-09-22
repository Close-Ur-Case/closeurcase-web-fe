/**
 * Compact toggle switch — a lightweight CSS-only replacement for `md-switch`.
 * Active state uses the M3 extended success green so it reads clearly as
 * "enabled" without relying on the primary navy color.
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="toggle-root"
      data-checked={checked ? "true" : "false"}
    >
      <span className="toggle-thumb" />
    </button>
  );
}
