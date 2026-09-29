import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getCases, subscribeToStore, getCitizens, getLawyers } from "@/data/appStore";
import type { LegalCase } from "@/types";
import { CaseChat } from "@/components/app/CaseChat";
import { caseService, mapBackendCaseToLegalCase } from "@/services/caseService";
import type { BackendUserCase } from "@/types/api";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/lawyer/chat/$id")({
  component: LawyerChatRoute,
});

function LawyerChatRoute() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);
  const [remoteCase, setRemoteCase] = useState<LegalCase | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    return subscribeToStore(sync);
  }, []);

  const localCase = allCases.find((c) => c.id === id);
  const caseItem = localCase || remoteCase;

  useEffect(() => {
    if (!caseItem && id) {
      setLoading(true);
      caseService
        .getUserCase<BackendUserCase>(id)
        .then((backendCase) => {
          if (backendCase) {
            const citizens = getCitizens();
            const lawyers = getLawyers();
            const mapped = mapBackendCaseToLegalCase(backendCase, citizens, lawyers);
            setRemoteCase(mapped);
          }
        })
        .catch((err) => console.warn("[LawyerChat] Case fetch error:", err))
        .finally(() => setLoading(false));
    }
  }, [caseItem, id]);

  const goBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      navigate({ to: "/lawyer/cases" });
    }
  };

  if (loading && !caseItem) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Connecting to case consultation chat…</p>
      </div>
    );
  }

  if (!caseItem) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-bold text-foreground">Case not found</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          This case may have been removed, or the link is incorrect.
        </p>
        <button
          onClick={() => navigate({ to: "/lawyer/cases" })}
          className="rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Back to assigned cases
        </button>
      </div>
    );
  }

  return <CaseChat caseItem={caseItem} role="lawyer" onClose={goBack} />;
}
