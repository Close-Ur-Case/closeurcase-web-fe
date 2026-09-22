import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCases, subscribeToStore } from "@/data/appStore";
import type { LegalCase } from "@/types";
import { CaseChat } from "@/components/app/CaseChat";

export const Route = createFileRoute("/citizen/chat/$id")({
  component: CitizenChatRoute,
});

function CitizenChatRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    return subscribeToStore(sync);
  }, []);

  const caseItem = allCases.find((c) => c.id === id);

  if (!caseItem) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-bold text-foreground">Case not found</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          This case may have been removed, or the link is incorrect.
        </p>
        <button
          onClick={() => navigate({ to: "/citizen" })}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const goBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      navigate({ to: "/citizen" });
    }
  };

  return <CaseChat caseItem={caseItem} role="citizen" onClose={goBack} />;
}
