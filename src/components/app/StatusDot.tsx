import type { CaseStatus } from "@/types";
import { caseStatusColor } from "@/lib/statusColors";

/** Compact M3-styled status pill — deliberately lighter-weight than a full
 * md-assist-chip since this renders inline in dense table rows. */
export function StatusDot({ status }: { status: CaseStatus }) {
  const color = caseStatusColor[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}
