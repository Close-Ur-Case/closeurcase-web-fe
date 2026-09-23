import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { lawyerNav } from "@/features/lawyer/nav";
import { useAuth } from "@/context/useAuth";
import { getStoredToken, getStoredUser } from "@/services/apiClient";
import type { AuthUser } from "@/types/api";

export const Route = createFileRoute("/lawyer")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = getStoredToken();
      const user = getStoredUser<AuthUser>();
      if (!token && !user) {
        throw redirect({ to: "/login" });
      }
      if (user && user.role && user.role !== "lawyer") {
        throw redirect({ to: user.role === "admin" ? "/admin" : "/citizen" });
      }
    }
  },
  component: LawyerLayout,
});

function LawyerLayout() {
  const { user } = useAuth();
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
