import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/lawyer/cases")({
  component: () => <Outlet />,
});
