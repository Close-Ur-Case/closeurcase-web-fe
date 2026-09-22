import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { MoreHorizontal, ChevronUp } from "lucide-react";
import { ChipSet, FilterChip } from "@/components/m3";

const MAX_ROWS = 2;
/** h-8 w-8 dot, in px — used to check it actually fits after the last
 * visible chip instead of wrapping alone onto its own row. */
const DOT_SIZE = 32;
const CHIP_GAP = 8;
/** Matches this component's own `sm:` breakpoint — desktop shows every chip,
 * only mobile collapses the row. */
const DESKTOP_QUERY = "(min-width: 640px)";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia(DESKTOP_QUERY).matches,
  );
  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

/** A labeled filter-chip row. On mobile it caps itself at `MAX_ROWS` lines —
 * measured from a hidden copy of the *full* chip list (never the already-
 * collapsed visible one, or every re-measure would shrink it further) — and
 * a "•••" dot renders as the next chip right after the last visible one,
 * expanding the rest on click. Desktop always shows every chip, uncapped. */
export function ExpandableFilterChips({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  const isDesktop = useIsDesktop();
  const [overflowing, setOverflowing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(options.length);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    if (isDesktop) {
      setOverflowing(false);
      setVisibleCount(options.length);
      return;
    }
    const container = measureRef.current;
    if (!container) return;
    const chips = Array.from(container.querySelectorAll<HTMLElement>("md-filter-chip"));
    if (chips.length === 0) {
      setVisibleCount(options.length);
      return;
    }

    const tops = chips.map((c) => c.offsetTop);
    const rowTops = Array.from(new Set(tops)).sort((a, b) => a - b);
    if (rowTops.length <= MAX_ROWS) {
      setOverflowing(false);
      setVisibleCount(options.length);
      return;
    }

    setOverflowing(true);
    const cutoff = rowTops[MAX_ROWS];
    let count = tops.filter((t) => t < cutoff).length;

    // Shrink until the "•••" dot actually fits right after the last visible
    // chip on its row, instead of wrapping alone onto a new row by itself.
    const containerWidth = container.clientWidth;
    while (count > 0) {
      const lastChip = chips[count - 1];
      const rowTop = lastChip.offsetTop;
      let rowRight = 0;
      for (let i = 0; i < count; i++) {
        if (chips[i].offsetTop === rowTop) {
          rowRight = Math.max(rowRight, chips[i].offsetLeft + chips[i].offsetWidth);
        }
      }
      if (containerWidth - rowRight - CHIP_GAP >= DOT_SIZE) break;
      count -= 1;
    }

    setVisibleCount(count);
    // Re-measures whenever the option list itself changes. `options` is a
    // fresh array on every parent render, but its *contents* only actually
    // change when the underlying data does, so this doesn't thrash.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.join("|"), isDesktop]);

  const shown = expanded || isDesktop ? options : options.slice(0, visibleCount);

  return (
    <div className="space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}:
      </span>
      <div className="relative">
        {/* Hidden measurer — always the FULL list, laid out at the same width
            as the visible row, used only to compute where rows/the dot fall.
            Never read from the visible (possibly already-collapsed) DOM. */}
        {!isDesktop && (
          <div ref={measureRef} aria-hidden className="invisible absolute inset-x-0 top-0 -z-10">
            <ChipSet className="flex-wrap">
              {options.map((opt) => (
                <FilterChip key={opt} label={opt} style={{ maxWidth: "min(220px, 60vw)" }} />
              ))}
            </ChipSet>
          </div>
        )}

        <ChipSet className="flex-wrap">
          {shown.map((opt) => (
            <FilterChip
              key={opt}
              label={opt}
              selected={selected === opt}
              onClick={() => onSelect(opt)}
              // Material's filter chip only ellipsizes once its own box is
              // width-constrained — without this, a long label (e.g. a full
              // Petitioner Name) renders at full width instead of truncating.
              style={{ maxWidth: "min(220px, 60vw)" }}
            />
          ))}
          {overflowing && !expanded && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label={`Show more ${label.toLowerCase()} options`}
              aria-expanded={false}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </ChipSet>
      </div>
      {overflowing && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          aria-label={`Show fewer ${label.toLowerCase()} options`}
          aria-expanded={true}
          className="inline-flex cursor-pointer items-center gap-0.5 text-[11px] font-semibold text-primary hover:underline"
        >
          Show less <ChevronUp className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
