import { createFileRoute } from "@tanstack/react-router";
import { SharedNotificationsPage } from "../components/app/SharedNotificationsPage";

export const Route = createFileRoute("/lawyer/notifications")({
  head: () => ({ meta: [{ title: "Notifications — CloseUrCase" }] }),
  component: () => <SharedNotificationsPage role="lawyer" />,
});
