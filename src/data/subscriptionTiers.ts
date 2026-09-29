import { Award, Zap, ShieldCheck, Crown } from "lucide-react";
import type { ComponentType } from "react";

export type SubscriptionTierId = "bronze" | "silver" | "gold" | "micropass";

export interface SubscriptionTierConfig {
  id: SubscriptionTierId;
  label: string;
  shortLabel: string;
  planName: string;
  badgeText: string;
  icon: ComponentType<{ className?: string }>;
  // Avatar ring and corner badge styling
  ringCls: string;
  badgeCls: string;
  iconCls: string;
  // Full badge pill styling (profile page & headers)
  pillCls: string;
  pillIconCls: string;
  // Subscriptions card theme
  cardClasses: string;
  iconBgClasses: string;
  iconColorClasses: string;
  titleColorClasses: string;
  featureCheckClasses: string;
  badgeClasses: string;
  subtext: string;
}

/**
 * 4 FIXED CONSTANT ICONS & THEMES FOR CITIZEN SUBSCRIPTIONS:
 * - Bronze (Free / Default): Award medal (Award)
 * - Micro Pass (₹1/day Daily Pass): Lightning Bolt (Zap)
 * - Silver (Monthly Plan): Verified Shield (ShieldCheck)
 * - Gold (Yearly Plan): VIP Crown (Crown)
 */
export const SUBSCRIPTION_TIERS: Record<SubscriptionTierId, SubscriptionTierConfig> = {
  bronze: {
    id: "bronze",
    label: "Bronze Member",
    shortLabel: "Bronze",
    planName: "Bronze Tier (Free)",
    badgeText: "BRONZE TIER",
    icon: Award,
    ringCls: "ring-2 ring-[#8B5E3C] dark:ring-[#A06830]",
    badgeCls: "bg-[#7A4B1B] text-white border-2 border-background shadow-xs",
    iconCls: "text-white fill-white/20",
    pillCls: "bg-[#7A4B1B] text-white border border-[#A06830]/50 shadow-xs",
    pillIconCls: "text-[#D4A373]",
    cardClasses:
      "border-2 border-[#8B5E3C]/60 dark:border-[#A06830]/70 bg-gradient-to-b from-[#8B5E3C]/10 via-[#8B5E3C]/5 to-card dark:from-[#7A4B1B]/30 dark:via-card dark:to-card p-6 rounded-3xl shadow-sm hover:border-[#8B5E3C] hover:shadow-md transition-all",
    iconBgClasses: "bg-[#7A4B1B] text-white shadow-md border border-[#A06830]",
    iconColorClasses: "text-white fill-white/20",
    titleColorClasses: "text-[#7A4B1B] dark:text-[#D4A373] font-extrabold text-2xl",
    featureCheckClasses: "text-[#8B5E3C] dark:text-[#D4A373]",
    badgeClasses: "bg-[#7A4B1B] text-white font-extrabold shadow-xs border border-[#A06830]/50",
    subtext: "Standard Access • Pay Per Case",
  },
  micropass: {
    id: "micropass",
    label: "₹1 Micro Pass",
    shortLabel: "Micro Pass",
    planName: "Daily Pass (₹1/day)",
    badgeText: "₹1/DAY • MICRO PASS",
    icon: Zap,
    ringCls: "ring-2 ring-teal-500 dark:ring-teal-400",
    badgeCls: "bg-teal-600 text-white border-2 border-background shadow-xs shadow-teal-500/30",
    iconCls: "fill-white text-white",
    pillCls: "bg-teal-600 text-white border border-teal-500/40 shadow-xs shadow-teal-500/20",
    pillIconCls: "text-teal-300 fill-teal-300/30",
    cardClasses:
      "border-2 border-teal-500/60 dark:border-teal-400/60 bg-gradient-to-b from-teal-500/15 via-teal-500/5 to-card dark:from-teal-950/40 dark:via-card dark:to-card p-6 rounded-3xl shadow-sm hover:border-teal-500 hover:shadow-md transition-all",
    iconBgClasses: "bg-teal-600 dark:bg-teal-500 text-white shadow-md shadow-teal-500/20",
    iconColorClasses: "text-white fill-white",
    titleColorClasses: "text-teal-700 dark:text-teal-300 font-extrabold text-2xl",
    featureCheckClasses: "text-teal-600 dark:text-teal-400",
    badgeClasses: "bg-teal-600 dark:bg-teal-500 text-white font-extrabold shadow-xs",
    subtext: "24h Micro Pass • Instant Dispatch",
  },
  silver: {
    id: "silver",
    label: "Silver Member",
    shortLabel: "Silver",
    planName: "Silver Tier (Monthly)",
    badgeText: "SILVER • POPULAR",
    icon: ShieldCheck,
    ringCls: "ring-2 ring-slate-400 dark:ring-slate-500",
    badgeCls:
      "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-950 border-2 border-background shadow-xs",
    iconCls: "text-white dark:text-slate-950 fill-white/20 dark:fill-slate-950/20",
    pillCls:
      "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-950 border border-slate-600 dark:border-slate-300 shadow-xs",
    pillIconCls: "text-slate-300 dark:text-slate-700",
    cardClasses:
      "border-2 border-slate-400 dark:border-slate-500 bg-gradient-to-b from-slate-200/50 via-slate-100/20 to-card dark:from-slate-900/60 dark:via-card dark:to-card p-6 rounded-3xl shadow-md hover:border-slate-500 hover:shadow-lg transition-all",
    iconBgClasses: "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 shadow-md",
    iconColorClasses: "text-white dark:text-slate-950 fill-current",
    titleColorClasses: "text-slate-900 dark:text-slate-100 font-extrabold text-2xl",
    featureCheckClasses: "text-slate-700 dark:text-slate-300",
    badgeClasses:
      "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-950 font-extrabold shadow-xs",
    subtext: "Monthly Pass • Auto-Assign Included",
  },
  gold: {
    id: "gold",
    label: "Gold VIP Member",
    shortLabel: "Gold VIP",
    planName: "Gold Tier (Yearly)",
    badgeText: "GOLD • SAVE 17%",
    icon: Crown,
    ringCls: "ring-2 ring-amber-400 dark:ring-yellow-400",
    badgeCls:
      "bg-amber-400 text-slate-950 border-2 border-background shadow-xs shadow-amber-500/30",
    iconCls: "fill-slate-950 text-slate-950",
    pillCls:
      "bg-amber-400 text-slate-950 border border-amber-500/40 shadow-xs shadow-amber-500/20 font-black",
    pillIconCls: "text-slate-950 fill-slate-950/30",
    cardClasses:
      "border-2 border-amber-400 dark:border-yellow-400 bg-gradient-to-b from-amber-400/20 via-amber-400/5 to-card dark:from-amber-950/40 dark:via-card dark:to-card p-6 rounded-3xl shadow-lg hover:border-yellow-400 hover:shadow-xl transition-all",
    iconBgClasses: "bg-amber-500 dark:bg-yellow-400 text-slate-950 shadow-md shadow-amber-500/20",
    iconColorClasses: "text-slate-950 fill-slate-950",
    titleColorClasses: "text-amber-700 dark:text-yellow-400 font-extrabold text-2xl",
    featureCheckClasses: "text-amber-500 dark:text-yellow-400",
    badgeClasses: "bg-amber-500 dark:bg-yellow-400 text-slate-950 font-black shadow-xs",
    subtext: "Annual VIP • Priority Auto-Assign",
  },
};

/**
 * Normalizes any plan ID or tier string to one of the 4 constant tier IDs:
 * "bronze" | "silver" | "gold" | "micropass"
 */
export function normalizeSubscriptionTier(
  tierOrPlanId?: string | null,
): SubscriptionTierId {
  if (!tierOrPlanId) return "bronze";
  const s = tierOrPlanId.toLowerCase().trim();
  if (s === "yearly" || s === "gold" || s === "annual" || s === "year") return "gold";
  if (s === "monthly" || s === "silver" || s === "month") return "silver";
  if (
    s === "daily" ||
    s === "micropass" ||
    s === "micro pass" ||
    s === "micro-pass" ||
    s === "copper" ||
    s === "day"
  ) {
    return "micropass";
  }
  return "bronze";
}

export function getTierConfig(tierOrPlanId?: string | null): SubscriptionTierConfig {
  const tier = normalizeSubscriptionTier(tierOrPlanId);
  return SUBSCRIPTION_TIERS[tier];
}
