import { createFileRoute } from "@tanstack/react-router";
import { CasesListView } from "@/components/app/CasesListView";

export const Route = createFileRoute("/lawyer/cases/")({
  component: CasesListView,
});
