import { useState, useEffect } from "react";
import { Outlet, createFileRoute, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useCitizenNav } from "@/features/citizen/nav";
import { getCitizenSession } from "@/features/citizen/session";
import { useAuth } from "@/context/useAuth";
import { getCitizens, getSubscriptions, isSubscriptionActive, subscribeToStore } from "@/data/appStore";
import { subscriptionService } from "@/services/subscriptionService";
import { SubscriptionExpiryModal } from "@/components/app/SubscriptionExpiryModal";
import { getStoredToken, getStoredUser } from "@/services/apiClient";
import { normalizeSubscriptionTier } from "@/data/subscriptionTiers";
import type { AuthUser } from "@/types/api";
import type { Subscription } from "@/types";

export const Route = createFileRoute("/citizen")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const session = getCitizenSession();
      const token = getStoredToken();
      const user = getStoredUser<AuthUser>();
      const isAuthenticated = session.authenticated || Boolean(token) || Boolean(user);
      if (!isAuthenticated) {
        throw redirect({ to: "/citizen-login" });
      }
      if (user && user.role && user.role !== "citizen") {
        throw redirect({ to: user.role === "admin" ? "/admin" : "/lawyer" });
      }
    }
  },
  component: CitizenLayout,
});

function CitizenLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const session = getCitizenSession();
  const firstCitizen = getCitizens()[0];
  const userName = user?.name || session.fullName || firstCitizen?.name || "Sai Teja Reddy";
  const citizenId = user?.citizenId || user?.id || "u_001";

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChatRoute = /^\/citizen\/chat\//.test(pathname);
  // The Find a Lawyer wizard manages its own fixed header/footer + internal
  // scroll region (no page-level scrolling), same reasoning as chat.
  const isCreateCaseRoute = pathname === "/citizen/create-case";

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    getSubscriptions(citizenId),
  );
  const [showExpiryModal, setShowExpiryModal] = useState(false);

  useEffect(() => {
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

  const activeSub = subscriptions.find((s) => isSubscriptionActive(s));
  const latestExpiredSub = !activeSub
    ? subscriptions.find((s) => s.status === "Expired" || !isSubscriptionActive(s))
    : null;

  useEffect(() => {
    // Only auto-show in layout if not already on /citizen/subscriptions (which handles its own modal)
    if (latestExpiredSub && !activeSub && pathname !== "/citizen/subscriptions") {
      const dismissedKey = `cuc_dismissed_expiry_modal_${latestExpiredSub.id}`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(dismissedKey)) {
        setShowExpiryModal(true);
      }
    }
  }, [latestExpiredSub, activeSub, pathname]);

  const nav = useCitizenNav();
  const planTier = activeSub ? normalizeSubscriptionTier(activeSub.planId) : "bronze";

  return (
    <DashboardLayout
      role="citizen"
      roleLabel="Citizen"
      userName={userName}
      planTier={planTier}
      nav={nav}
      fullBleed={isChatRoute || isCreateCaseRoute}
      hideBottomNav={isChatRoute}
      hideFloatingWidgets={isCreateCaseRoute}
    >
      <Outlet />
      {pathname !== "/citizen/subscriptions" && (
        <SubscriptionExpiryModal
          open={showExpiryModal}
          onOpenChange={(open) => {
            setShowExpiryModal(open);
            if (!open && latestExpiredSub && typeof window !== "undefined") {
              sessionStorage.setItem(`cuc_dismissed_expiry_modal_${latestExpiredSub.id}`, "true");
            }
          }}
          subscription={latestExpiredSub ?? null}
          onRenew={() => {
            navigate({ to: "/citizen/subscriptions" });
          }}
        />
      )}
    </DashboardLayout>
  );
}
