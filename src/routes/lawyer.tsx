import { useEffect } from "react";
import { Outlet, createFileRoute, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { lawyerNav } from "@/features/lawyer/nav";
import { useAuth } from "@/context/useAuth";
import { getStoredToken, getStoredUser } from "@/services/apiClient";
import type { AuthUser } from "@/types/api";

export const Route = createFileRoute("/lawyer")({
  beforeLoad: ({ location }) => {
    if (typeof window !== "undefined") {
      const token = getStoredToken();
      const user = getStoredUser<AuthUser>();
      if (!token && !user) {
        throw redirect({ to: "/lawyer-login" });
      }
      if (user && user.role && user.role !== "lawyer") {
        throw redirect({ to: user.role === "admin" ? "/admin" : "/citizen" });
      }
      if (user?.status === "Suspended" && location.pathname !== "/lawyer/profile") {
        throw redirect({ to: "/lawyer/profile" });
      }
    }
  },
  component: LawyerLayout,
});

function LawyerLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChatRoute = /^\/lawyer\/chat\//.test(pathname);
  const isSuspended = user?.status === "Suspended";

  useEffect(() => {
    if (isSuspended && pathname !== "/lawyer/profile") {
      navigate({ to: "/lawyer/profile" });
    }
  }, [isSuspended, pathname, navigate]);

  const nav = isSuspended
    ? lawyerNav.filter((item) => item.to === "/lawyer/profile")
    : lawyerNav;

  return (
    <DashboardLayout
      role="lawyer"
      roleLabel="Lawyer"
      userName={user?.name || "Swathi Reddy"}
      nav={nav}
      fullBleed={isChatRoute}
      hideBottomNav={isChatRoute}
    >
      <Outlet />
    </DashboardLayout>
  );
}
