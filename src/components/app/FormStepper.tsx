import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormStep {
  /** 1-based step number, also used as the React key. */
  id: number;
  label: string;
}

/**
 * Horizontal numbered step indicator for multi-step forms.
 *
 * Layout contract: this must never widen its parent. It is a
 * `repeat(N, minmax(0, 1fr))` grid, so every step occupies an equal share of
 * whatever width is available and nothing has an intrinsic minimum that could
 * push the column wider. The `minmax(0, …)` (rather than the default
 * `minmax(auto, …)`) is what allows columns to shrink below their content
 * width; labels then wrap to a second line instead of overflowing.
 *
 * Desktop-only by design: callers render this alongside a `lg:hidden`
 * continuous form, so the stepper itself carries no mobile styling.
 * Completed steps are clickable so users can jump back to review earlier
 * answers; steps ahead of the furthest-reached one are not, since their
 * fields may depend on inputs not yet supplied.
 */
export function FormStepper({
  steps,
  current,
  furthest,
  onStepClick,
  ariaLabel = "Registration progress",
}: {
  steps: FormStep[];
  /** Currently displayed step id. */
  current: number;
  /** Highest step reached so far — anything up to this is navigable. */
  furthest: number;
  onStepClick: (id: number) => void;
  /** Accessible name for the stepper nav; defaults to the registration-wizard
   * wording since that was this component's first caller. */
  ariaLabel?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className="mb-5 w-full min-w-0">
      <ol
        className="grid w-full min-w-0"
        style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
      >
        {steps.map((step, i) => {
          const isDone = step.id < current;
          const isCurrent = step.id === current;
          const canVisit = step.id <= furthest;
          const isLast = i === steps.length - 1;

          return (
            <li key={step.id} className="relative flex min-w-0 flex-col items-center">
              {/* Connector runs from this step's circle to the next one's.
                  It is positioned inside the column and clipped by the grid,
                  so it can never extend past the stepper's own width. */}
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-1/2 top-3.5 h-px w-full -translate-y-1/2",
                    isDone ? "bg-primary/40" : "bg-border",
                  )}
                />
              )}

              <button
                type="button"
                onClick={() => canVisit && onStepClick(step.id)}
                disabled={!canVisit}
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "group relative z-10 flex w-full min-w-0 flex-col items-center gap-1.5 px-1",
                  canVisit ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition-colors",
                    isCurrent && "border-primary bg-primary text-primary-foreground",
                    isDone && "border-primary bg-primary/10 text-primary",
                    !isCurrent && !isDone && "border-border bg-surface text-muted-foreground",
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : step.id}
                </span>
                {/* Wraps to a second line rather than forcing the column wider. */}
                <span
                  className={cn(
                    "w-full min-w-0 text-center text-[11px] font-semibold leading-tight transition-colors xl:text-xs",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                    canVisit && !isCurrent && "group-hover:text-foreground",
                  )}
                >
                  {step.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
