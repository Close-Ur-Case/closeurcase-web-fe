import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useCitizenNav } from "@/features/citizen/nav";
import { getCitizenSession } from "@/features/citizen/session";
import { useAuth } from "@/context/useAuth";
import { useCaseSync } from "@/hooks/useCaseSync";
import { getCitizens } from "@/data/appStore";

export const Route = createFileRoute("/citizen")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const session = getCitizenSession();
      if (!session.authenticated) {
        throw redirect({ to: "/citizen-login" });
      }
    }
  },
  component: CitizenLayout,
});

function CitizenLayout() {
  const { user } = useAuth();
  // Pulls this citizen's cases from the API into the store for every screen below.
  useCaseSync();
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
