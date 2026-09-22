import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { CasesTable } from "@/components/app/CasesTable";
import { LocationIndicator } from "@/components/app/LocationIndicator";
import { getCases, getLawyers, subscribeToStore } from "@/data/appStore";
import type { LegalCase } from "@/types";
import { Briefcase, Clock, CalendarClock, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/m3";
import { hasUpcomingHearing, nextHearingSortKey } from "@/components/app/caseDocketShared";

export const Route = createFileRoute("/lawyer/")({
  component: LawyerDashboard,
});

export function LawyerDashboard() {
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);
  const [lawyersList, setLawyersList] = useState(getLawyers);

  useEffect(() => {
    const sync = () => {
      setAllCases(getCases());
      setLawyersList(getLawyers());
    };
    return subscribeToStore(sync);
  }, []);

  // Demo lawyer profile: Swathi Reddy (l_001)
  const currentLawyer = lawyersList.find((l) => l.id === "l_001") || lawyersList[0];

  // Cases assigned to Swathi OR unassigned cases in her category
  const myCases = allCases.filter(
    (c) => c.lawyerId === "l_001" || c.lawyerName === currentLawyer?.name,
  );
  const activeCases = myCases.filter((c) => c.status !== "Resolved" && c.status !== "Closed");
  const resolvedCases = myCases.filter((c) => c.status === "Resolved" || c.status === "Closed");

  const today = new Date().toISOString().slice(0, 10);
  const upcomingHearingCases = [...activeCases]
    .filter((c) => hasUpcomingHearing(c, today))
    .sort((a, b) => nextHearingSortKey(a).localeCompare(nextHearingSortKey(b)));

  return (
    <div className="space-y-6">
      {/* Desktop already shows this in the top app bar — mobile only, here. */}
      <div className="md:hidden">
        <LocationIndicator />
      </div>

      <PageHeader
        title={`Welcome, Adv. ${currentLawyer?.name ?? "Swathi"}`}
        description="Review your cases and launch AI analysis tools."
      />

      {/* Verification Status Banner if Pending */}
      {currentLawyer?.status === "Pending" && (
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border p-4"
          style={{
            borderColor: "color-mix(in srgb, var(--md-extended-color-warning) 30%, transparent)",
            backgroundColor: "color-mix(in srgb, var(--md-extended-color-warning) 8%, transparent)",
            color: "var(--md-extended-color-warning)",
          }}
        >
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0" />
            <div>
              <div className="text-xs font-bold">Verification Pending Admin Approval</div>
              <div className="text-[11px] opacity-90">
                Your bar credentials are currently under review. AI analysis tools remain active.
              </div>
            </div>
          </div>
          <span
            className="rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--md-extended-color-warning) 20%, transparent)",
            }}
          >
            Pending
          </span>
        </div>
      )}

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--md-sys-shape-corner-medium)] bg-primary/10 text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-foreground leading-none">
              {myCases.length}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Assigned
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--md-sys-shape-corner-medium)]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--md-extended-color-warning) 15%, transparent)",
              color: "var(--md-extended-color-warning)",
            }}
          >
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-foreground leading-none">
              {activeCases.length}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--md-sys-shape-corner-medium)] bg-primary/10 text-primary">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-foreground leading-none">
              {upcomingHearingCases.length}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Upcoming Hearings
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--md-sys-shape-corner-medium)]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--md-extended-color-success) 15%, transparent)",
              color: "var(--md-extended-color-success)",
            }}
          >
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold text-foreground leading-none">
              {resolvedCases.length}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Resolved
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming Hearings — pending cases only, soonest hearing first */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Upcoming Hearings</h3>
            <p className="text-xs text-muted-foreground">Active matters, soonest hearing first.</p>
          </div>
          <Link
            to="/lawyer/cases"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {upcomingHearingCases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-xs text-muted-foreground">
            No cases with upcoming hearings.
          </div>
        ) : (
          <CasesTable cases={upcomingHearingCases} role="lawyer" />
        )}
      </div>
    </div>
  );
}
