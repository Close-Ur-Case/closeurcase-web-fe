/** Compact pill-shaped tab switcher — an alternative to M3's `Tabs` for
 * cases where a full-width 48px `md-tabs` bar would waste vertical space.
 * Sized to hug its content instead of stretching, so it can sit inline next
 * to a page header instead of consuming its own row. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/50 p-0.5 shadow-2xs">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
            value === opt.value
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
