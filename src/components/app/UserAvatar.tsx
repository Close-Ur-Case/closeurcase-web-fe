import { useState, useEffect } from "react";
import { X, Award, Zap, ShieldCheck, Crown } from "lucide-react";
import { avatarUrlFor } from "@/data/avatarPool";
import { getLawyers, getCitizens, planTierForCitizen, subscribeToStore } from "@/data/appStore";
import {
  SUBSCRIPTION_TIERS,
  normalizeSubscriptionTier,
  type SubscriptionTierId,
  type SubscriptionTierConfig,
} from "@/data/subscriptionTiers";
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

export type PlanTier = SubscriptionTierId;
export const BADGE_CONFIGS: Record<PlanTier, SubscriptionTierConfig> = SUBSCRIPTION_TIERS;

const BADGE_SIZE_CLASSES = {
  sm: { badge: "h-4 w-4 -bottom-0.5 -right-0.5", star: "h-2.5 w-2.5" },
  md: { badge: "h-5 w-5 -bottom-0.5 -right-0.5", star: "h-3 w-3" },
  lg: { badge: "h-7 w-7 -bottom-1 -right-1", star: "h-4 w-4" },
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

function getInitials(name?: string): string {
  if (!name || !name.trim()) return "U";
  const clean = name.replace(/^(Adv\.\s*)/i, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

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
    return normalizeSubscriptionTier(explicitTier);
  }

  const lower = name.toLowerCase().trim();
  const isCitizen =
    role === "citizen" ||
    lower.startsWith("u_") ||
    lower.startsWith("usr_") ||
    lower === "citizen" ||
    getCitizens().some((c) => c.name.toLowerCase().trim() === lower) ||
    (typeof window !== "undefined" &&
      Boolean(
        localStorage.getItem("cuc_citizen_session") || localStorage.getItem("cuc_auth_user"),
      ));

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
  planTier?: "bronze" | "silver" | "gold" | "micropass" | "free" | "daily" | "monthly" | "yearly";
  /** Lawyer presence indicator. Pass explicitly when a Lawyer object is in
   * hand; otherwise, for `role="lawyer"`, it's resolved live from the store
   * by name. Non-lawyers never get an indicator. */
  status?: LawyerPresence;
  className?: string;
}) {
  const sizeCls = SIZE_CLASSES[size];
  const [hasPrimaryError, setHasPrimaryError] = useState(false);
  const [hasFallbackError, setHasFallbackError] = useState(false);
  const [, setStoreVersion] = useState(0);

  useEffect(() => {
    return subscribeToStore(() => setStoreVersion((v) => v + 1));
  }, []);

  useEffect(() => {
    setHasPrimaryError(false);
    setHasFallbackError(false);
  }, [photoUrl, name]);

  const cleanPhotoUrl = photoUrl && photoUrl.trim() !== "" ? photoUrl.trim() : null;
  const fallbackSrc = avatarUrlFor(name || "User", SIZE_PX[size]);

  // Determine current image source
  const currentSrc = !hasPrimaryError && cleanPhotoUrl ? cleanPhotoUrl : fallbackSrc;
  const shouldRenderInitials = hasFallbackError || (!cleanPhotoUrl && !fallbackSrc);

  const tierKey = resolvePlanTier(name || "", role, planTier);
  const tier = tierKey ? BADGE_CONFIGS[tierKey] : null;
  const badgeSize = BADGE_SIZE_CLASSES[size];

  const presence: LawyerPresence | null =
    status ?? (role === "lawyer" ? resolveLawyerPresence(name || "") : null);
  const suspended = presence === "suspended";
  const xSize = PRESENCE_X_CLASSES[size];

  const initials = getInitials(name);

  return (
    <div className={`relative inline-flex shrink-0 ${sizeCls}`}>
      {!shouldRenderInitials ? (
        <img
          src={currentSrc}
          alt={name || "User"}
          onError={() => {
            if (!hasPrimaryError && cleanPhotoUrl) {
              setHasPrimaryError(true);
            } else {
              setHasFallbackError(true);
            }
          }}
          className={`h-full w-full rounded-full border border-border object-cover shadow-sm ${tier ? tier.ringCls : ""} ${suspended ? "opacity-70 grayscale" : ""} ${className}`}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center rounded-full border border-border bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary font-bold shadow-xs select-none ${tier ? tier.ringCls : ""} ${suspended ? "opacity-70 grayscale" : ""} ${className}`}
        >
          <span className={size === "lg" ? "text-xl" : size === "md" ? "text-sm" : "text-xs"}>
            {initials}
          </span>
        </div>
      )}

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
          className={`absolute rounded-full flex items-center justify-center shrink-0 z-10 ${tier.badgeCls} ${badgeSize.badge}`}
          title={`${tier.label}`}
        >
          <tier.icon className={`${badgeSize.star} ${tier.iconCls} shrink-0`} />
        </div>
      )}
    </div>
  );
}
