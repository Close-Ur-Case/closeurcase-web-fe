import { MdRadioEl } from "./elements";

export function Radio({
  checked,
  onChange,
  name,
  value,
  disabled,
  className,
  ariaLabel,
}: {
  checked: boolean;
  onChange: () => void;
  name: string;
  value: string;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <MdRadioEl
      checked={checked}
      name={name}
      value={value}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      onChange={(e) => {
        if ((e.target as unknown as { checked: boolean }).checked) onChange();
      }}
    />
  );
}
