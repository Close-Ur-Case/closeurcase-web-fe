import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
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
import { withdrawalService } from "@/services/withdrawalService";
import { paymentService } from "@/services/paymentService";
import { lawyerService } from "@/services/lawyerService";
import { useAuth } from "@/context/useAuth";
import {
  updateLawyerProfile,
  mergeRemoteLawyers,
  getLawyers,
  subscribeToStore,
} from "@/data/appStore";
import type { PaymentRecord, WithdrawalRecord } from "@/types/api";
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
  RefreshCw,
  AlertTriangle,
  Edit3,
  Check,
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

const formatInrCompact = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `₹${n}`;
};

interface LawyerBankInfo {
  id: string;
  name: string;
  bankName: string | null;
  accountNumber: string | null;
  ifscCode: string | null;
}

export function LawyerRevenuePage() {
  const { user } = useAuth();

  // Resolve lawyer ID based on authenticated user or fall back cleanly
  const lawyerId = useMemo(() => {
    if (user?.lawyerId) return user.lawyerId;
    if (user?.role === "lawyer" && user?.id) return user.id;
    return "l_001";
  }, [user]);

  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [lawyerProfile, setLawyerProfile] = useState<LawyerBankInfo | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Bank details form in modal if not yet configured or editing
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankNameInput, setBankNameInput] = useState("");
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [ifscCodeInput, setIfscCodeInput] = useState("");
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankSaveError, setBankSaveError] = useState<string | null>(null);

  const fetchRevenueData = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true);
      else setIsRefreshing(true);
      setFetchError(null);

      try {
        const [paymentsData, withdrawalsData, lawyerData] = await Promise.all([
          paymentService.getPayments(lawyerId).catch((err: unknown) => {
            console.warn("[Lawyer Revenue] Error fetching payments:", err);
            return [] as PaymentRecord[];
          }),
          withdrawalService.listWithdrawals<WithdrawalRecord>(lawyerId).catch((err: unknown) => {
            console.warn("[Lawyer Revenue] Error fetching withdrawals:", err);
            return [] as WithdrawalRecord[];
          }),
          lawyerService.getLawyerById<Record<string, unknown>>(lawyerId).catch((err: unknown) => {
            console.warn("[Lawyer Revenue] Error fetching lawyer profile:", err);
            return null;
          }),
        ]);

        // Keep payments scoped to current advocate
        const scopedPayments = (paymentsData || []).filter(
          (p) => !p.lawyerId || p.lawyerId === lawyerId,
        );
        setPayments(scopedPayments);

        // Keep withdrawals scoped to current advocate
        const scopedWithdrawals = (withdrawalsData || []).filter(
          (w) => !w.lawyerId || w.lawyerId === lawyerId,
        );
        setWithdrawals(scopedWithdrawals);

        if (lawyerData) {
          const bankName = (lawyerData.bankName as string) || null;
          const accountNumber = (lawyerData.accountNumber as string) || null;
          const ifscCode = (lawyerData.ifscCode as string) || null;

          setLawyerProfile({
            id: (lawyerData.id as string) || lawyerId,
            name: (lawyerData.name as string) || user?.name || "Advocate",
            bankName,
            accountNumber,
            ifscCode,
          });

          // Sync into shared appStore for profile & across pages
          mergeRemoteLawyers([
            {
              id: (lawyerData.id as string) || lawyerId,
              name: (lawyerData.name as string) || undefined,
              bankName: bankName || undefined,
              accountNumber: accountNumber || undefined,
              ifscCode: ifscCode || undefined,
            },
          ]);

          if (bankName) setBankNameInput(bankName);
          if (accountNumber) setAccountNumberInput(accountNumber);
          if (ifscCode) setIfscCodeInput(ifscCode);
        }
      } catch (err: unknown) {
        console.error("[Lawyer Revenue] Failed to load data:", err);
        setFetchError("Unable to retrieve revenue records. Please check your connection and retry.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [lawyerId, user?.name],
  );

  useEffect(() => {
    fetchRevenueData(false);
  }, [fetchRevenueData]);

  // Synchronize state when bank details are updated in other pages (e.g. /lawyer/profile)
  useEffect(() => {
    return subscribeToStore(() => {
      const match = getLawyers().find((l) => l.id === lawyerId);
      if (match) {
        setLawyerProfile((prev) => {
          if (
            match.bankName === prev?.bankName &&
            match.accountNumber === prev?.accountNumber &&
            match.ifscCode === prev?.ifscCode
          ) {
            return prev;
          }
          return {
            id: lawyerId,
            name: match.name || prev?.name || user?.name || "Advocate",
            bankName: match.bankName ?? prev?.bankName ?? null,
            accountNumber: match.accountNumber ?? prev?.accountNumber ?? null,
            ifscCode: match.ifscCode ?? prev?.ifscCode ?? null,
          };
        });
        if (match.bankName) setBankNameInput(match.bankName);
        if (match.accountNumber) setAccountNumberInput(match.accountNumber);
        if (match.ifscCode) setIfscCodeInput(match.ifscCode);
      }
    });
  }, [lawyerId, user?.name]);

  // Date filters
  const [from, setFrom] = useState(firstOfMonthIso());
  const [to, setTo] = useState(todayIso());
  const [activeTab, setActiveTab] = useState<"payments" | "withdrawals">("payments");

  // Withdrawal Modal State
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [createdWithdrawal, setCreatedWithdrawal] = useState<WithdrawalRecord | null>(null);

  const today = todayIso();
  const firstOfThisMonth = firstOfMonthIso();
  const firstOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toISOString()
    .slice(0, 10);
  const endOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0)
    .toISOString()
    .slice(0, 10);

  // FINANCIAL METRICS: CALCULATED STRICTLY FROM REAL TRANSACTIONS
  const completedPayments = useMemo(
    () => payments.filter((p) => p.status === "Completed"),
    [payments],
  );

  const thisMonthEarnings = useMemo(() => {
    return completedPayments
      .filter((p) => p.date >= firstOfThisMonth && p.date <= today)
      .reduce((sum, p) => sum + (p.lawyerAmount || 0), 0);
  }, [completedPayments, firstOfThisMonth, today]);

  const lastMonthEarnings = useMemo(() => {
    return completedPayments
      .filter((p) => p.date >= firstOfLastMonth && p.date <= endOfLastMonth)
      .reduce((sum, p) => sum + (p.lawyerAmount || 0), 0);
  }, [completedPayments, firstOfLastMonth, endOfLastMonth]);

  const totalEarnings = useMemo(() => {
    return completedPayments.reduce((sum, p) => sum + (p.lawyerAmount || 0), 0);
  }, [completedPayments]);

  const totalWithdrawnOrPending = useMemo(() => {
    return withdrawals
      .filter((w) => w.status !== "Rejected")
      .reduce((sum, w) => sum + (w.amount || 0), 0);
  }, [withdrawals]);

  const revenueLeftToWithdraw = useMemo(() => {
    return Math.max(0, totalEarnings - totalWithdrawnOrPending);
  }, [totalEarnings, totalWithdrawnOrPending]);

  // Handle opening modal
  useEffect(() => {
    if (withdrawModalOpen) {
      setWithdrawAmount(revenueLeftToWithdraw >= 500 ? revenueLeftToWithdraw.toString() : "");
      setWithdrawSuccess(false);
      setWithdrawError(null);
      setIsSubmittingWithdraw(false);
      setIsEditingBank(
        !lawyerProfile?.bankName || !lawyerProfile?.accountNumber || !lawyerProfile?.ifscCode,
      );
      if (lawyerProfile?.bankName) setBankNameInput(lawyerProfile.bankName);
      if (lawyerProfile?.accountNumber) setAccountNumberInput(lawyerProfile.accountNumber);
      if (lawyerProfile?.ifscCode) setIfscCodeInput(lawyerProfile.ifscCode);
    }
  }, [withdrawModalOpen, revenueLeftToWithdraw, lawyerProfile]);

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankNameInput.trim() || !accountNumberInput.trim() || !ifscCodeInput.trim()) {
      setBankSaveError("Please provide all bank account details.");
      return;
    }

    setIsSavingBank(true);
    setBankSaveError(null);

    try {
      const updatedBank = {
        bankName: bankNameInput.trim(),
        accountNumber: accountNumberInput.trim(),
        ifscCode: ifscCodeInput.trim().toUpperCase(),
      };

      await lawyerService.updateBankDetails(lawyerId, {
        ...updatedBank,
        accountHolderName: lawyerProfile?.name || user?.name || "Advocate",
      });

      setLawyerProfile((prev) => ({
        id: lawyerId,
        name: prev?.name || user?.name || "Advocate",
        ...updatedBank,
      }));

      // Synchronize immediately across application state (including /lawyer/profile)
      updateLawyerProfile(lawyerId, updatedBank);
      mergeRemoteLawyers([{ id: lawyerId, ...updatedBank }]);

      setIsEditingBank(false);
    } catch (err: unknown) {
      setBankSaveError(err instanceof Error ? err.message : "Failed to save bank account details.");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleConfirmWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);

    const amt = Number(withdrawAmount);
    if (!amt || isNaN(amt) || amt < 500) {
      setWithdrawError("Minimum withdrawal amount is ₹500.");
      return;
    }

    if (amt > revenueLeftToWithdraw) {
      setWithdrawError(
        `Withdrawal amount exceeds your available balance (${formatInr(revenueLeftToWithdraw)}).`,
      );
      return;
    }

    const bName = lawyerProfile?.bankName || bankNameInput.trim();
    const accNum = lawyerProfile?.accountNumber || accountNumberInput.trim();
    const ifsc = lawyerProfile?.ifscCode || ifscCodeInput.trim().toUpperCase();

    if (!bName || !accNum || !ifsc) {
      setWithdrawError("Please configure your destination bank account details before requesting a payout.");
      setIsEditingBank(true);
      return;
    }

    setIsSubmittingWithdraw(true);

    try {
      // If bank details were newly edited or provided, sync them to backend and profile store
      if (
        bName !== lawyerProfile?.bankName ||
        accNum !== lawyerProfile?.accountNumber ||
        ifsc !== lawyerProfile?.ifscCode
      ) {
        const updatedBank = {
          bankName: bName,
          accountNumber: accNum,
          ifscCode: ifsc,
        };
        lawyerService
          .updateBankDetails(lawyerId, {
            ...updatedBank,
            accountHolderName: lawyerProfile?.name || user?.name || "Advocate",
          })
          .catch((err) => console.warn("[Lawyer Revenue] Auto-sync bank notice:", err));
        updateLawyerProfile(lawyerId, updatedBank);
        mergeRemoteLawyers([{ id: lawyerId, ...updatedBank }]);
      }

      const record = await withdrawalService.requestWithdrawal({
        lawyerId,
        lawyerName: lawyerProfile?.name || user?.name || "Advocate",
        amount: amt,
        bankName: bName,
        accountNumber: accNum,
        ifscCode: ifsc,
        notes: "Consultation earnings settlement",
      });

      setCreatedWithdrawal(record);
      setWithdrawSuccess(true);
      // Refresh in background so balance & history update
      fetchRevenueData(true);
    } catch (err: unknown) {
      setWithdrawError(
        err instanceof Error ? err.message : "Failed to process withdrawal. Please try again.",
      );
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => p.date >= from && p.date <= to);
  }, [payments, from, to]);

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
          .filter((p) => p.date === iso && p.status === "Completed")
          .reduce((sum, p) => sum + (p.lawyerAmount || 0), 0);

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
        if (p.date >= from && p.date <= to && p.status === "Completed") {
          const key = p.date.slice(0, 7);
          if (monthsMap.has(key)) {
            monthsMap.set(key, (monthsMap.get(key) ?? 0) + (p.lawyerAmount || 0));
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
        if (p.date >= from && p.date <= to && p.status === "Completed") {
          const d = new Date(`${p.date}T00:00:00`);
          const y = d.getFullYear();
          const q = Math.floor(d.getMonth() / 3) + 1;
          const key = `${y}-Q${q}`;
          const existing = quartersMap.get(key);
          if (existing) {
            existing.amount += p.lawyerAmount || 0;
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
        if (p.date >= from && p.date <= to && p.status === "Completed") {
          const y = p.date.slice(0, 4);
          if (yearsMap.has(y)) {
            yearsMap.set(y, (yearsMap.get(y) ?? 0) + (p.lawyerAmount || 0));
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
    <div className="space-y-6 w-full max-w-5xl mx-auto pb-12">
      <PageHeader
        title="Revenue Overview"
        description="View your net consultation earnings, payout balance, and transaction history."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outlined"
              icon={
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
                />
              }
              onClick={() => fetchRevenueData(true)}
              disabled={isLoading || isRefreshing}
            >
              Refresh
            </Button>
            <Button
              variant="filled"
              icon={<Wallet className="h-4 w-4" />}
              onClick={() => setWithdrawModalOpen(true)}
            >
              Withdraw
            </Button>
          </div>
        }
      />

      {fetchError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 flex items-center justify-between gap-3 text-destructive text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
          <Button
            variant="text"
            className="text-xs text-destructive hover:underline"
            onClick={() => fetchRevenueData(false)}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Financial Metrics Cards */}
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
              {isLoading ? (
                <div className="h-6 w-20 bg-muted/60 animate-pulse rounded-md" />
              ) : (
                formatInr(lastMonthEarnings)
              )}
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
              {isLoading ? (
                <div className="h-6 w-20 bg-muted/60 animate-pulse rounded-md" />
              ) : (
                formatInr(thisMonthEarnings)
              )}
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
              {isLoading ? (
                <div className="h-6 w-24 bg-muted/60 animate-pulse rounded-md" />
              ) : (
                formatInr(totalEarnings)
              )}
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
              {isLoading ? (
                <div className="h-6 w-20 bg-muted/60 animate-pulse rounded-md" />
              ) : (
                formatInr(revenueLeftToWithdraw)
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Chart Section */}
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-foreground">Earnings Trend</h3>
            <p className="text-[11px] text-muted-foreground">
              Net consultation earnings credited to your balance over time
            </p>
          </div>
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
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <CircularProgress indeterminate ariaLabel="Loading chart" className="h-6 w-6 text-primary" />
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-xs">
              <p>No earnings recorded in the selected period.</p>
            </div>
          ) : (
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
          )}
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
            {isLoading ? (
              <div className="py-12 flex items-center justify-center">
                <CircularProgress indeterminate ariaLabel="Loading payments" className="h-6 w-6 text-primary" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  No client payments recorded in the selected date range.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pagePayments.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border/80 bg-background/70 p-3.5 shadow-2xs space-y-2.5 transition-all hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-foreground text-sm">
                          {p.citizenName || "Client Consultation"}
                        </div>
                        <div className="truncate text-[10.5px] text-muted-foreground">
                          {p.caseTitle || (p.source === "commission" ? "Case Consultation Fee" : "Subscription Fee")}
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
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-muted-foreground font-mono">
                          {new Date(`${p.date}T00:00:00`).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        {p.grossAmount > p.lawyerAmount && (
                          <div className="text-[10px] text-muted-foreground font-mono">
                            Gross: {formatInr(p.grossAmount)} • Platform: {formatInr(p.platformAmount)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-semibold text-muted-foreground">Net Payout</div>
                        <div className="font-mono font-bold text-emerald-600">
                          {formatInr(p.lawyerAmount)}
                        </div>
                      </div>
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
            {isLoading ? (
              <div className="py-12 flex items-center justify-center">
                <CircularProgress indeterminate ariaLabel="Loading withdrawals" className="h-6 w-6 text-primary" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Wallet className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  No withdrawal history found. Click "Withdraw" above to initiate a payout request.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {pageWithdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-xl border border-border/80 bg-background/70 p-3.5 shadow-2xs space-y-2.5 transition-all hover:border-primary/30"
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
                          {w.bankName || "Registered Bank"} {w.accountNumber ? `(•••• ${w.accountNumber.slice(-4)})` : ""}
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
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Settled On:</span>
                          <span className="font-mono text-foreground">
                            {w.processedAt}
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

      {/* WITHDRAWAL DIALOG */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen} maxWidth="500px">
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
            <div className="space-y-4">
              {/* Balance Card */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Available Balance to Withdraw
                </span>
                <div className="text-2xl font-black text-primary font-mono">
                  {formatInr(revenueLeftToWithdraw)}
                </div>
              </div>

              {revenueLeftToWithdraw < 500 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    Minimum withdrawal amount is <strong>₹500</strong>. You will be able to request a
                    payout once your available balance reaches or exceeds ₹500.
                  </span>
                </div>
              )}

              {withdrawError && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 flex items-start gap-2 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{withdrawError}</span>
                </div>
              )}

              {/* Destination Bank Account Section */}
              <div className="rounded-xl border border-border bg-background p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span>Destination Bank Account</span>
                  </div>
                  {lawyerProfile?.bankName && !isEditingBank && (
                    <button
                      type="button"
                      onClick={() => setIsEditingBank(true)}
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Change</span>
                    </button>
                  )}
                </div>

                {isEditingBank ? (
                  <form onSubmit={handleSaveBankDetails} className="space-y-3 pt-1 border-t border-border/60">
                    <p className="text-[11px] text-muted-foreground">
                      Please enter your bank account information to receive direct settlements.
                    </p>
                    <TextField
                      label="Bank Name"
                      required
                      value={bankNameInput}
                      onChange={setBankNameInput}
                      placeholder="e.g. State Bank of India, HDFC Bank"
                      className="w-full text-xs"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <TextField
                        label="Account Number"
                        required
                        value={accountNumberInput}
                        onChange={setAccountNumberInput}
                        placeholder="Account number"
                        className="w-full text-xs font-mono"
                      />
                      <TextField
                        label="IFSC Code"
                        required
                        value={ifscCodeInput}
                        onChange={(v) => setIfscCodeInput(v.toUpperCase())}
                        placeholder="e.g. SBIN0001234"
                        className="w-full text-xs font-mono uppercase"
                      />
                    </div>

                    {bankSaveError && (
                      <p className="text-[11px] text-destructive">{bankSaveError}</p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      {lawyerProfile?.bankName && (
                        <Button
                          type="button"
                          variant="text"
                          onClick={() => {
                            setIsEditingBank(false);
                            setBankSaveError(null);
                          }}
                          disabled={isSavingBank}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="submit"
                        variant="filled"
                        disabled={isSavingBank || !bankNameInput || !accountNumberInput || !ifscCodeInput}
                        icon={
                          isSavingBank ? (
                            <CircularProgress indeterminate ariaLabel="Saving" className="h-3.5 w-3.5" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )
                        }
                      >
                        {isSavingBank ? "Saving…" : "Save Account"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{lawyerProfile?.bankName}</p>
                      <p className="font-mono text-muted-foreground text-[11px]">
                        A/C: •••• •••• {lawyerProfile?.accountNumber?.slice(-4) || "••••"} • IFSC: {lawyerProfile?.ifscCode}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                      Verified
                    </span>
                  </div>
                )}
              </div>

              {/* Amount form */}
              <form onSubmit={handleConfirmWithdraw} className="space-y-4">
                <div className="space-y-1.5">
                  <TextField
                    label="Withdrawal Amount (₹)"
                    type="number"
                    required
                    value={withdrawAmount}
                    onChange={setWithdrawAmount}
                    placeholder="Enter amount"
                    disabled={revenueLeftToWithdraw < 500 || isEditingBank}
                    className="w-full font-mono"
                  />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Min limit: ₹500</span>
                    <span>Max available: {formatInr(revenueLeftToWithdraw)}</span>
                  </div>
                </div>

                {revenueLeftToWithdraw >= 500 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount("500")}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs font-mono font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer"
                    >
                      ₹500
                    </button>
                    {revenueLeftToWithdraw >= 1000 && (
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount("1000")}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-mono font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        ₹1,000
                      </button>
                    )}
                    {revenueLeftToWithdraw >= 5000 && (
                      <button
                        type="button"
                        onClick={() => setWithdrawAmount("5000")}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-mono font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer"
                      >
                        ₹5,000
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(revenueLeftToWithdraw.toString())}
                      className="rounded-lg border border-primary/40 bg-primary/5 px-2.5 py-1 text-xs font-mono font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      Full Balance
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Settlements are processed directly to your registered bank account via IMPS/NEFT.</span>
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
                    disabled={
                      isSubmittingWithdraw ||
                      isEditingBank ||
                      revenueLeftToWithdraw < 500 ||
                      !withdrawAmount ||
                      Number(withdrawAmount) < 500 ||
                      Number(withdrawAmount) > revenueLeftToWithdraw
                    }
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
            </div>
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
                    {formatInr(createdWithdrawal?.amount || Number(withdrawAmount) || 0)}
                  </strong>{" "}
                  has been submitted for processing to{" "}
                  <strong>{createdWithdrawal?.bankName || lawyerProfile?.bankName || "your bank"}</strong>.
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 p-3 text-left space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Request ID:</span>
                  <span className="font-bold text-foreground">
                    {createdWithdrawal?.id || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-bold text-amber-600">Pending Admin Approval</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Est. Settlement:</span>
                  <span className="font-bold text-emerald-600">Within 24-48 Hours</span>
                </div>
              </div>

              <Button
                variant="filled"
                onClick={() => {
                  setWithdrawModalOpen(false);
                  setActiveTab("withdrawals");
                }}
                className="w-full"
              >
                View Withdraw History
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
