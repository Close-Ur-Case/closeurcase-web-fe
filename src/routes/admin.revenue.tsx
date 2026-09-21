import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { CardPagination } from "@/components/app/CardPagination";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { Card, Button } from "@/components/m3";
import {
  getPayments,
  getWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  subscribeToStore,
} from "@/data/appStore";
import { withdrawalService } from "@/services/withdrawalService";
import type { Payment, PaymentSource, WithdrawalRequest } from "@/types";
import {
  IndianRupee,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Building2,
  User,
} from "lucide-react";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({ meta: [{ title: "Platform Revenue — CloseUrCase Admin" }] }),
  component: AdminRevenuePage,
});

const NATIVE_DATE_INPUT_CLS =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary";

const todayIso = () => new Date().toISOString().slice(0, 10);

const firstOfMonthIso = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const formatInr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const SOURCE_LABEL: Record<PaymentSource, string> = {
  commission: "Lawyer Commission",
  subscription: "Citizen Subscription",
};

const formatInrCompact = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `₹${n}`;
};

export function AdminRevenuePage() {
  const [payments, setPayments] = useState<Payment[]>(() => getPayments());
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() =>
    getWithdrawalRequests(),
  );

  useEffect(() => {
    withdrawalService
      .listWithdrawals()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          console.info("[Admin Revenue] Live backend withdrawals count:", data.length);
        }
      })
      .catch((err: unknown) => {
        console.warn("[Admin Revenue] Backend fetch notice:", err);
      });

    return subscribeToStore(() => {
      setPayments(getPayments());
      setWithdrawals(getWithdrawalRequests());
    });
  }, []);

  const [from, setFrom] = useState(firstOfMonthIso());
  const [to, setTo] = useState(todayIso());
  const [activeTab, setActiveTab] = useState<"payments" | "requests" | "history">("requests");
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "reject";
    withdrawal: WithdrawalRequest;
  } | null>(null);

  const today = todayIso();

  const todaysRevenue = payments
    .filter((p) => p.date === today)
    .reduce((sum, p) => sum + p.platformAmount, 0);

  const monthlyRevenue = payments
    .filter((p) => p.date >= firstOfMonthIso() && p.date <= today)
    .reduce((sum, p) => sum + p.platformAmount, 0);

  const commissionRevenue = payments
    .filter((p) => p.source === "commission")
    .reduce((sum, p) => sum + p.platformAmount, 0);

  const subscriptionRevenue = payments
    .filter((p) => p.source === "subscription")
    .reduce((sum, p) => sum + p.platformAmount, 0);

  const filteredPayments = payments.filter((p) => p.date >= from && p.date <= to);

  const pendingRequests = useMemo(
    () => withdrawals.filter((w) => w.status === "Pending"),
    [withdrawals],
  );

  const historyWithdrawals = useMemo(
    () => withdrawals.filter((w) => w.status !== "Pending"),
    [withdrawals],
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  useEffect(() => setPage(1), [from, to, activeTab]);

  const activeItemsCount =
    activeTab === "payments"
      ? filteredPayments.length
      : activeTab === "requests"
        ? pendingRequests.length
        : historyWithdrawals.length;

  const totalPages = Math.max(1, Math.ceil(activeItemsCount / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagePayments = filteredPayments.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pagePendingRequests = pendingRequests.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageHistoryWithdrawals = historyWithdrawals.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const chartData = useMemo(() => {
    if (!from || !to || from > to) return [];
    const startDate = new Date(`${from}T00:00:00`);
    const endDate = new Date(`${to}T00:00:00`);
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));

    if (diffDays <= 45) {
      const days: { label: string; date: string; amount: number }[] = [];
      const cur = new Date(startDate);
      while (cur <= endDate) {
        const iso = cur.toISOString().slice(0, 10);
        const label = cur.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        const dayAmount = payments
          .filter((p) => p.date === iso)
          .reduce((sum, p) => sum + p.platformAmount, 0);

        days.push({ label, date: iso, amount: dayAmount });
        cur.setDate(cur.getDate() + 1);
      }
      return days;
    } else if (diffDays <= 730) {
      // Up to 2 years: Monthly intervals
      const monthsMap = new Map<string, number>();
      const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

      while (cur <= endMonth) {
        const key = cur.toISOString().slice(0, 7);
        monthsMap.set(key, 0);
        cur.setMonth(cur.getMonth() + 1);
      }

      for (const p of payments) {
        if (p.date >= from && p.date <= to) {
          const key = p.date.slice(0, 7);
          if (monthsMap.has(key)) {
            monthsMap.set(key, (monthsMap.get(key) ?? 0) + p.platformAmount);
          }
        }
      }

      return [...monthsMap.entries()].map(([key, amount]) => ({
        label: new Date(`${key}-01T00:00:00`).toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        date: key,
        amount,
      }));
    } else if (diffDays <= 1825) {
      // 2 to 5 years: Quarterly intervals
      const quartersMap = new Map<string, { label: string; amount: number }>();
      const cur = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3, 1);
      const endQ = new Date(endDate.getFullYear(), Math.floor(endDate.getMonth() / 3) * 3, 1);

      while (cur <= endQ) {
        const y = cur.getFullYear();
        const q = Math.floor(cur.getMonth() / 3) + 1;
        const key = `${y}-Q${q}`;
        const label = `Q${q} '${String(y).slice(-2)}`;
        quartersMap.set(key, { label, amount: 0 });
        cur.setMonth(cur.getMonth() + 3);
      }

      for (const p of payments) {
        if (p.date >= from && p.date <= to) {
          const d = new Date(`${p.date}T00:00:00`);
          const y = d.getFullYear();
          const q = Math.floor(d.getMonth() / 3) + 1;
          const key = `${y}-Q${q}`;
          const existing = quartersMap.get(key);
          if (existing) {
            existing.amount += p.platformAmount;
          }
        }
      }

      return [...quartersMap.entries()].map(([key, item]) => ({
        label: item.label,
        date: key,
        amount: item.amount,
      }));
    } else {
      // Over 5 years: Yearly intervals
      const yearsMap = new Map<string, number>();
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();

      for (let y = startYear; y <= endYear; y++) {
        yearsMap.set(String(y), 0);
      }

      for (const p of payments) {
        if (p.date >= from && p.date <= to) {
          const y = p.date.slice(0, 4);
          if (yearsMap.has(y)) {
            yearsMap.set(y, (yearsMap.get(y) ?? 0) + p.platformAmount);
          }
        }
      }

      return [...yearsMap.entries()].map(([year, amount]) => ({
        label: year,
        date: year,
        amount,
      }));
    }
  }, [payments, from, to]);

  const maxAmount = Math.max(1, ...chartData.map((d) => d.amount));
  const maxNice = useMemo(() => {
    if (maxAmount <= 1000) return 1000;
    const mult = Math.pow(10, Math.floor(Math.log10(maxAmount)));
    const step = mult / 2;
    return Math.ceil(maxAmount / step) * step;
  }, [maxAmount]);

  const yAxisTicks = useMemo(() => {
    return [0, Math.round(maxNice / 3), Math.round((maxNice * 2) / 3), maxNice];
  }, [maxNice]);

  const labelStep =
    chartData.length > 20
      ? Math.ceil(chartData.length / 8)
      : chartData.length > 10
        ? Math.ceil(chartData.length / 6)
        : 1;

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      <PageHeader
        title="Platform Revenue"
        description="Monitor CloseUrCase commission and subscription income across lawyers and citizens."
      />

      <Card variant="outlined" className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:divide-x md:divide-border/60">
          <div className="space-y-1.5 md:pr-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Today
              </span>
              <IndianRupee className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-base sm:text-lg font-extrabold text-foreground font-mono">
              {formatInr(todaysRevenue)}
            </div>
          </div>

          <div className="space-y-1.5 md:px-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                This Month
              </span>
              <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-base sm:text-lg font-extrabold text-foreground font-mono">
              {formatInr(monthlyRevenue)}
            </div>
          </div>

          <div className="space-y-1.5 md:px-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Lawyers
              </span>
              <Wallet className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-base sm:text-lg font-extrabold text-foreground font-mono">
              {formatInr(commissionRevenue)}
            </div>
          </div>

          <div className="space-y-1.5 md:pl-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Citizens
              </span>
              <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
            </div>
            <div className="text-base sm:text-lg font-extrabold text-foreground font-mono">
              {formatInr(subscriptionRevenue)}
            </div>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-4 overflow-hidden">
        {/* Header row with Title on left, Date filter on top right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <h3 className="text-sm font-bold text-foreground">Platform Income Trend</h3>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">From</span>
              <input
                type="date"
                value={from}
                max={to}
                onChange={(e) => setFrom(e.target.value)}
                className={NATIVE_DATE_INPUT_CLS}
              />
            </label>
            <label className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground">To</span>
              <input
                type="date"
                value={to}
                min={from}
                max={today}
                onChange={(e) => setTo(e.target.value)}
                className={NATIVE_DATE_INPUT_CLS}
              />
            </label>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex gap-3 min-w-0">
            {/* Y-Axis labels */}
            <div className="flex flex-col justify-between text-right pr-2 text-[10px] font-mono font-semibold text-muted-foreground border-r border-border h-40 select-none pb-6 shrink-0">
              {yAxisTicks
                .slice()
                .reverse()
                .map((val, idx) => (
                  <span key={idx} className="-mt-2 whitespace-nowrap">
                    {formatInrCompact(val)}
                  </span>
                ))}
            </div>

            {/* Chart Plot Area */}
            <div className="relative flex-1 h-40 min-w-0">
              {/* Horizontal Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                {yAxisTicks.map((_, idx) => (
                  <div key={idx} className="border-b border-border/40 border-dashed w-full" />
                ))}
              </div>

              {/* Bars & X-Axis */}
              <div
                className={`relative z-10 flex items-end justify-around h-full ${
                  chartData.length > 20 ? "gap-0.5" : "gap-1 sm:gap-2"
                } px-1 min-w-0 w-full`}
              >
                {chartData.map((d, i) => {
                  const heightPct =
                    d.amount > 0 && maxNice > 0
                      ? Math.max(Math.round((d.amount / maxNice) * 100), 4)
                      : 0;
                  const showLabel = i % labelStep === 0 || i === chartData.length - 1;
                  return (
                    <div
                      key={i}
                      className="relative flex flex-col items-center flex-1 min-w-0 h-full justify-end group"
                    >
                      {/* Hover Tooltip */}
                      <div
                        className={`pointer-events-none absolute -top-7 opacity-0 group-hover:opacity-100 transition-all duration-150 text-[10px] font-bold font-mono text-primary bg-surface border border-primary/25 shadow-md px-1.5 py-0.5 rounded-md whitespace-nowrap z-30 ${
                          i === 0
                            ? "left-0"
                            : i === chartData.length - 1
                              ? "right-0"
                              : "left-1/2 -translate-x-1/2"
                        }`}
                      >
                        {formatInr(d.amount)}
                      </div>
                      {/* Bar */}
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[36px] rounded-t-md transition-all ${
                          d.amount > 0
                            ? "bg-gradient-to-t from-primary to-primary/80 shadow-xs group-hover:from-primary/90 group-hover:to-primary"
                            : "bg-transparent"
                        }`}
                        title={`${d.label}: ${formatInr(d.amount)}`}
                      />
                      {/* X-Axis Baseline */}
                      <div className="w-full border-t-2 border-border mt-0.5" />
                      {/* X-Axis Label */}
                      <div className="relative w-full flex justify-center h-4 mt-1">
                        {showLabel && (
                          <span
                            className={`absolute top-0 text-[10px] font-bold text-muted-foreground group-hover:text-foreground transition-colors whitespace-nowrap select-none ${
                              i === 0
                                ? "left-0 text-left"
                                : i === chartData.length - 1
                                  ? "right-0 text-right"
                                  : "left-1/2 -translate-x-1/2 text-center"
                            }`}
                          >
                            {d.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Switchable Tabs: Payments | Withdraw Requests | Withdraw History */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground">Platform Transactions</h3>
          <div className="sm:ml-auto">
            <SegmentedControl
              value={activeTab}
              onChange={(tab) => {
                setActiveTab(tab);
                setPage(1);
              }}
              options={[
                { value: "payments", label: `Payments (${filteredPayments.length})` },
                { value: "requests", label: `Withdraw Requests (${pendingRequests.length})` },
                { value: "history", label: `Withdraw History (${historyWithdrawals.length})` },
              ]}
            />
          </div>
        </div>

        {/* TAB 1: PAYMENTS */}
        {activeTab === "payments" && (
          <>
            {filteredPayments.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No payments in the selected date range.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pagePayments.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border/80 bg-background/70 p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-foreground text-sm">
                          {SOURCE_LABEL[p.source]}
                        </div>
                        {p.caseTitle && (
                          <div className="truncate text-[10.5px] text-muted-foreground">
                            {p.caseTitle}
                          </div>
                        )}
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          p.status === "Completed"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        }`}
                      >
                        {p.status === "Completed" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <Clock className="h-3 w-3" />
                        )}
                        <span>{p.status}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-border/50 bg-surface p-2.5 text-[11px]">
                      <div>
                        <div className="text-[9.5px] uppercase font-extrabold text-muted-foreground tracking-wider">
                          Citizen
                        </div>
                        <div className="truncate font-semibold text-foreground">
                          {p.citizenName ?? "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9.5px] uppercase font-extrabold text-muted-foreground tracking-wider">
                          Lawyer
                        </div>
                        <div className="truncate font-semibold text-foreground">
                          {p.lawyerName ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(`${p.date}T00:00:00`).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <div className="text-right">
                        <div className="font-mono font-bold text-foreground">
                          {formatInr(p.grossAmount)}
                        </div>
                        <div className="text-[10px] font-mono font-bold text-emerald-600">
                          {formatInr(p.platformAmount)} share
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 2: WITHDRAW REQUESTS */}
        {activeTab === "requests" && (
          <>
            {pendingRequests.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold text-foreground">All caught up!</p>
                <p className="text-xs text-muted-foreground">
                  There are currently no pending withdrawal requests from lawyers.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {pagePendingRequests.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-border/50 pb-2.5">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <User className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{w.lawyerName}</span>
                        </div>
                        <div className="text-[10.5px] text-muted-foreground font-mono">
                          Requested: {w.requestedAt}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-foreground font-mono">
                          {formatInr(w.amount)}
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          <Clock className="h-3 w-3" />
                          Pending Review
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 bg-background/80 p-2.5 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider mb-1">
                        <Building2 className="h-3 w-3 text-primary" />
                        Payout Destination
                      </div>
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-muted-foreground">Bank:</span>
                        <span className="font-semibold text-foreground">{w.bankName}</span>
                      </div>
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-muted-foreground">Account:</span>
                        <span className="font-semibold text-foreground">{w.accountNumber}</span>
                      </div>
                      {w.ifscCode && (
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className="text-muted-foreground">IFSC Code:</span>
                          <span className="font-semibold text-foreground">{w.ifscCode}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => setConfirmAction({ type: "reject", withdrawal: w })}
                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200"
                        icon={<XCircle className="h-3.5 w-3.5" />}
                      >
                        Reject
                      </Button>
                      <Button
                        type="button"
                        variant="filled"
                        onClick={() => setConfirmAction({ type: "approve", withdrawal: w })}
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                      >
                        Approve & Pay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 3: WITHDRAW HISTORY */}
        {activeTab === "history" && (
          <>
            {historyWithdrawals.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No past withdrawal records found.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pageHistoryWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-xl border border-border/80 bg-background/70 p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                          <User className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{w.lawyerName}</span>
                        </div>
                        <div className="text-sm font-extrabold text-foreground font-mono">
                          {formatInr(w.amount)}
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          w.status === "Approved"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-red-500/15 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {w.status === "Approved" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        <span>{w.status}</span>
                      </span>
                    </div>

                    <div className="rounded-lg border border-border/50 bg-surface p-2 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Req Date:</span>
                        <span className="font-mono text-foreground">{w.requestedAt}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account:</span>
                        <span className="font-medium text-foreground">
                          {w.bankName} ({w.accountNumber})
                        </span>
                      </div>
                      {w.referenceId && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ref ID:</span>
                          <span className="font-mono font-bold text-emerald-600">
                            {w.referenceId}
                          </span>
                        </div>
                      )}
                      {w.processedAt && (
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-muted-foreground">Processed At:</span>
                          <span className="font-mono text-muted-foreground">{w.processedAt}</span>
                        </div>
                      )}
                      {w.rejectionReason && (
                        <div className="flex justify-between text-red-600 text-[10.5px]">
                          <span>Reason:</span>
                          <span>{w.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeItemsCount > 0 && (
          <CardPagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction?.type === "approve"
            ? "Approve Withdrawal Payout?"
            : "Reject Withdrawal Request?"
        }
        message={
          confirmAction?.type === "approve"
            ? `Are you sure you want to approve the payout of ${formatInr(confirmAction?.withdrawal.amount ?? 0)} for ${confirmAction?.withdrawal.lawyerName}? The funds will be transferred to their account (${confirmAction?.withdrawal.bankName}).`
            : `Are you sure you want to reject the withdrawal request of ${formatInr(confirmAction?.withdrawal.amount ?? 0)} for ${confirmAction?.withdrawal.lawyerName}?`
        }
        confirmLabel={confirmAction?.type === "approve" ? "Approve & Pay" : "Reject Request"}
        cancelLabel="Cancel"
        variant={confirmAction?.type === "approve" ? "warning" : "danger"}
        onConfirm={() => {
          if (confirmAction) {
            if (confirmAction.type === "approve") {
              approveWithdrawalRequest(confirmAction.withdrawal.id);
              withdrawalService
                .approveWithdrawal(confirmAction.withdrawal.id)
                .catch((err: unknown) => {
                  console.warn("[Admin Revenue] Payout approve server notice:", err);
                });
            } else {
              rejectWithdrawalRequest(confirmAction.withdrawal.id, "Declined by Admin");
              withdrawalService
                .rejectWithdrawal(confirmAction.withdrawal.id, "Declined by Admin")
                .catch((err: unknown) => {
                  console.warn("[Admin Revenue] Payout reject server notice:", err);
                });
            }
            setConfirmAction(null);
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
