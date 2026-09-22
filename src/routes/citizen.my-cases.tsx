import { createFileRoute } from "@tanstack/react-router";
import { CaseDocketRegister } from "@/components/app/CaseDocketRegister";

export const Route = createFileRoute("/citizen/my-cases")({
  validateSearch: (s: Record<string, unknown>): { upcoming?: boolean } => ({
    upcoming: s.upcoming === true ? true : undefined,
  }),
  component: MyCases,
});

function MyCases() {
  const { upcoming } = Route.useSearch();
  return <CaseDocketRegister role="citizen" upcomingOnly={upcoming} />;
}
