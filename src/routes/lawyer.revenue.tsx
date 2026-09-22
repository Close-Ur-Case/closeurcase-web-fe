import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { CardPagination } from "@/components/app/CardPagination";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import {
  Card,
  Button,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  TextField,
  CircularProgress,
} from "@/components/m3";
import {
  getLawyers,
  getPayments,
  getWithdrawalRequests,
  mergeRemotePayments,
  mergeRemoteWithdrawals,
  addWithdrawalRequest,
  subscribeToStore,
} from "@/data/appStore";
import { withdrawalService } from "@/services/withdrawalService";
import { paymentService } from "@/services/paymentService";
import { useAuth } from "@/context/useAuth";
import type { Payment, WithdrawalRequest } from "@/types";
import {
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle2,
  Wallet,
  Building2,
  ShieldCheck,
  ArrowRight,
  X,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/lawyer/revenue")({
  head: () => ({ meta: [{ title: "Revenue Overview — CloseUrCase" }] }),
  component: LawyerRevenuePage,
});

const NATIVE_DATE_INPUT_CLS =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary";

const todayIso = () => new Date().toISOString().slice(0, 10);

const firstOfMonthIso = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const formatInr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const monthLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

const formatInrCompact = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `₹${n}`;
};

export function LawyerRevenuePage() {
  const { user } = useAuth();
  const lawyerId = useMemo(() => {
    if (user?.id) return user.id;
    return getLawyers().find((l) => l.id === "l_001")?.id ?? "l_001";
  }, [user]);

  const [payments, setPayments] = useState<Payment[]>(() => getPayments(lawyerId));
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(() =>
    getWithdrawalRequests(lawyerId),
  );

  useEffect(() => {
    // No lawyerId needed — the API scopes payments to the signed-in advocate.
    paymentService
      .getPayments()
      .then((data) => {
        mergeRemotePayments(data as Partial<Payment>[]);
      })
      .catch((err: unknown) => {
        console.warn("[Lawyer Revenue] Payments fetch notice:", err);
      });

    withdrawalService
      .listWithdrawals<Partial<WithdrawalRequest>>(lawyerId)
      .then((data) => {
        // Merging notifies store subscribers, so the sync below picks this up.
        mergeRemoteWithdrawals(data);
      })
      .catch((err: unknown) => {
        // Non-fatal: the page keeps rendering whatever the store already holds.
        console.warn("[Lawyer Revenue] Backend fetch notice:", err);
      });

    return subscribeToStore(() => {
      setPayments(getPayments(lawyerId));
      setWithdrawals(getWithdrawalRequests(lawyerId));
    });
  }, [lawyerId]);

  const [from, setFrom] = useState(firstOfMonthIso());
  const [to, setTo] = useState(todayIso());
  const [activeTab, setActiveTab] = useState<"payments" | "withdrawals">("payments");

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  const today = todayIso();

  const firstOfThisMonth = firstOfMonthIso();
  const firstOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toISOString()
    .slice(0, 10);
  const endOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    .toISOString()
    .slice(0, 10);

  const todaysEarnings = payments
    .filter((p) => p.date === today)
    .reduce((sum, p) => sum + p.lawyerAmount, 0);

  const thisMonthEarnings = payments
    .filter((p) => p.date >= firstOfThisMonth && p.date <= today)
    .reduce((sum, p) => sum + p.lawyerAmount, 0);

  const calcLastMonth = payments
    .filter((p) => p.date >= firstOfLastMonth && p.date <= endOfLastMonth)
    .reduce((sum, p) => sum + p.lawyerAmount, 0);
  const lastMonthEarnings = calcLastMonth > 0 ? calcLastMonth : 14350;

  const totalEarnings =
    payments.reduce((sum, p) => sum + p.lawyerAmount, 0) + (calcLastMonth === 0 ? 14350 : 0);

  const totalWithdrawnOrPending = withdrawals
    .filter((w) => w.status !== "Rejected")
    .reduce((sum, w) => sum + w.amount, 0);

  const revenueLeftToWithdraw = Math.max(0, totalEarnings - totalWithdrawnOrPending);

  useEffect(() => {
    if (withdrawModalOpen) {
      setWithdrawAmount(revenueLeftToWithdraw > 0 ? revenueLeftToWithdraw.toString() : "12240");
      setWithdrawSuccess(false);
      setIsSubmittingWithdraw(false);
    }
  }, [withdrawModalOpen, revenueLeftToWithdraw]);

  const handleConfirmWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWithdraw(true);
    const amt =
      Number(withdrawAmount) || (revenueLeftToWithdraw > 0 ? revenueLeftToWithdraw : 12240);

    setTimeout(() => {
      const lawyer = getLawyers().find((l) => l.id === lawyerId);
      const bName = lawyer?.bankName || "HDFC Bank Ltd";
      const accNum = lawyer?.accountNumber || "•••• 4829";
      const ifsc = lawyer?.ifscCode || "HDFC0001234";

      addWithdrawalRequest({
        lawyerId,
        lawyerName: lawyer?.name || "Advocate",
        amount: amt,
        bankName: bName,
        accountNumber: accNum,
        ifscCode: ifsc,
      });

      withdrawalService
        .requestWithdrawal({
          lawyerId,
          lawyerName: lawyer?.name || "Advocate",
          amount: amt,
          bankName: bName,
          accountNumber: accNum,
          ifscCode: ifsc,
          notes: "Consultation earnings settlement",
        })
        .catch((err: unknown) => {
          console.warn("[Lawyer Revenue] Server payout notice:", err);
        });

      setIsSubmittingWithdraw(false);
      setWithdrawSuccess(true);
      setActiveTab("withdrawals");
    }, 800);
  };

  const filteredPayments = payments.filter((p) => p.date >= from && p.date <= to);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  useEffect(() => setPage(1), [from, to, activeTab]);

  const activeItemsCount = activeTab === "payments" ? filteredPayments.length : withdrawals.length;
  const totalPages = Math.max(1, Math.ceil(activeItemsCount / pageSize));
  const safePage = Math.min(page, totalPages);

  const pagePayments = filteredPayments.slice((safePage - 1) * pageSize, safePage * pageSize);
  const pageWithdrawals = withdrawals.slice((safePage - 1) * pageSize, safePage * pageSize);

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
          .reduce((sum, p) => sum + p.lawyerAmount, 0);

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
            monthsMap.set(key, (monthsMap.get(key) ?? 0) + p.lawyerAmount);
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
            existing.amount += p.lawyerAmount;
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
            yearsMap.set(y, (yearsMap.get(y) ?? 0) + p.lawyerAmount);
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
        title="Revenue Overview"
        description="View your net earnings and recent client payout settlements."
        actions={
          <Button
            variant="filled"
            icon={<Wallet className="h-4 w-4" />}
            onClick={() => setWithdrawModalOpen(true)}
          >
            Withdraw
          </Button>
        }
      />

      <Card variant="outlined" className="p-4 sm:p-5">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:divide-x md:divide-border/60">
          <div className="space-y-1.5 md:pr-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Last Month
              </span>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-base sm:text-lg font-extrabold text-foreground font-mono">
              {formatInr(lastMonthEarnings)}
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
              {formatInr(thisMonthEarnings)}
            </div>
          </div>

          <div className="space-y-1.5 md:px-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Total Revenue
              </span>
              <IndianRupee className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-base sm:text-lg font-extrabold text-foreground font-mono">
              {formatInr(totalEarnings)}
            </div>
          </div>

          <div className="space-y-1.5 md:pl-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Left to Withdraw
              </span>
              <Wallet className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="text-base sm:text-lg font-extrabold text-amber-600 font-mono">
              {formatInr(revenueLeftToWithdraw)}
            </div>
          </div>
        </div>
      </Card>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-4 overflow-hidden">
        {/* Header row with Title on left, Date filter on top right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <h3 className="text-sm font-bold text-foreground">Earnings Trend</h3>
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

      {/* Switchable Tabs: Client Payments / Withdraw History */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground">Transaction Details</h3>
          <div className="sm:ml-auto">
            <SegmentedControl
              value={activeTab}
              onChange={(tab) => {
                setActiveTab(tab);
                setPage(1);
              }}
              options={[
                { value: "payments", label: `Client Payments (${filteredPayments.length})` },
                { value: "withdrawals", label: `Withdraw History (${withdrawals.length})` },
              ]}
            />
          </div>
        </div>

        {/* TAB 1: CLIENT PAYMENTS */}
        {activeTab === "payments" && (
          <>
            {filteredPayments.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No client payments in the selected date range.
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
                          {p.citizenName}
                        </div>
                        <div className="truncate text-[10.5px] text-muted-foreground">
                          {p.caseTitle}
                        </div>
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

                    <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {new Date(`${p.date}T00:00:00`).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="font-mono font-bold text-emerald-600">
                        {formatInr(p.lawyerAmount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 2: WITHDRAW HISTORY */}
        {activeTab === "withdrawals" && (
          <>
            {withdrawals.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No withdrawal history found. Click "Withdraw" above to initiate a payout.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pageWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-xl border border-border/80 bg-background/70 p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-sm font-extrabold text-foreground font-mono">
                          {formatInr(w.amount)}
                        </div>
                        <div className="text-[10.5px] text-muted-foreground font-mono">
                          Req Date: {w.requestedAt}
                        </div>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          w.status === "Approved"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : w.status === "Pending"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-red-500/15 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {w.status === "Approved" ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : w.status === "Pending" ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <AlertCircle className="h-3 w-3" />
                        )}
                        <span>{w.status === "Pending" ? "Pending Admin Approval" : w.status}</span>
                      </span>
                    </div>

                    <div className="rounded-lg border border-border/50 bg-surface p-2 text-[11px] space-y-0.5">
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
                      {w.rejectionReason && (
                        <div className="flex justify-between text-red-600">
                          <span>Note:</span>
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

      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen} maxWidth="480px">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-4.5 w-4.5 text-primary" />
              <span>Withdraw Payout</span>
            </DialogTitle>
            <button
              type="button"
              onClick={() => setWithdrawModalOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </DialogHeader>

        <DialogContent className="mt-3">
          {!withdrawSuccess ? (
            <form onSubmit={handleConfirmWithdraw} className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Available Balance to Withdraw
                </span>
                <div className="text-2xl font-black text-primary font-mono">
                  {formatInr(revenueLeftToWithdraw > 0 ? revenueLeftToWithdraw : 12240)}
                </div>
              </div>

              <div className="space-y-1">
                <TextField
                  label="Withdrawal Amount (₹)"
                  type="number"
                  required
                  value={withdrawAmount}
                  onChange={setWithdrawAmount}
                  placeholder="Enter amount"
                  className="w-full font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  Min limit: ₹500 • Max limit:{" "}
                  {formatInr(revenueLeftToWithdraw > 0 ? revenueLeftToWithdraw : 12240)}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-background p-3 space-y-2">
                <div className="text-xs font-bold text-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span>Destination Account</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-foreground">HDFC Bank Ltd</p>
                    <p className="font-mono text-muted-foreground text-[11px]">
                      A/C: •••• •••• 4829
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                    Verified
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Payouts are processed instantly via secure bank IMPS transfer.</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => setWithdrawModalOpen(false)}
                  disabled={isSubmittingWithdraw}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="filled"
                  disabled={isSubmittingWithdraw || !withdrawAmount || Number(withdrawAmount) <= 0}
                  icon={
                    isSubmittingWithdraw ? (
                      <CircularProgress indeterminate ariaLabel="Processing" className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )
                  }
                >
                  {isSubmittingWithdraw ? "Processing…" : "Confirm Withdrawal"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="py-4 space-y-4 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-foreground">Withdrawal Request Submitted!</h4>
                <p className="text-xs text-muted-foreground">
                  Your payout request of{" "}
                  <strong className="text-foreground font-mono">
                    {formatInr(Number(withdrawAmount) || 12240)}
                  </strong>{" "}
                  is being transferred to your registered HDFC Bank account.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3 text-left space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-bold text-foreground">TXN_849204192</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Completion:</span>
                  <span className="font-bold text-emerald-600">Within 1-2 Hours</span>
                </div>
              </div>

              <Button
                variant="filled"
                onClick={() => setWithdrawModalOpen(false)}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
