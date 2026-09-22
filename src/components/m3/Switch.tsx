import { MdSwitchEl } from "./elements";

export function Switch({
  selected,
  onChange,
  disabled,
  className,
  ariaLabel,
}: {
  selected: boolean;
  onChange: (selected: boolean) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <MdSwitchEl
      selected={selected}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      onChange={(e) => onChange((e.target as unknown as { selected: boolean }).selected)}
    />
  );
}
