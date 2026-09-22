import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";

/** Builds [1, "...", 4, 5, 6, "...", 16] style page lists — first, last, and a
 * window around the current page, collapsing any gaps into an ellipsis. */
function buildPageList(current: number, total: number): (number | "...")[] {
  const pages = Array.from({ length: total }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === total || Math.abs(p - current) <= 1,
  );
  return pages.reduce<(number | "...")[]>((acc, p, idx) => {
    if (idx > 0 && (pages[idx - 1] as number) < p - 1) acc.push("...");
    acc.push(p);
    return acc;
  }, []);
}

/**
 * Pagination bar for card lists — "Page X of Y" + first/prev/numbers/next/last
 * + a page-size dropdown, matching the DataTable pagination's visual language
 * but with the page-size control the plain card lists (CasesTable,
 * CasesListView's Imported tab) didn't have before.
 */
export function CardPagination({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [8, 16, 24],
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize: number;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const pages = buildPageList(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1">
      <span className="text-[11px] text-muted-foreground">
        Page {page} of {totalPages}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <NavButton onClick={() => onPageChange(1)} disabled={page === 1} ariaLabel="First page">
            <ChevronsLeft className="h-3.5 w-3.5" />
          </NavButton>
          <NavButton
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            ariaLabel="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </NavButton>

          {pages.map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1 text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`h-7 min-w-7 cursor-pointer rounded-lg border px-2 text-xs font-semibold transition-all ${
                  page === p
                    ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <NavButton
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            ariaLabel="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </NavButton>
          <NavButton
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
            ariaLabel="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </NavButton>
        </div>

        <div className="relative shrink-0">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 cursor-pointer appearance-none rounded-lg border border-border bg-background pl-2.5 pr-7 text-xs font-semibold text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

function NavButton({
  onClick,
  disabled,
  ariaLabel,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  ariaLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
