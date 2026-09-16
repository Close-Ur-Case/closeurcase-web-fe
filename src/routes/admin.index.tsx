import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { getCases, getLawyers, getCitizens, subscribeToStore, getActiveCaseCategories } from "@/data/appStore";
import type { Citizen, Lawyer } from "@/types";
import {
  Users,
  UserCheck,
  Briefcase,
  ShieldCheck,
  LineChart,
  BarChart3,
  PieChart,
  Scale,
  Siren,
  Bell,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/m3";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Super Admin Dashboard — CloseUrCase" }] }),
  component: AdminDashboard,
});

const NATIVE_DATE_INPUT_CLS =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary";

const todayIso = () => new Date().toISOString().slice(0, 10);

const daysAgoIso = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

/* ── Minimal SVG Donut/Pie chart helper (moved in from the former Reports page) ── */
interface PieSlice {
  label: string;
  value: number;
  color: string;
}

function DonutChart({ slices, size = 140 }: { slices: PieSlice[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 44;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let cumulativePercent = 0;
  const segments = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const percent = s.value / total;
      const offset = circumference * (1 - cumulativePercent);
      const dashArray = `${percent * circumference} ${circumference}`;
      cumulativePercent += percent;
      return { ...s, dashArray, offset };
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="18" stroke="var(--color-muted)" />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth="18"
          stroke={seg.color}
          strokeDasharray={seg.dashArray}
          strokeDashoffset={seg.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="butt"
          className="transition-all duration-700"
        />
      ))}
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="var(--color-foreground)"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 11}
        textAnchor="middle"
        fontSize="7.5"
        fill="var(--color-muted-foreground)"
      >
        TOTAL
      </text>
    </svg>
  );
}

const PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
];

/* ── Daily registrations (citizens + lawyers) line chart ────────────────── */
interface DailyRegPoint {
  date: string;
  label: string;
  citizens: number;
  lawyers: number;
}

function buildDailyRegistrations(
  lawyers: Lawyer[],
  citizens: Citizen[],
  from: string,
  to: string,
): DailyRegPoint[] {
  const days: DailyRegPoint[] = [];
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    days.push({
      date: iso,
      label,
      citizens: citizens.filter((c) => c.joinedAt === iso).length,
      lawyers: lawyers.filter((l) => l.joinedAt === iso).length,
    });
  }
  return days;
}

function getBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function getAreaPath(points: { x: number; y: number }[], bottomY: number): string {
  if (points.length === 0) return "";
  const lineD = getBezierPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${lineD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
}

function DailyRegistrationsChart({ data }: { data: DailyRegPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showCitizens, setShowCitizens] = useState(true);
  const [showLawyers, setShowLawyers] = useState(true);

  const viewBoxW = 1000;
  const viewBoxH = 240;
  const padding = { top: 25, right: 35, bottom: 35, left: 45 };
  const plotW = viewBoxW - padding.left - padding.right;
  const plotH = viewBoxH - padding.top - padding.bottom;

  const rawMax = Math.max(1, ...data.map((d) => Math.max(d.citizens, d.lawyers)));
  const maxVal = Math.ceil(rawMax * 1.25) || 4;

  const xFor = (i: number) =>
    padding.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yFor = (v: number) => padding.top + plotH - (v / maxVal) * plotH;

  const citizenPoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.citizens) }));
  const lawyerPoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.lawyers) }));

  const bottomY = padding.top + plotH;

  // Past ~45 days, per-day dots overlap into a solid smear along the
  // baseline — past that point just show the smooth wave line/area and
  // reserve dots for the single hovered day.
  const showAllDots = data.length <= 45;

  // Grid steps (4 horizontal lines)
  const gridSteps = [0, 0.33, 0.66, 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * viewBoxW;
    let closestIdx = 0;
    let minDiff = Infinity;
    data.forEach((_, i) => {
      const diff = Math.abs(xFor(i) - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    setHoverIndex(closestIdx);
  };

  const activePoint = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="space-y-4 w-full">
      {/* Legend & Toggle Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold px-1">
        <div className="text-muted-foreground text-[11px] flex items-center gap-2">
          {activePoint ? (
            <span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-2.5 py-1 text-primary font-bold">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {activePoint.label} ({activePoint.citizens} Citizens, {activePoint.lawyers} Lawyers)
            </span>
          ) : (
            <span className="text-muted-foreground">Hover over any data node to inspect daily metrics</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCitizens((v) => !v || !showLawyers)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
              showCitizens
                ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                : "border-border/60 bg-muted/40 text-muted-foreground opacity-50"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shadow-xs" />
            Citizens ({data.reduce((a, b) => a + b.citizens, 0)})
          </button>
          <button
            type="button"
            onClick={() => setShowLawyers((v) => !v || !showCitizens)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer shadow-2xs ${
              showLawyers
                ? "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "border-border/60 bg-muted/40 text-muted-foreground opacity-50"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-xs" />
            Lawyers ({data.reduce((a, b) => a + b.lawyers, 0)})
          </button>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full rounded-2xl border border-border/80 bg-gradient-to-b from-surface via-background/60 to-surface/80 p-3 sm:p-4 shadow-sm">
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          className="w-full h-auto min-h-[220px] sm:min-h-[250px] cursor-crosshair select-none overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {/* Citizen Blue Fill Gradient */}
            <linearGradient id="citizenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>

            {/* Lawyer Rose Fill Gradient */}
            <linearGradient id="lawyerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>

            {/* Glow Filters for Lines */}
            <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Y-Axis line and X-Axis line */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={bottomY}
            stroke="var(--color-border)"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={bottomY}
            x2={viewBoxW - padding.right}
            y2={bottomY}
            stroke="var(--color-border)"
            strokeWidth="1.5"
          />

          {/* Horizontal Gridlines & Y-axis labels */}
          {gridSteps.map((step) => {
            const y = padding.top + plotH * (1 - step);
            const val = Math.round(maxVal * step);
            return (
              <g key={step}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={viewBoxW - padding.right}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray="6 6"
                  strokeOpacity="0.5"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontFamily="mono"
                  fontWeight="600"
                  fill="var(--color-muted-foreground)"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Citizens Area, Line & Dots */}
          {showCitizens && (
            <g className="transition-all duration-300">
              <path d={getAreaPath(citizenPoints, bottomY)} fill="url(#citizenGradient)" />
              <path
                d={getBezierPath(citizenPoints)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow-blue)"
              />
              {citizenPoints.map((p, i) => {
                if (!showAllDots && hoverIndex !== i) return null;
                return (
                  <g key={i}>
                    {hoverIndex === i && (
                      <circle cx={p.x} cy={p.y} r="10" fill="#3b82f6" fillOpacity="0.25" />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoverIndex === i ? 6 : 4.5}
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="transition-all cursor-pointer"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Lawyers Area, Line & Dots */}
          {showLawyers && (
            <g className="transition-all duration-300">
              <path d={getAreaPath(lawyerPoints, bottomY)} fill="url(#lawyerGradient)" />
              <path
                d={getBezierPath(lawyerPoints)}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow-rose)"
              />
              {lawyerPoints.map((p, i) => {
                if (!showAllDots && hoverIndex !== i) return null;
                return (
                  <g key={i}>
                    {hoverIndex === i && (
                      <circle cx={p.x} cy={p.y} r="10" fill="#f43f5e" fillOpacity="0.25" />
                    )}
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoverIndex === i ? 6 : 4.5}
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="transition-all cursor-pointer"
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* X Axis Labels (dates) — thinned out for long ranges to avoid overlap */}
          {(() => {
            const labelStep = Math.max(1, Math.ceil(data.length / 10));
            return data.map((d, i) => {
              if (i % labelStep !== 0 && i !== data.length - 1) return null;
              const x = xFor(i);
              const isHovered = hoverIndex === i;
              return (
                <g key={d.date}>
                  <text
                    x={x}
                    y={viewBoxH - 8}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight={isHovered ? "800" : "600"}
                    fill={isHovered ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
                    className="transition-colors"
                  >
                    {d.label}
                  </text>
                </g>
              );
            });
          })()}

          {/* Hover Crosshair Guideline */}
          {hoverIndex !== null && (
            <line
              x1={xFor(hoverIndex)}
              y1={padding.top}
              x2={xFor(hoverIndex)}
              y2={bottomY}
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeDasharray="4 4"
              strokeOpacity="0.75"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Floating Tooltip Card on Hover */}
        {hoverIndex !== null && activePoint && (
          <div
            className="pointer-events-none absolute z-30 transform -translate-x-1/2 rounded-2xl border border-primary/30 bg-surface/95 p-3.5 shadow-xl backdrop-blur-xl transition-all duration-150 text-xs space-y-2 min-w-44"
            style={{
              left: `${(xFor(hoverIndex) / viewBoxW) * 100}%`,
              top: "12px",
            }}
          >
            <div className="border-b border-border/60 pb-1.5 text-xs font-extrabold text-foreground flex items-center justify-between gap-2">
              <span>{activePoint.label}</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Registration Metric
              </span>
            </div>
            {showCitizens && (
              <div className="flex items-center justify-between gap-3 text-blue-600 dark:text-blue-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Citizens:
                </span>
                <span className="font-bold font-mono text-sm">{activePoint.citizens}</span>
              </div>
            )}
            {showLawyers && (
              <div className="flex items-center justify-between gap-3 text-rose-600 dark:text-rose-400">
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                  Lawyers:
                </span>
                <span className="font-bold font-mono text-sm">{activePoint.lawyers}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [casesList, setCasesList] = useState(getCases);
  const [lawyersList, setLawyersList] = useState(getLawyers);
  const [citizensList, setCitizensList] = useState(getCitizens);
  const [managedCategories, setManagedCategories] = useState(() => getActiveCaseCategories());

  useEffect(() => {
    const sync = () => {
      setCasesList(getCases());
      setLawyersList(getLawyers());
      setCitizensList(getCitizens());
      setManagedCategories(getActiveCaseCategories());
    };
    return subscribeToStore(sync);
  }, []);

  const pendingLawyers = lawyersList.filter((l) => l.status === "Pending");
  const approvedLawyers = lawyersList.filter((l) => l.status === "Approved");
  const openCases = casesList.filter((c) => c.status !== "Resolved" && c.status !== "Closed");
  const unassignedEmergencyCases = casesList.filter((c) => c.isEmergency && !c.lawyerId);

  const [regFrom, setRegFrom] = useState(daysAgoIso(6));
  const [regTo, setRegTo] = useState(todayIso());

  const dailyRegData = useMemo(
    () => buildDailyRegistrations(lawyersList, citizensList, regFrom, regTo),
    [lawyersList, citizensList, regFrom, regTo],
  );

  const totalCases = casesList.length;
  const totalLawyers = lawyersList.length;

  const categoryStats = managedCategories
    .map((cat, i) => {
      const count = casesList.filter((x) => x.category === cat.name).length;
      const lawyerCount = lawyersList.filter((x) => x.category === cat.name).length;
      const percentage = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
      return { category: cat.name, count, lawyerCount, percentage, color: PALETTE[i % PALETTE.length] };
    })
    .sort((a, b) => b.count - a.count);

  const statusData = [
    { status: "Submitted", color: "#3b82f6" },
    { status: "Assigned", color: "#6366f1" },
    { status: "Under Review", color: "#8b5cf6" },
    { status: "In Progress", color: "#f59e0b" },
    { status: "Awaiting Documents", color: "#ef4444" },
    { status: "Resolved", color: "#10b981" },
  ].map((d) => ({
    ...d,
    count: casesList.filter((c) => c.status === d.status).length,
    percentage:
      totalCases > 0
        ? Math.round((casesList.filter((c) => c.status === d.status).length / totalCases) * 100)
        : 0,
  }));

  const LawyerstatusSlices: PieSlice[] = [
    { label: "Approved", value: approvedLawyers.length, color: "#10b981" },
    { label: "Pending", value: pendingLawyers.length, color: "#f59e0b" },
    {
      label: "Suspended",
      value: lawyersList.filter((l) => l.status === "Suspended").length,
      color: "#6b7280",
    },
    {
      label: "Rejected",
      value: lawyersList.filter((l) => l.status === "Rejected").length,
      color: "#ef4444",
    },
  ];

  const categoryPieSlices: PieSlice[] = categoryStats
    .filter((c) => c.count > 0)
    .map((c) => ({ label: c.category, value: c.count, color: c.color }));

  const statusPieSlices: PieSlice[] = statusData
    .filter((s) => s.count > 0)
    .map((s) => ({ label: s.status, value: s.count, color: s.color }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Control Panel"
        description="Full administrative control over knowledge base indexing, Lawyer verification, user management, and case assignments."
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card variant="outlined" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Citizens
            </span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{citizensList.length}</div>
        </Card>

        <Card variant="outlined" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Verified Lawyers
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {approvedLawyers.length}
          </div>
        </Card>

        <Card variant="outlined" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pending Approval
            </span>
            <ShieldCheck
              className="h-4 w-4"
              style={{ color: "var(--md-extended-color-warning)" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-extrabold text-foreground">{pendingLawyers.length}</span>
            {pendingLawyers.length > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold animate-pulse"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--md-extended-color-warning) 15%, transparent)",
                  color: "var(--md-extended-color-warning)",
                }}
              >
                Action Req.
              </span>
            )}
          </div>
        </Card>

        <Card variant="outlined" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Open Cases
            </span>
            <Briefcase className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{openCases.length}</div>
        </Card>
      </div>

      {/* New Registrations */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">New Registrations</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">From</span>
              <input
                type="date"
                value={regFrom}
                max={regTo}
                onChange={(e) => setRegFrom(e.target.value)}
                className={NATIVE_DATE_INPUT_CLS}
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">To</span>
              <input
                type="date"
                value={regTo}
                min={regFrom}
                max={todayIso()}
                onChange={(e) => setRegTo(e.target.value)}
                className={NATIVE_DATE_INPUT_CLS}
              />
            </label>
          </div>
        </div>
        <DailyRegistrationsChart data={dailyRegData} />
      </div>

      {/* NEEDS ATTENTION — real actionable items, no invented data */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Siren className="h-4 w-4 text-red-600" />
              <h3 className="text-sm font-bold text-foreground">Unassigned Emergency Cases</h3>
            </div>
            {unassignedEmergencyCases.length > 0 && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                {unassignedEmergencyCases.length}
              </span>
            )}
          </div>
          {unassignedEmergencyCases.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No emergency cases awaiting assignment.
            </p>
          ) : (
            <div className="space-y-2">
              {unassignedEmergencyCases.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  to="/admin/cases"
                  className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs transition-colors hover:bg-red-100"
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold text-foreground">
                      {c.title || "Untitled Matter"}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.id} · {c.citizenName}
                    </div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-red-600" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" style={{ color: "var(--md-extended-color-warning)" }} />
              <h3 className="text-sm font-bold text-foreground">Pending Lawyer Approvals</h3>
            </div>
            {pendingLawyers.length > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: "var(--md-extended-color-warning)" }}
              >
                {pendingLawyers.length}
              </span>
            )}
          </div>
          {pendingLawyers.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No pending lawyer approvals.
            </p>
          ) : (
            <div className="space-y-2">
              {pendingLawyers.slice(0, 5).map((l) => (
                <Link
                  key={l.id}
                  to="/admin/lawyers"
                  className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-xs transition-colors hover:bg-black/3"
                  style={{
                    borderColor:
                      "color-mix(in srgb, var(--md-extended-color-warning) 30%, transparent)",
                    backgroundColor:
                      "color-mix(in srgb, var(--md-extended-color-warning) 6%, transparent)",
                  }}
                >
                  <div className="min-w-0">
                    <div className="truncate font-bold text-foreground">{l.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {l.category} Law · Joined {l.joinedAt}
                    </div>
                  </div>
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: "var(--md-extended-color-warning)" }}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PIE CHARTS ROW */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <PieChart className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground">Cases by Legal Domain</h3>
          </div>
          <div className="flex flex-col items-center gap-4">
            <DonutChart slices={categoryPieSlices} size={140} />
            <div className="w-full space-y-1.5">
              {categoryPieSlices.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-foreground font-medium">{s.label}</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Scale className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-foreground">Cases by Pipeline Status</h3>
          </div>
          <div className="flex flex-col items-center gap-4">
            <DonutChart slices={statusPieSlices} size={140} />
            <div className="w-full space-y-1.5">
              {statusPieSlices.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-foreground font-medium">{s.label}</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Users className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-foreground">Lawyer Verification Status</h3>
          </div>
          <div className="flex flex-col items-center gap-4">
            <DonutChart slices={LawyerstatusSlices} size={140} />
            <div className="w-full space-y-1.5">
              {LawyerstatusSlices.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-foreground font-medium">{s.label}</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BAR CHART METERS GRID */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Category Distribution</h3>
            </div>
            <span className="text-xs text-muted-foreground">By Legal Domain</span>
          </div>
          <div className="space-y-3 pt-1">
            {categoryStats
              .filter((c) => c.count > 0)
              .map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{item.category} Law</span>
                    <span className="text-muted-foreground font-mono">
                      {item.count} cases ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(item.percentage, 8)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-foreground">Case Pipeline Status</h3>
            </div>
            <span className="text-xs text-muted-foreground">Real-time status</span>
          </div>
          <div className="space-y-3 pt-1">
            {statusData.map((item) => (
              <div key={item.status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-foreground">{item.status}</span>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(item.percentage, 6)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lawyer DOMAIN AVAILABILITY GRID */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground">
            Lawyer Availability by Practice Domain
          </h3>
          <span className="text-xs text-muted-foreground">{totalLawyers} Total Counsel</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {categoryStats.map((item) => (
            <div
              key={item.category}
              className="rounded-xl border border-border bg-background p-4 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{item.category} Law</span>
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: `${item.color}18`, color: item.color }}
                >
                  {item.lawyerCount} Lawyers
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{item.count} Cases Logged</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
