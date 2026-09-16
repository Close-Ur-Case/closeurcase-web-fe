import { Outlet, createFileRoute } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { adminNav } from "@/features/admin/nav";

export const Route = createFileRoute("/admin")({
  component: () => (
    <DashboardLayout role="admin" roleLabel="Super Admin" userName="Platform Ops" nav={adminNav}>
      <Outlet />
    </DashboardLayout>
  ),
});
