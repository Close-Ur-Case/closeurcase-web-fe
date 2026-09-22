import { createFileRoute } from "@tanstack/react-router";
import { SharedNotificationsPage } from "../components/app/SharedNotificationsPage";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({ meta: [{ title: "Notifications — CloseUrCase" }] }),
  component: () => <SharedNotificationsPage role="admin" />,
});
