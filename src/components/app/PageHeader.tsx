import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  actionsPosition = "inline",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  /** "below" stacks actions on their own right-aligned row under the title
   * block instead of beside it, and tightens the header's padding — used by
   * the citizen dashboard. */
  actionsPosition?: "inline" | "below";
}) {
  const titleBlock = (
    <div>
      <h1 className="text-base sm:text-xl font-bold tracking-tight text-foreground">{title}</h1>
      {description && (
        <p className="hidden sm:block text-xs text-muted-foreground leading-snug">{description}</p>
      )}
    </div>
  );

  if (actionsPosition === "below") {
    return (
      <div className="space-y-2 border-b border-border pb-1.5 sm:pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          {titleBlock}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-1.5 sm:pb-2">
      {titleBlock}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
