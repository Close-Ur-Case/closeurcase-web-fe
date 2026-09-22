export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[var(--md-sys-shape-corner-small)] bg-[var(--md-sys-color-surface-container-highest)] ${className}`}
    />
  );
}
