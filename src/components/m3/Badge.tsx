/**
 * M3 badge — a small dot or count marker overlaid on another element (e.g.
 * an icon button). @material/web only ships this in `labs` (unstable), so
 * it's hand-built here against the same color tokens.
 */
export function Badge({ count, className = "" }: { count?: number; className?: string }) {
  if (count === undefined) {
    return (
      <span
        className={`absolute right-1 top-1 h-2 w-2 rounded-full bg-[var(--md-sys-color-error)] ${className}`}
      />
    );
  }
  if (count <= 0) return null;
  return (
    <span
      className={`absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--md-sys-color-error)] px-1 text-[10px] font-medium leading-none text-[var(--md-sys-color-on-error)] ${className}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
