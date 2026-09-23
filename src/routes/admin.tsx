import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { adminNav } from "@/features/admin/nav";
import { useAuth } from "@/context/useAuth";
import { useCaseSync } from "@/hooks/useCaseSync";
import { getStoredToken, getStoredUser } from "@/services/apiClient";
import type { AuthUser } from "@/types/api";

export const Route = createFileRoute("/admin")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = getStoredToken();
      const user = getStoredUser<AuthUser>();
      if (!token && !user) {
        throw redirect({ to: "/login" });
      }
      if (user && user.role && user.role !== "admin") {
        throw redirect({ to: user.role === "lawyer" ? "/lawyer" : "/citizen" });
      }
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = useAuth();
  // Admins sync the unfiltered case list for every screen below.
  useCaseSync();

  return (
    <DashboardLayout
      role="admin"
      roleLabel="Super Admin"
      userName={user?.name || "Platform Ops"}
      nav={adminNav}
    >
      <Outlet />
    </DashboardLayout>
  );
}
