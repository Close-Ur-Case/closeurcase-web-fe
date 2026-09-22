import { MdCheckboxEl } from "./elements";

export function Checkbox({
  checked,
  onChange,
  indeterminate,
  disabled,
  required,
  className,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <MdCheckboxEl
      checked={checked}
      indeterminate={indeterminate}
      disabled={disabled}
      required={required}
      className={className}
      aria-label={ariaLabel}
      onChange={(e) => onChange((e.target as unknown as { checked: boolean }).checked)}
    />
  );
}
