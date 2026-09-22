import { useState } from "react";
import { ChevronDown, ListFilter } from "lucide-react";
import { Button, Checkbox } from "@/components/m3";

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterSection {
  key: string;
  label: string;
  options: FilterOption[];
}

/**
 * "Filter" button + popover panel with collapsible, checkbox-driven sections
 * (e.g. Location, Category, Status) — an e-commerce-style faceted filter,
 * multi-select within each section, AND'd across sections.
 */
export function FilterPanelButton({
  sections,
  selected,
  onChange,
}: {
  sections: FilterSection[];
  selected: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(sections.map((s) => [s.key, true])),
  );

  const activeCount = Object.values(selected).reduce((n, arr) => n + arr.length, 0);

  const toggleValue = (sectionKey: string, value: string) => {
    const current = selected[sectionKey] ?? [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange({ ...selected, [sectionKey]: next });
  };

  return (
    <div className="relative">
      <Button
        variant="outlined"
        icon={<ListFilter className="h-4 w-4" />}
        onClick={() => setOpen((o) => !o)}
      >
        Filter{activeCount > 0 ? ` (${activeCount})` : ""}
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 max-h-[70vh] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Filters
              </span>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({})}
                  className="cursor-pointer text-[11px] font-bold text-primary hover:underline"
                >
                  Clear All
                </button>
              )}
            </div>
            {sections.map((section) => (
              <div key={section.key} className="border-b border-border/60 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpanded((e) => ({ ...e, [section.key]: !e[section.key] }))}
                  className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-xs font-bold text-foreground"
                >
                  {section.label}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${expanded[section.key] ? "rotate-180" : ""}`}
                  />
                </button>
                {expanded[section.key] && (
                  <div className="space-y-0.5 px-4 pb-3">
                    {section.options.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-xs hover:bg-muted/60"
                      >
                        <span className="flex items-center gap-2">
                          <Checkbox
                            checked={(selected[section.key] ?? []).includes(opt.value)}
                            onChange={() => toggleValue(section.key, opt.value)}
                          />
                          <span className="text-foreground">{opt.label}</span>
                        </span>
                        <span className="text-muted-foreground">({opt.count})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
