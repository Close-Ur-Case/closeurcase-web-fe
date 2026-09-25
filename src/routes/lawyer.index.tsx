import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { CasesTable } from "@/components/app/CasesTable";
import { LocationIndicator } from "@/components/app/LocationIndicator";
import { getCases, getLawyers, subscribeToStore, mergeRemoteLawyers } from "@/data/appStore";
import type { LegalCase, Lawyer } from "@/types";
import { Briefcase, Clock, CalendarClock, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/m3";
import { hasUpcomingHearing, nextHearingSortKey } from "@/components/app/caseDocketShared";
import { useAuth } from "@/context/useAuth";
import { authService } from "@/services/authService";

export const Route = createFileRoute("/lawyer/")({
  component: LawyerDashboard,
});

export function LawyerDashboard() {
  const { user } = useAuth();
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);
  const [lawyersList, setLawyersList] = useState(getLawyers);

  useEffect(() => {
    const sync = () => {
      setAllCases(getCases());
      setLawyersList(getLawyers());
    };
    return subscribeToStore(sync);
  }, []);

  useEffect(() => {
    // Re-verify lawyer profile from backend to ensure status is fresh
    if (user?.role === "lawyer" || user?.lawyerId) {
      authService.getCurrentUser().then((freshUser) => {
        if (freshUser?.lawyer) {
          mergeRemoteLawyers([freshUser.lawyer as Partial<Lawyer>]);
        }
      });
    }
  }, [user?.role, user?.lawyerId]);

  // Dynamically resolve authenticated lawyer profile
  const currentLawyerId = user?.lawyerId || user?.id;
  const currentLawyer =
    lawyersList.find(
      (l) =>
        (currentLawyerId && (l.id === currentLawyerId || l.id === user?.id)) ||
        (user?.id && l.userId === user.id) ||
        (user?.email && l.email?.toLowerCase() === user.email.toLowerCase()),
    ) || null;

  const lawyerStatus = currentLawyer?.status || user?.status || "Pending";

  // Cases assigned to current lawyer OR matching their profile
  const isLawyerCase = (c: LegalCase) => {
    if (!currentLawyerId && !currentLawyer && !user?.email) return false;
    if (currentLawyerId && (c.lawyerId === currentLawyerId || c.lawyerId === user?.id)) return true;
    if (
      currentLawyer &&
      (c.lawyerId === currentLawyer.id ||
        (currentLawyer.name &&
          typeof c.lawyerName === "string" &&
          c.lawyerName.trim().toLowerCase() === currentLawyer.name.trim().toLowerCase()))
    ) {
      return true;
    }
    return false;
  };

  const myCases = allCases.filter(isLawyerCase);
  const activeCases = myCases.filter((c) => c.status !== "Resolved" && c.status !== "Closed");
  const resolvedCases = myCases.filter((c) => c.status === "Resolved" || c.status === "Closed");

  const today = new Date().toISOString().slice(0, 10);
  const upcomingHearingCases = [...activeCases]
    .filter((c) => hasUpcomingHearing(c, today))
    .sort((a, b) => nextHearingSortKey(a).localeCompare(nextHearingSortKey(b)));

  const displayName = currentLawyer?.name ?? user?.name ?? "Advocate";

  return (
    <div className="space-y-6">
      {/* Desktop already shows this in the top app bar — mobile only, here. */}
      <div className="md:hidden">
        <LocationIndicator />
      </div>

      <PageHeader
        title={`Welcome, Adv. ${displayName}`}
        description="Review your cases and launch AI analysis tools."
      />

      {/* Verification Status Banner based on lawyers.status */}
      {lawyerStatus === "Pending" ? (
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border p-4"
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
      ) : lawyerStatus === "Approved" ? (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-emerald-700 dark:text-emerald-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="text-xs font-bold">Bar Credentials Verified & Approved</div>
              <div className="text-[11px] opacity-90 text-emerald-700/80 dark:text-emerald-300/80">
                Your advocate account is active and verified. You are visible in the legal directory and eligible to receive new case requests.
              </div>
            </div>
          </div>
          <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
            Approved
          </span>
        </div>
      ) : null}

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
