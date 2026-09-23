import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useCitizenNav } from "@/features/citizen/nav";
import { getCitizenSession } from "@/features/citizen/session";
import { useAuth } from "@/context/useAuth";
import { getCitizens } from "@/data/appStore";
import { getStoredToken, getStoredUser } from "@/services/apiClient";
import type { AuthUser } from "@/types/api";

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
  const { user } = useAuth();
  const session = getCitizenSession();
  const firstCitizen = getCitizens()[0];
  const userName = user?.name || session.fullName || firstCitizen?.name || "Sai Teja Reddy";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChatRoute = /^\/citizen\/chat\//.test(pathname);
  // The Find a Lawyer wizard manages its own fixed header/footer + internal
  // scroll region (no page-level scrolling), same reasoning as chat.
  const isCreateCaseRoute = pathname === "/citizen/create-case";

  const nav = useCitizenNav();

  return (
    <DashboardLayout
      role="citizen"
      roleLabel="Citizen"
      userName={userName}
      nav={nav}
      fullBleed={isChatRoute || isCreateCaseRoute}
      hideBottomNav={isChatRoute}
      hideFloatingWidgets={isCreateCaseRoute}
    >
      <Outlet />
    </DashboardLayout>
  );
}
