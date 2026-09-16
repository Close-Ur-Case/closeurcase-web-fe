import type { SubscriptionPlanId } from "@/types";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  label: string;
  price: number;
  cadence: string;
  badge?: string;
  /** Short "who it's for" line shown above the plan name on the pricing cards. */
  audience: string;
  description: string;
  /** "What's included" checklist shown on the pricing cards. */
  features: string[];
}

/** The always-on tier every citizen has without paying. Kept separate from
 * SUBSCRIPTION_PLANS so the "Find a Lawyer" wizard's paid Auto-Assign step
 * doesn't offer it. */
export const FREE_PLAN: SubscriptionPlan = {
  id: "free",
  label: "Free",
  price: 0,
  cadence: "",
  audience: "For getting started",
  description: "Browse verified advocates and file cases manually, at your own pace.",
  features: [
    "Manual advocate search & selection",
    "File up to 2 active cases",
    "Standard case tracking",
    "Community support",
  ],
};

/** Auto-Assign plan catalogue — shown on the "Find a Lawyer" wizard's
 * admin-assign step and on the citizen "My Subscriptions" page, so both
 * stay in sync on price/copy. */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    label: "Monthly",
    price: 499,
    cadence: "/month",
    badge: "Popular",
    audience: "For active matters",
    description: "Priority admin-assigned advocate support, billed every month.",
    features: [
      "Auto-dispatch to top verified specialists",
      "Priority admin allocation & case tracking",
      "Unlimited active cases",
      "Priority support",
    ],
  },
  {
    id: "yearly",
    label: "Yearly",
    price: 4999,
    cadence: "/year",
    badge: "Save 17%",
    audience: "For long-term needs",
    description: "Priority admin-assigned advocate support, billed once a year.",
    features: [
      "Everything in Monthly",
      "2 months free vs monthly billing",
      "Dedicated case manager",
      "Early access to new features",
    ],
  },
];
