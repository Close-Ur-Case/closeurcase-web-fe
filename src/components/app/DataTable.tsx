import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  width?: string;
  /** Hide this column when the table's own rendered width is narrow — for
   * secondary info that the primary column (e.g. title) already folds in, so
   * the table never needs its own horizontal scrollbar. Driven by a CSS
   * container query on the table's wrapper (not a viewport breakpoint) since
   * a fixed sidebar means "enough room for 5 columns" doesn't line up with
   * any single viewport width — a narrow browser window and a wide one with
   * a sidebar can leave the table the same actual pixel width. */
  hideCompact?: boolean;
}

export function DataTable<T extends { id: string }>({
  columns = [],
  rows,
  empty = "No records found.",
  pageSize = 8,
  renderCard,
}: {
  /** Required in table mode (the default); unused once `renderCard` is given. */
  columns?: Column<T>[];
  rows: T[];
  empty?: string;
  pageSize?: number;
  /** When given, rows render as cards (same pagination/empty-state) instead of a table. */
  renderCard?: (row: T) => ReactNode;
}) {
  const [page, setPage] = useState(1);

  // Reset to page 1 when rows change (e.g. after search filter)
  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return (
    <div className="space-y-3">
      {renderCard ? (
        pageRows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-xs text-muted-foreground">
            {empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {pageRows.map((row) => (
              <div key={row.id}>{renderCard(row)}</div>
            ))}
          </div>
        )
      ) : (
        <div className="@container rounded-xl border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={`px-2 py-3 font-medium whitespace-nowrap @sm:px-3 ${
                        c.hideCompact ? "hidden @5xl:table-cell" : ""
                      }`}
                      style={{ width: c.width }}
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      {empty}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-0 hover:bg-muted/60 transition-colors"
                    >
                      {columns.map((c) => (
                        <td
                          key={c.key}
                          className={`px-2 py-2.5 align-middle @sm:px-3 ${
                            c.hideCompact ? "hidden @5xl:table-cell" : ""
                          }`}
                        >
                          {c.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination — always visible */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
        <span className="text-[11px] text-muted-foreground">
          {rows.length === 0
            ? "No records"
            : `Showing ${start + 1}–${Math.min(start + pageSize, rows.length)} of ${rows.length} records`}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 transition-all"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
            .reduce<(number | "...")[]>((acc, p, idx, arr) => {
              if (idx > 0 && (arr[idx - 1] as number) < p - 1) {
                acc.push("...");
              }
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === "..." ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-xs text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`h-7 min-w-[28px] cursor-pointer rounded-lg border px-2 text-xs font-semibold transition-all ${
                    safePage === p
                      ? "border-primary bg-primary text-primary-foreground shadow-2xs"
                      : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ),
            )}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 transition-all"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
