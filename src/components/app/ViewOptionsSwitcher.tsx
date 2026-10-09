import { LayoutGrid, TableProperties, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

export type CaseViewMode = "card" | "table" | "calendar";

export interface ViewOptionsSwitcherProps {
  viewMode: CaseViewMode;
  onChange: (mode: CaseViewMode) => void;
  className?: string;
  hideCalendar?: boolean;
  fullWidth?: boolean;
}

export function ViewOptionsSwitcher({
  viewMode,
  onChange,
  className,
  hideCalendar = false,
  fullWidth = false,
}: ViewOptionsSwitcherProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-muted/50 p-0.5 shadow-2xs",
        fullWidth && "flex w-full",
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
          "cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all",
          fullWidth && "flex-1",
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
          "cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all",
          fullWidth && "flex-1",
          viewMode === "table"
            ? "bg-primary text-primary-foreground shadow-2xs"
            : "text-muted-foreground hover:text-foreground",
        )}
        title="Data Table View"
      >
        <TableProperties className="h-3.5 w-3.5 shrink-0" />
        <span>Table</span>
      </button>

      {!hideCalendar && (
        <button
          type="button"
          onClick={() => onChange("calendar")}
          aria-pressed={viewMode === "calendar"}
          className={cn(
            "cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all",
            fullWidth && "flex-1",
            viewMode === "calendar"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground",
          )}
          title="Hearing Calender & Dairy View"
        >
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>Hearing Calender & Dairy</span>
        </button>
      )}
    </div>
  );
}
