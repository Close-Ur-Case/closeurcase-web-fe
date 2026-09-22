import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { lawyerNav } from "@/features/lawyer/nav";
import { useAuth } from "@/context/useAuth";
import { useCaseSync } from "@/hooks/useCaseSync";

export const Route = createFileRoute("/lawyer")({
  component: LawyerLayout,
});

function LawyerLayout() {
  const { user } = useAuth();
  // Pulls this lawyer's cases from the API into the store for every screen below.
  useCaseSync();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChatRoute = /^\/lawyer\/chat\//.test(pathname);

  return (
    <DashboardLayout
      role="lawyer"
      roleLabel="Lawyer"
      userName={user?.name || "Swathi Reddy"}
      nav={lawyerNav}
      fullBleed={isChatRoute}
      hideBottomNav={isChatRoute}
    >
      <Outlet />
    </DashboardLayout>
  );
}
