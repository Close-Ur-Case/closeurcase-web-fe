import { Outlet, createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { adminNav } from "@/features/admin/nav";
import { useAuth } from "@/context/useAuth";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user } = useAuth();

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
