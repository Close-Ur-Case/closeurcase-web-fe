import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { lawyerNav } from "@/features/lawyer/nav";

export const Route = createFileRoute("/lawyer")({
  component: LawyerLayout,
});

function LawyerLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChatRoute = /^\/lawyer\/chat\//.test(pathname);

  return (
    <DashboardLayout
      role="lawyer"
      roleLabel="Lawyer"
      userName="Swathi Reddy"
      nav={lawyerNav}
      fullBleed={isChatRoute}
      hideBottomNav={isChatRoute}
    >
      <Outlet />
    </DashboardLayout>
  );
}
