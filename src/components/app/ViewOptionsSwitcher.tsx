import { LayoutGrid, TableProperties, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export type CaseViewMode = "card" | "table" | "calendar";

export interface ViewOptionsSwitcherProps {
  viewMode: CaseViewMode;
  onChange: (mode: CaseViewMode) => void;
  className?: string;
}

export function ViewOptionsSwitcher({
  viewMode,
  onChange,
  className,
}: ViewOptionsSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/50 p-0.5 shadow-2xs",
        className,
      )}
      role="group"
      aria-label="View options"
    >
      <button
        type="button"
        onClick={() => onChange("card")}
        aria-pressed={viewMode === "card"}
        className={cn(
          "cursor-pointer flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all",
          viewMode === "card"
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Card Grid View"
      >
        <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
        <span>Card</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("table")}
        aria-pressed={viewMode === "table"}
        className={cn(
          "cursor-pointer flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all",
          viewMode === "table"
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Data Table View"
      >
        <TableProperties className="h-3.5 w-3.5 shrink-0" />
        <span>Table</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("calendar")}
        aria-pressed={viewMode === "calendar"}
        className={cn(
          "cursor-pointer flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all",
          viewMode === "calendar"
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Monthly Calendar View"
      >
        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
        <span>Calendar</span>
      </button>
    </div>
  );
}
