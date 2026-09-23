import { Star, X } from "lucide-react";
import { avatarUrlFor } from "@/data/avatarPool";
import { getLawyers, getCitizens, planTierForCitizen } from "@/data/appStore";
import {
  lawyerPresence,
  lawyerPresenceColor,
  lawyerPresenceLabel,
  type LawyerPresence,
} from "@/lib/statusColors";

const SIZE_CLASSES = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-20 w-20",
};

const SIZE_PX = {
  sm: 64,
  md: 96,
  lg: 160,
};

type PlanTier = "bronze" | "silver" | "gold";

const BADGE_CONFIGS: Record<
  PlanTier,
  {
    label: string;
    ringCls: string;
    badgeCls: string;
    starCls: string;
  }
> = {
  bronze: {
    label: "Bronze Member",
    ringCls: "ring-2 ring-[#8B5E3C]",
    badgeCls: "bg-[#7A4B1B] text-white border-2 border-background shadow-xs",
    starCls: "fill-white text-white",
  },
  silver: {
    label: "Silver Member",
    ringCls: "ring-2 ring-slate-400 dark:ring-slate-500",
    badgeCls:
      "bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-950 border-2 border-background shadow-xs",
    starCls: "fill-current text-white dark:text-slate-950",
  },
  gold: {
    label: "Gold VIP Member",
    ringCls: "ring-2 ring-amber-400 dark:ring-yellow-400",
    badgeCls:
      "bg-amber-400 text-slate-950 border-2 border-background shadow-xs shadow-amber-500/30",
    starCls: "fill-slate-950 text-slate-950",
  },
};

const BADGE_SIZE_CLASSES = {
  sm: { badge: "h-3.5 w-3.5 -bottom-0.5 -right-0.5", star: "h-2 w-2" },
  md: { badge: "h-4.5 w-4.5 -bottom-0.5 -right-0.5", star: "h-2.5 w-2.5" },
  lg: { badge: "h-6.5 w-6.5 -bottom-1 -right-1", star: "h-3.5 w-3.5" },
};

/** Online/offline presence dot, bottom-right of the avatar. */
const PRESENCE_DOT_CLASSES = {
  sm: "h-2.5 w-2.5 bottom-0 right-0",
  md: "h-3 w-3 bottom-0 right-0",
  lg: "h-4 w-4 bottom-0.5 right-0.5",
};

/** Suspended: a red circular X badge replaces the presence dot. */
const PRESENCE_X_CLASSES = {
  sm: { box: "h-3.5 w-3.5 -bottom-0.5 -right-0.5", icon: "h-2.5 w-2.5" },
  md: { box: "h-4 w-4 -bottom-0.5 -right-0.5", icon: "h-3 w-3" },
  lg: { box: "h-6 w-6 -bottom-1 -right-1", icon: "h-4 w-4" },
};

/** Resolve a lawyer's live presence from the store by name — lets every
 * `<UserAvatar role="lawyer">` show the dot without the caller wiring it. An
 * explicit `status` prop always wins over this. */
function resolveLawyerPresence(name: string): LawyerPresence | null {
  const key = name?.toLowerCase().trim();
  if (!key) return null;
  const rec = getLawyers().find((l) => l.name.toLowerCase().trim() === key);
  return rec ? lawyerPresence(rec) : null;
}

function isLawyerOrAdminName(name: string): boolean {
  const lower = name.toLowerCase().trim();
  if (
    lower.includes("admin") ||
    lower.includes("adv.") ||
    lower.includes("lawyer") ||
    lower.includes("counsel") ||
    lower.includes("attorney") ||
    lower.includes("advocate")
  ) {
    return true;
  }
  return getLawyers().some((l) => l.name.toLowerCase().trim() === lower);
}

/**
 * Resolve the membership badge for an avatar. The tier comes from the person's
 * real subscription history (see `planTierForCitizen`), never a name hash.
 * Lawyers and admins never get a citizen badge.
 */
function resolvePlanTier(name: string, role?: string, explicitTier?: string): PlanTier | null {
  if (role === "lawyer" || role === "admin") return null;
  if (isLawyerOrAdminName(name)) return null;

  // An explicit tier passed by the caller (e.g. a subscription card) wins.
  if (explicitTier) {
    const norm = explicitTier.toLowerCase();
    if (norm === "free" || norm === "bronze") return "bronze";
    if (norm === "monthly" || norm === "silver") return "silver";
    if (norm === "yearly" || norm === "gold") return "gold";
  }

  const lower = name.toLowerCase().trim();
  const isCitizen =
    role === "citizen" ||
    lower.startsWith("u_") ||
    getCitizens().some((c) => c.name.toLowerCase().trim() === lower);
  if (!isCitizen) return null;

  return planTierForCitizen(name) ?? "bronze";
}

export function UserAvatar({
  name,
  photoUrl,
  size = "md",
  role,
  planTier,
  status,
  className = "",
}: {
  name: string;
  photoUrl?: string | null;
  size?: keyof typeof SIZE_CLASSES;
  role?: "citizen" | "lawyer" | "admin";
  planTier?: "bronze" | "silver" | "gold" | "free" | "monthly" | "yearly";
  /** Lawyer presence indicator. Pass explicitly when a Lawyer object is in
   * hand; otherwise, for `role="lawyer"`, it's resolved live from the store
   * by name. Non-lawyers never get an indicator. */
  status?: LawyerPresence;
  className?: string;
}) {
  const sizeCls = SIZE_CLASSES[size];
  const src = photoUrl || avatarUrlFor(name, SIZE_PX[size]);
  const tierKey = resolvePlanTier(name, role, planTier);
  const tier = tierKey ? BADGE_CONFIGS[tierKey] : null;
  const badgeSize = BADGE_SIZE_CLASSES[size];

  const presence: LawyerPresence | null =
    status ?? (role === "lawyer" ? resolveLawyerPresence(name) : null);
  const suspended = presence === "suspended";
  const xSize = PRESENCE_X_CLASSES[size];

  return (
    <div className={`relative inline-flex shrink-0 ${sizeCls}`}>
      <img
        src={src}
        alt={name}
        className={`h-full w-full rounded-full border border-border object-cover shadow-sm ${tier ? tier.ringCls : ""} ${suspended ? "opacity-70 grayscale" : ""} ${className}`}
      />

      {presence && !suspended && (
        <span
          className={`absolute rounded-full border-2 border-background ${PRESENCE_DOT_CLASSES[size]}`}
          style={{ backgroundColor: lawyerPresenceColor[presence] }}
          title={lawyerPresenceLabel[presence]}
          aria-label={lawyerPresenceLabel[presence]}
        />
      )}

      {suspended && (
        <span
          className={`absolute flex items-center justify-center rounded-full border-2 border-background text-white ${xSize.box}`}
          style={{ backgroundColor: lawyerPresenceColor.suspended }}
          title="Suspended"
          aria-label="Suspended"
        >
          <X className={`${xSize.icon} stroke-3`} />
        </span>
      )}

      {tier && (
        <div
          className={`absolute rounded-full flex items-center justify-center ${tier.badgeCls} ${badgeSize.badge}`}
          title={`${tier.label}`}
        >
          <Star className={badgeSize.star} />
        </div>
      )}
    </div>
  );
}
