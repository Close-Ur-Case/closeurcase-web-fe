import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import {
  CheckCircle2,
  CreditCard,
  History,
  IndianRupee,
  Sparkles,
  ShieldCheck,
  Zap,
  Crown,
  Calendar,
  Star,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  Award,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import {
  Button,
  Card,
  CircularProgress,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/m3";
import {
  addSubscription,
  getPayments,
  getSubscriptions,
  isSubscriptionActive,
  mergeRemotePayments,
  subscribeToStore,
} from "@/data/appStore";
import {
  SUBSCRIPTION_TIERS,
  getTierConfig,
  normalizeSubscriptionTier,
  type SubscriptionTierId,
} from "@/data/subscriptionTiers";
import { SubscriptionExpiryModal } from "@/components/app/SubscriptionExpiryModal";
import { FREE_PLAN, SUBSCRIPTION_PLANS } from "@/data/subscriptionPlans";
import { useAuth } from "@/context/useAuth";
import { subscriptionService } from "@/services/subscriptionService";
import { paymentService } from "@/services/paymentService";
import { useRazorpayCheckout } from "@/hooks/useRazorpayCheckout";
import type { Payment, Subscription, SubscriptionPlanId } from "@/types";
import type { SubscriptionPlanItem } from "@/types/api";

interface TierConfig {
  tierName: string;
  badgeText: string;
  icon: typeof Award;
  cardClasses: string;
  badgeClasses: string;
  iconBgClasses: string;
  iconColorClasses: string;
  titleColorClasses: string;
  featureCheckClasses: string;
  dividerClasses: string;
  buttonVariant: "filled" | "outlined";
  buttonStyle?: CSSProperties;
  buttonClass?: string;
}

const TIER_THEMES: Record<string, TierConfig> = {
  free: {
    tierName: "Bronze Tier",
    badgeText: "BRONZE TIER",
    icon: Award,
    cardClasses:
      "border-2 border-[#8B5E3C]/60 dark:border-[#A06830]/70 bg-gradient-to-b from-[#8B5E3C]/10 via-[#8B5E3C]/5 to-card dark:from-[#7A4B1B]/30 dark:via-card dark:to-card p-6 rounded-3xl shadow-sm hover:border-[#8B5E3C] hover:shadow-md transition-all",
    badgeClasses: "bg-[#7A4B1B] text-white font-extrabold shadow-xs border border-[#A06830]/50",
    iconBgClasses: "bg-[#7A4B1B] text-white shadow-md border border-[#A06830]",
    iconColorClasses: "text-white fill-white/20",
    titleColorClasses: "text-[#7A4B1B] dark:text-[#D4A373] font-extrabold text-2xl",
    featureCheckClasses: "text-[#8B5E3C] dark:text-[#D4A373]",
    dividerClasses: "border-border text-foreground font-bold",
    buttonVariant: "outlined",
    buttonClass:
      "border-2 border-[#8B5E3C] dark:border-[#A06830] text-[#7A4B1B] dark:text-[#D4A373] font-extrabold hover:bg-[#7A4B1B] hover:text-white transition-all",
  },
  daily: {
    tierName: "Copper Tier",
    badgeText: "₹1/DAY • MICRO PASS",
    icon: Zap,
    cardClasses:
      "border-2 border-teal-500/60 dark:border-teal-400/60 bg-gradient-to-b from-teal-500/15 via-teal-500/5 to-card dark:from-teal-950/40 dark:via-card dark:to-card p-6 rounded-3xl shadow-sm hover:border-teal-500 hover:shadow-md transition-all",
    badgeClasses: "bg-teal-600 dark:bg-teal-500 text-white font-extrabold shadow-xs",
    iconBgClasses: "bg-teal-600 dark:bg-teal-500 text-white shadow-md shadow-teal-500/20",
    iconColorClasses: "text-white fill-white",
    titleColorClasses: "text-teal-700 dark:text-teal-300 font-extrabold text-2xl",
    featureCheckClasses: "text-teal-600 dark:text-teal-400",
    dividerClasses: "border-border text-foreground font-bold",
    buttonVariant: "filled",
    buttonStyle: {
      "--md-filled-button-container-color": "#0d9488",
      "--md-filled-button-label-text-color": "#ffffff",
      "--md-filled-button-hover-label-text-color": "#ffffff",
      "--md-filled-button-pressed-label-text-color": "#ffffff",
      "--md-filled-button-focus-label-text-color": "#ffffff",
    } as CSSProperties,
    buttonClass: "bg-teal-600 text-white font-extrabold hover:bg-teal-700 shadow-sm",
  },
  monthly: {
    tierName: "Silver Tier",
    badgeText: "SILVER • POPULAR",
    icon: ShieldCheck,
    cardClasses:
      "border-2 border-slate-400 dark:border-slate-500 bg-gradient-to-b from-slate-200/50 via-slate-100/20 to-card dark:from-slate-900/60 dark:via-card dark:to-card p-6 rounded-3xl shadow-md hover:border-slate-500 hover:shadow-lg transition-all",
    badgeClasses:
      "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 font-extrabold shadow-xs",
    iconBgClasses: "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 shadow-md",
    iconColorClasses: "text-white dark:text-slate-950 fill-white/20 dark:fill-slate-950/20",
    titleColorClasses: "text-slate-900 dark:text-slate-100 font-extrabold text-2xl",
    featureCheckClasses: "text-slate-700 dark:text-slate-300",
    dividerClasses: "border-border text-foreground font-bold",
    buttonVariant: "filled",
    buttonStyle: {
      "--md-filled-button-container-color": "#1e293b",
      "--md-filled-button-label-text-color": "#ffffff",
      "--md-filled-button-hover-label-text-color": "#ffffff",
      "--md-filled-button-pressed-label-text-color": "#ffffff",
      "--md-filled-button-focus-label-text-color": "#ffffff",
    } as CSSProperties,
    buttonClass: "dark:bg-slate-100 dark:text-slate-950 font-extrabold shadow-sm",
  },
  yearly: {
    tierName: "Gold Tier",
    badgeText: "GOLD • SAVE 17%",
    icon: Crown,
    cardClasses:
      "border-2 border-amber-400 dark:border-yellow-400 bg-gradient-to-b from-amber-400/20 via-amber-400/5 to-card dark:from-amber-950/40 dark:via-card dark:to-card p-6 rounded-3xl shadow-lg hover:border-yellow-400 hover:shadow-xl transition-all",
    badgeClasses: "bg-amber-500 dark:bg-yellow-400 text-slate-950 font-black shadow-xs",
    iconBgClasses: "bg-amber-500 dark:bg-yellow-400 text-slate-950 shadow-md shadow-amber-500/20",
    iconColorClasses: "text-slate-950 fill-slate-950",
    titleColorClasses: "text-amber-700 dark:text-yellow-400 font-extrabold text-2xl",
    featureCheckClasses: "text-amber-500 dark:text-yellow-400",
    dividerClasses: "border-border text-foreground font-bold",
    buttonVariant: "filled",
    buttonStyle: {
      "--md-filled-button-container-color": "#eab308",
      "--md-filled-button-label-text-color": "#0f172a",
      "--md-filled-button-hover-label-text-color": "#0f172a",
      "--md-filled-button-pressed-label-text-color": "#0f172a",
      "--md-filled-button-focus-label-text-color": "#0f172a",
    } as CSSProperties,
    buttonClass:
      "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black hover:brightness-110 shadow-md",
  },
};

const CITIZEN_ID = "u_001";

type HistoryTab = "Subscription" | "Consultation";

interface CitizenSubscriptionsSearchParams {
  returnTo?: string;
}

export const Route = createFileRoute("/citizen/subscriptions")({
  head: () => ({ meta: [{ title: "My Subscriptions — CloseUrCase" }] }),
  validateSearch: (s: Record<string, unknown>): CitizenSubscriptionsSearchParams => ({
    returnTo: typeof s.returnTo === "string" ? s.returnTo : undefined,
  }),
  component: MySubscriptions,
});

const STATUS_STYLE: Record<Subscription["status"], string> = {
  Active: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  Expired: "bg-muted text-muted-foreground border border-border",
  Cancelled: "bg-destructive/15 text-destructive border border-destructive/25",
};

/** md-outlined-button's label/outline colors come from CSS custom properties,
 * not regular CSS — plain Tailwind text/border classes can't reach past its
 * shadow DOM, so the white styling for this button on the dark VIP hero card
 * has to be set this way instead. */
const vipManageButtonStyle: CSSProperties = {
  "--md-outlined-button-label-text-color": "#ffffff",
  "--md-outlined-button-hover-label-text-color": "#ffffff",
  "--md-outlined-button-pressed-label-text-color": "#ffffff",
  "--md-outlined-button-focus-label-text-color": "#ffffff",
  "--md-outlined-button-outline-color": "rgba(255,255,255,0.3)",
  "--md-outlined-button-hover-state-layer-color": "#ffffff",
} as CSSProperties;

/** Inverted filled button for the highlighted "Popular" plan card, whose
 * body is `bg-primary`: an on-primary (white) container with a primary
 * label, both pulled from the M3 theme tokens. Same escape-hatch pattern as
 * `vipManageButtonStyle`. */
const popularButtonStyle: CSSProperties = {
  "--md-filled-button-container-color": "var(--md-sys-color-on-primary)",
  "--md-filled-button-label-text-color": "var(--md-sys-color-primary)",
  "--md-filled-button-hover-label-text-color": "var(--md-sys-color-primary)",
  "--md-filled-button-pressed-label-text-color": "var(--md-sys-color-primary)",
  "--md-filled-button-focus-label-text-color": "var(--md-sys-color-primary)",
  "--md-filled-button-hover-state-layer-color": "var(--md-sys-color-primary)",
} as CSSProperties;

const CONSULTATION_STATUS_STYLE: Record<Payment["status"], string> = {
  Completed:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  Processing: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25",
};

export function getSubscriptionDateTimes(sub: Subscription & { createdAt?: string }) {
  let startObj: Date;
  if (sub.createdAt && !isNaN(new Date(sub.createdAt).getTime())) {
    startObj = new Date(sub.createdAt);
  } else if (sub.startedAt && !isNaN(new Date(sub.startedAt).getTime())) {
    startObj = new Date(sub.startedAt);
  } else {
    startObj = new Date();
  }

  let expiryObj: Date;
  if (
    sub.expiresAt &&
    !isNaN(new Date(sub.expiresAt).getTime()) &&
    (sub.expiresAt.includes("T") || sub.expiresAt.includes(":"))
  ) {
    expiryObj = new Date(sub.expiresAt);
  } else if (sub.expiresAt && !isNaN(new Date(sub.expiresAt).getTime())) {
    expiryObj = new Date(sub.expiresAt);
    expiryObj.setHours(startObj.getHours(), startObj.getMinutes(), startObj.getSeconds());
  } else {
    expiryObj = new Date(startObj);
    if (sub.planId === "daily") {
      expiryObj.setDate(expiryObj.getDate() + 1);
    } else if (sub.planId === "monthly") {
      expiryObj.setMonth(expiryObj.getMonth() + 1);
    } else if (sub.planId === "yearly") {
      expiryObj.setFullYear(expiryObj.getFullYear() + 1);
    } else {
      expiryObj.setDate(expiryObj.getDate() + 30);
    }
  }

  const fmt = (d: Date) =>
    d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  return {
    subscribedOn: fmt(startObj),
    expiresOn: fmt(expiryObj),
  };
}

export function MySubscriptions() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const returnTarget =
    searchParams.returnTo ||
    (typeof window !== "undefined" ? sessionStorage.getItem("cuc_return_after_payment") : null);

  const { user } = useAuth();
  // Payments and subscriptions reference the citizen *record* id ("u_001"),
  // not the Supabase auth UUID that `user.id` holds.
  const citizenId = user?.citizenId || user?.id || "u_001";

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    getSubscriptions(citizenId),
  );
  const [payments, setPayments] = useState<Payment[]>(() =>
    getPayments().filter((p) => p.citizenId === citizenId && p.source === "commission"),
  );
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(() => [
    FREE_PLAN,
    ...SUBSCRIPTION_PLANS,
  ]);
  const [subscribingPlan, setSubscribingPlan] = useState<SubscriptionPlanId | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const { startCheckout } = useRazorpayCheckout();
  const [historyTab, setHistoryTab] = useState<HistoryTab>("Subscription");
  const [showManageModal, setShowManageModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // The API scopes payments to the signed-in citizen; the local filter below
    // narrows further to consultation commissions for the receipts tab.
    paymentService
      .getPayments()
      .then((data) => {
        mergeRemotePayments(data as Partial<Payment>[]);
      })
      .catch((err: unknown) => {
        console.warn("[Citizen Subscriptions] Payments fetch notice:", err);
      });

    subscriptionService.getPlans().then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        setPlans(items);
      }
    });
    subscriptionService.listSubscriptions(citizenId).then((items) => {
      if (Array.isArray(items) && items.length > 0) {
        setSubscriptions(items as unknown as Subscription[]);
      }
    });
  }, [citizenId]);

  useEffect(
    () => subscribeToStore(() => setSubscriptions(getSubscriptions(citizenId))),
    [citizenId],
  );
  useEffect(
    () =>
      subscribeToStore(() =>
        setPayments(
          getPayments().filter((p) => p.citizenId === citizenId && p.source === "commission"),
        ),
      ),
    [citizenId],
  );

  const activeSub = subscriptions.find((s) => isSubscriptionActive(s));
  const activePlanId = activeSub?.planId;
  const activeDates = activeSub ? getSubscriptionDateTimes(activeSub) : null;
  const activeTierConfig = activeSub ? getTierConfig(activeSub.planId) : null;
  const ActiveTierIcon = activeTierConfig?.icon || Crown;

  const latestExpiredSub = !activeSub
    ? subscriptions.find((s) => s.status === "Expired" || !isSubscriptionActive(s))
    : null;
  const expiredDates = latestExpiredSub ? getSubscriptionDateTimes(latestExpiredSub) : null;

  const [showExpiryModal, setShowExpiryModal] = useState(false);

  useEffect(() => {
    if (latestExpiredSub && !activeSub) {
      const dismissedKey = `cuc_dismissed_expiry_modal_${latestExpiredSub.id}`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(dismissedKey)) {
        setShowExpiryModal(true);
      }
    }
  }, [latestExpiredSub, activeSub]);

  async function handleSubscribe(planId: SubscriptionPlanId, label: string, amount: number) {
    setSubscribingPlan(planId);
    setSubscribeError(null);
    try {
      if (amount > 0) {
        // Paid plans must be collected before activation. `verify-payment`
        // validates the signature, writes the receipt and activates the plan in
        // one server-side step, so there's no separate createSubscription call.
        const result = await startCheckout({
          amount,
          description: `${label} Auto-Assign plan`,
          prefill: { name: user?.name, email: user?.email ?? undefined },
          verification: {
            source: "subscription",
            grossAmount: amount,
            citizenId,
            citizenName: user?.name,
            planId,
            planLabel: label,
          },
        });

        // `null` means the citizen closed the checkout — leave the plan alone.
        if (!result) return;
        if (result.payment) mergeRemotePayments([result.payment as Partial<Payment>]);
        if (result.subscription) addSubscription(result.subscription);
      } else {
        // The free tier takes no payment, so it activates directly.
        await subscriptionService.createSubscription({
          citizenId,
          planId,
          planLabel: label,
          amount,
        });
      }

      const updated = await subscriptionService.listSubscriptions(citizenId);
      setSubscriptions(updated as unknown as Subscription[]);

      const target =
        searchParams.returnTo ||
        (typeof window !== "undefined" ? sessionStorage.getItem("cuc_return_after_payment") : null);
      if (target) {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("cuc_return_after_payment");
        }
        navigate({ to: target });
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not activate this plan.";
      setSubscribeError(message);
      console.error("Failed to activate subscription:", err);
    } finally {
      setSubscribingPlan(null);
    }
  }

  async function handleCancelSubscription(id: string) {
    setIsCancelling(true);
    try {
      await subscriptionService.cancelSubscription(id);
      const updated = await subscriptionService.listSubscriptions(citizenId);
      setSubscriptions(updated as unknown as Subscription[]);
      setShowManageModal(false);
    } catch (err) {
      console.error("Failed to cancel subscription:", err);
    } finally {
      setIsCancelling(false);
    }
  }

  const totalSubscriptionSpent = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const totalConsultationSpent = payments.reduce((sum, p) => sum + p.grossAmount, 0);

  return (
    <div className="space-y-6 max-w-6xl pb-8">
      <PageHeader
        title="My Subscriptions"
        description="Manage your Auto-Assign plan, view active VIP perks, and track your billing history."
      />

      {returnTarget && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-4 text-xs shadow-sm">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-indigo-500 shrink-0" />
            <div>
              <div className="font-extrabold text-foreground text-sm">
                Activate Subscription for Auto-Assign
              </div>
              <div className="text-muted-foreground text-[11px] mt-0.5">
                Your draft case details are safely stored. Choose a plan to activate
                auto-assignment, and you'll be redirected back to finish filing.
              </div>
            </div>
          </div>
          <Button
            variant="outlined"
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.removeItem("cuc_return_after_payment");
              }
              navigate({ to: returnTarget });
            }}
            className="shrink-0 text-xs font-bold"
          >
            Return to Case Filing
          </Button>
        </div>
      )}

      {subscribeError && (
        <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{subscribeError}</span>
        </div>
      )}

      {/* ── ACTIVE VIP MEMBERSHIP CARD / HERO BANNER ──────────────── */}
      {activeSub ? (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl">
          {/* Ambient Glows */}
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/25 animate-pulse" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  <ActiveTierIcon className="h-3 w-3 text-amber-400" /> ACTIVE VIP SUBSCRIPTION
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                  {activeSub.planLabel} Priority Pass
                </h2>
                <p className="mt-1 text-xs text-indigo-200/80 leading-relaxed max-w-xl">
                  Your active membership routes all your legal cases straight to senior legal admins
                  for instant specialist advocate allocation.
                </p>
              </div>

              {/* VIP Perks Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white border border-white/15">
                  <Zap className="h-3 w-3 text-amber-400" /> Fast-Track Admin Match
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white border border-white/15">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" /> Verified Advocates
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white border border-white/15">
                  <Calendar className="h-3 w-3 text-purple-300" /> Billed {activeSub.planLabel}
                </span>
                {activeDates && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-400/30">
                    <Clock className="h-3 w-3 text-emerald-400" /> Active until {activeDates.expiresOn}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col justify-between gap-3 border-t lg:border-t-0 lg:border-l border-indigo-800/60 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-72">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-300">
                  Status
                </span>
                <div className="text-xl font-black text-white flex items-baseline gap-1">
                  ₹{activeSub.amount}
                  <span className="text-xs font-normal text-indigo-300">/ period</span>
                </div>
              </div>

              {/* Subscribed on datetime & Expiry datetime */}
              <div className="w-full space-y-1.5 rounded-xl bg-white/5 border border-white/10 p-2.5 text-xs text-indigo-200/90">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-indigo-300/80 font-medium text-[11px]">Subscribed on:</span>
                  <span className="font-semibold text-white text-[11px]">
                    {activeDates?.subscribedOn}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-1.5">
                  <span className="text-indigo-300/80 font-medium text-[11px]">Expires on:</span>
                  <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activeDates?.expiresOn}
                  </span>
                </div>
              </div>

              <Button
                variant="outlined"
                className="text-xs font-bold h-9 px-4 rounded-xl w-full flex items-center justify-center gap-1.5"
                style={vipManageButtonStyle}
                onClick={() => setShowManageModal(true)}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Manage Subscription</span>
              </Button>
            </div>
          </div>
        </div>
      ) : latestExpiredSub ? (
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/40 bg-gradient-to-br from-slate-950 via-rose-950/30 to-slate-900 text-white p-5 sm:p-6 shadow-xl">
          {/* Ambient Glows */}
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-rose-500 ring-4 ring-rose-500/25 animate-pulse" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 border border-rose-400/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-rose-300">
                  <AlertCircle className="h-3 w-3 text-rose-400" /> PLAN EXPIRED — RENEWAL REQUIRED
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
                    {latestExpiredSub.planLabel} Expired
                  </h2>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 px-3 py-0.5 text-xs font-bold text-amber-300 shadow-sm">
                    <Award className="h-3.5 w-3.5 text-amber-400" />
                    Account Auto-Set to Bronze Free Tier
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-200/80 leading-relaxed max-w-xl">
                  Your Auto-Assign membership has expired. Your account has been automatically set to the{" "}
                  <strong className="text-amber-300 font-bold">Bronze Free Tier</strong>. Priority lawyer
                  matching is paused. Choose a plan below to renew or upgrade and reactivate instant advocate allocation.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs">
                {expiredDates && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/20 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-rose-300 border border-rose-400/30">
                    <Clock className="h-3.5 w-3.5 text-rose-400" /> Expired on {expiredDates.expiresOn}
                  </span>
                )}
                {expiredDates && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md px-2.5 py-1 text-[11px] font-semibold text-white border border-white/15">
                    <Calendar className="h-3.5 w-3.5 text-slate-300" /> Subscribed on {expiredDates.subscribedOn}
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col justify-between gap-3 border-t lg:border-t-0 lg:border-l border-rose-800/60 pt-4 lg:pt-0 lg:pl-6 w-full lg:w-72">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider font-bold text-rose-300">
                  Subscription Status
                </span>
                <div className="text-lg font-black text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> Expired
                </div>
              </div>

              <div className="flex items-center gap-2 w-full">
                <Button
                  variant="outlined"
                  className="text-xs font-bold h-9 px-3 rounded-xl flex-1"
                  style={vipManageButtonStyle}
                  onClick={() => setShowExpiryModal(true)}
                >
                  View Details
                </Button>
                <Button
                  variant="filled"
                  className="text-xs font-extrabold h-9 px-4 rounded-xl flex-1 bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                  onClick={() => {
                    const el = document.getElementById("subscription-plans");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Renew Plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">
                <Sparkles className="h-3 w-3 text-primary" /> Auto-Assign Legal Dispatch
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Get Instant Advocate Assignment with VIP Subscriptions
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Choose a plan to automatically route your legal cases directly to our admin team. No
                manual searching needed.
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-xs font-extrabold shadow-md">
                <ShieldCheck className="h-4 w-4" /> 100% Satisfaction Guarantee
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTION PLANS GRID ─────────────────────────────────── */}
      <div id="subscription-plans" className="space-y-4">
        <div>
          <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
            <CreditCard className="h-4.5 w-4.5 text-primary" />
            Available Plans
          </h2>
          <p className="text-xs text-muted-foreground">
            Start free, or pick an Auto-Assign plan for priority lawyer matching.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isFree = plan.id === "free";
            const isCurrent = isFree ? !activePlanId : activePlanId === plan.id;
            const isSubscribing = subscribingPlan === plan.id;
            const theme = TIER_THEMES[plan.id] || TIER_THEMES.free;

            return (
              <Card
                key={plan.id}
                variant="outlined"
                className={`relative flex h-full flex-col p-6 rounded-3xl transition-all duration-300 ${theme.cardClasses}`}
              >
                {/* Circle Constant Tier Icon & Tier Badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${theme.iconBgClasses}`}
                  >
                    <theme.icon className={`h-5 w-5 ${theme.iconColorClasses}`} />
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] tracking-wider ${theme.badgeClasses}`}
                  >
                    {isFree && !activePlanId && latestExpiredSub ? "Auto-Set Active" : theme.badgeText}
                  </span>
                </div>

                {/* Audience */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {plan.audience}
                  </span>
                </div>

                <h3 className={`mt-2 text-xl font-black ${theme.titleColorClasses}`}>
                  {plan.label}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-foreground">
                    {isFree ? "Free" : `₹${plan.price}`}
                  </span>
                  {plan.cadence && (
                    <span className="text-sm font-semibold text-muted-foreground">
                      {plan.cadence}
                    </span>
                  )}
                </div>

                <div
                  className={`mt-5 mb-3 border-t pt-4 text-xs font-bold ${theme.dividerClasses}`}
                >
                  What's included
                </div>

                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-xs">
                      <CheckCircle2
                        className={`mt-px h-4 w-4 shrink-0 ${theme.featureCheckClasses}`}
                      />
                      <span className="text-foreground font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto pt-6">
                  <Button
                    className={`w-full h-10 text-xs font-bold rounded-xl ${theme.buttonClass ?? ""}`}
                    variant={isCurrent || isFree ? "outlined" : theme.buttonVariant}
                    style={
                      theme.buttonStyle
                        ? isCurrent
                          ? vipManageButtonStyle
                          : theme.buttonStyle
                        : undefined
                    }
                    disabled={isCurrent || isFree || isSubscribing}
                    onClick={() =>
                      handleSubscribe(plan.id as SubscriptionPlanId, plan.label, plan.price)
                    }
                  >
                    {isSubscribing ? (
                      <span className="flex items-center justify-center gap-2">
                        <CircularProgress
                          indeterminate
                          ariaLabel="Subscribing"
                          className="h-4 w-4"
                        />
                        Processing…
                      </span>
                    ) : isCurrent ? (
                      "Current plan"
                    ) : isFree ? (
                      "Included"
                    ) : latestExpiredSub?.planId === plan.id ? (
                      `Renew plan (₹${plan.price})`
                    ) : (
                      `Get started (₹${plan.price})`
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── BILLING & TRANSACTION HISTORY ──────────────────────────── */}
      <Card
        variant="elevated"
        className="space-y-4 p-5 sm:p-7 rounded-3xl border border-border/80 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Billing & Subscription History</h2>
              <p className="text-[11px] text-muted-foreground">
                All receipts and transactions associated with your citizen account.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {historyTab === "Subscription" && subscriptions.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Total Invested:</span>
                <span className="font-black text-foreground text-sm flex items-center">
                  <IndianRupee className="h-3.5 w-3.5 text-primary" />
                  {totalSubscriptionSpent}
                </span>
              </div>
            )}
            {historyTab === "Consultation" && payments.length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Total Invested:</span>
                <span className="font-black text-foreground text-sm flex items-center">
                  <IndianRupee className="h-3.5 w-3.5 text-primary" />
                  {totalConsultationSpent}
                </span>
              </div>
            )}

            <SegmentedControl
              value={historyTab}
              onChange={setHistoryTab}
              options={[
                { value: "Subscription", label: "Subscription" },
                { value: "Consultation", label: "Consultation" },
              ]}
            />
          </div>
        </div>

        {historyTab === "Subscription" ? (
          subscriptions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center space-y-2">
              <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/50" />
              <p className="text-xs font-semibold text-foreground">No subscription history yet</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Subscribe to an Auto-Assign plan above to start routing cases directly to expert
                advocates.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 hover:bg-accent/40 p-4 transition-all text-xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {(() => {
                      const itemTier = getTierConfig(sub.planId);
                      const ItemIcon = itemTier.icon;
                      return (
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${itemTier.iconBgClasses}`}
                        >
                          <ItemIcon className={`h-5 w-5 ${itemTier.iconColorClasses}`} />
                        </div>
                      );
                    })()}
                    <div className="min-w-0">
                      <div className="font-extrabold text-foreground text-sm truncate flex items-center gap-2">
                        {sub.planLabel} Subscription Pass
                        {sub.caseId && (
                          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Case: {sub.caseId}
                          </span>
                        )}
                      </div>
                      {(() => {
                        const itemDates = getSubscriptionDateTimes(sub);
                        return (
                          <div className="mt-0.5 text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                            <span>Subscribed on {itemDates.subscribedOn}</span>
                            <span>•</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              Expires on {itemDates.expiresOn}
                            </span>
                            <span>•</span>
                            <span>Transaction ID: #{sub.id}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                    <div className="text-right">
                      <div className="flex items-center font-black text-foreground text-base">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        {sub.amount}
                      </div>
                      <div className="text-[10px] text-muted-foreground">GST Inclusive</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${STATUS_STYLE[sub.status]}`}
                      >
                        {sub.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center space-y-2">
            <IndianRupee className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="text-xs font-semibold text-foreground">No consultation history yet</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Payments made to lawyers for consultations and case handling will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {payments.map((p) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 hover:bg-accent/40 p-4 transition-all text-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold border border-primary/20">
                    <IndianRupee className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-foreground text-sm truncate flex items-center gap-2">
                      {p.lawyerName ?? "Lawyer"}
                      {p.caseId && (
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Case: {p.caseId}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground truncate">
                      {p.caseTitle}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-2">
                      <span>Paid on {p.date}</span>
                      <span>•</span>
                      <span>Transaction ID: #{p.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                  <div className="text-right">
                    <div className="flex items-center font-black text-foreground text-base">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      {p.grossAmount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">GST Inclusive</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${CONSULTATION_STATUS_STYLE[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── MANAGE SUBSCRIPTION DIALOG ──────────────────────────── */}
      {showManageModal && activeSub && (
        <Dialog open={showManageModal} onOpenChange={setShowManageModal} maxWidth="480px">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0">
                <ActiveTierIcon className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-extrabold text-foreground">
                  Manage VIP Subscription
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground">
                  Active membership details and billing controls
                </p>
              </div>
            </div>
          </DialogHeader>

          <DialogContent className="space-y-3 pt-1 text-xs">
            <div className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-muted/20 px-3.5 py-0.5 text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground font-medium">Plan</span>
                <span className="font-extrabold text-foreground">
                  {activeSub.planLabel} Priority Pass
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground font-medium">Status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active VIP
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground font-medium">Billing Amount</span>
                <span className="font-extrabold text-foreground">₹{activeSub.amount}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground font-medium">Subscribed Date</span>
                <span className="font-semibold text-foreground">{activeDates?.subscribedOn}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground font-medium">Expiry Date</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {activeDates?.expiresOn}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Cancelling your subscription will discontinue auto-dispatch privileges on future
                cases. Existing assigned cases will remain active with their allocated advocates.
              </p>
            </div>
          </DialogContent>

          <DialogFooter className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="tonal" onClick={() => setShowManageModal(false)}>
              Keep Plan
            </Button>
            <Button
              variant="outlined"
              disabled={isCancelling}
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => handleCancelSubscription(activeSub.id)}
            >
              {isCancelling ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* ── SUBSCRIPTION EXPIRY POPUP MODAL ───────────────────────── */}
      <SubscriptionExpiryModal
        open={showExpiryModal}
        onOpenChange={(open) => {
          setShowExpiryModal(open);
          if (!open && latestExpiredSub && typeof window !== "undefined") {
            sessionStorage.setItem(`cuc_dismissed_expiry_modal_${latestExpiredSub.id}`, "true");
          }
        }}
        subscription={latestExpiredSub}
        onRenew={() => {
          const el = document.getElementById("subscription-plans");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
      />
    </div>
  );
}
