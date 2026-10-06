import type { CaseStatus, Lawyer } from "@/types";

/** Canonical CaseStatus → M3 token color. Single source of truth for every
 * place that colors a case status (StatusDot, CasesTable's roadmap timeline,
 * the admin dashboard's status charts) — previously reimplemented 3x with
 * inconsistent raw hex values. */
export const caseStatusColor: Record<CaseStatus, string> = {
  Pending: "var(--md-extended-color-warning)",
  Submitted: "var(--md-sys-color-on-surface-variant)",
  Assigned: "var(--md-sys-color-primary)",
  Rejected: "var(--md-sys-color-error)",
  "Under Review": "var(--md-extended-color-warning)",
  "In Progress": "var(--md-sys-color-primary)",
  "Awaiting Documents": "var(--md-extended-color-warning)",
  Resolved: "var(--md-extended-color-success)",
  "CNR Generated": "var(--md-extended-color-success)",
  Closed: "var(--md-sys-color-on-surface-variant)",
};

/** Canonical Lawyer["status"] → M3 token color, mirroring caseStatusColor. */
export const lawyerStatusColor: Record<Lawyer["status"], string> = {
  Approved: "var(--md-extended-color-success)",
  Pending: "var(--md-extended-color-warning)",
  Suspended: "var(--md-sys-color-on-surface-variant)",
  Rejected: "var(--md-sys-color-error)",
};

/** Display-level presence of a lawyer, shown as a dot / badge on their avatar
 * everywhere. `suspended` is admin-driven (`status`) and always wins over the
 * lawyer's own online/offline choice. */
export type LawyerPresence = "online" | "offline" | "suspended";

export function lawyerPresence(
  lawyer: Pick<Lawyer, "status" | "availabilityStatus">,
): LawyerPresence {
  if (lawyer.status === "Suspended") return "suspended";
  return lawyer.availabilityStatus === "Offline" ? "offline" : "online";
}

/** online = green, offline = red, suspended = red (paired with an X mark). */
export const lawyerPresenceColor: Record<LawyerPresence, string> = {
  online: "var(--md-extended-color-success)",
  offline: "var(--md-sys-color-error)",
  suspended: "var(--md-sys-color-error)",
};

export const lawyerPresenceLabel: Record<LawyerPresence, string> = {
  online: "Online",
  offline: "Offline",
  suspended: "Suspended",
};

/** Fixed 8-swatch categorical palette for open-ended chart series (case
 * categories, registration trend lines) that don't map to a fixed status
 * enum, so caseStatusColor/lawyerStatusColor don't apply. Centralized here
 * instead of scattered raw hex per chart, and pulled from CSS custom
 * properties (styles.css) rather than literal Tailwind color names. */
export const CHART_PALETTE = [
  "var(--md-chart-1)",
  "var(--md-chart-2)",
  "var(--md-chart-3)",
  "var(--md-chart-4)",
  "var(--md-chart-5)",
  "var(--md-chart-6)",
  "var(--md-chart-7)",
  "var(--md-chart-8)",
] as const;
