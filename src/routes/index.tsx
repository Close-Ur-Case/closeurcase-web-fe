import { createFileRoute, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { getCitizenSession } from "@/features/citizen/session";
import { isMobileStandalonePwa } from "@/lib/pwaInstall";
import { Hero } from "@/landing-page/sections/Hero";
import { RecognitionStrip } from "@/landing-page/sections/RecognitionStrip";
import { About } from "@/landing-page/sections/About";
import { LegalServicesExplorer } from "@/landing-page/sections/LegalServicesExplorer";
import { HowItWorks } from "@/landing-page/sections/HowItWorks";
import { CourtExplainer } from "@/landing-page/sections/CourtExplainer";
import { PersonalNotAutomated } from "@/landing-page/sections/PersonalNotAutomated";
import { Testimonials } from "@/landing-page/sections/Testimonials";
import { TheOldWayVsCloseUrCase } from "@/landing-page/sections/TheOldWayVsCloseUrCase";
import { FinalCta } from "@/landing-page/sections/FinalCta";
import { ContactBanner } from "@/landing-page/sections/ContactBanner";
import { ScrollToTopButton } from "@/components/app/ScrollToTopButton";

import { getStoredToken, getStoredUser } from "@/services/apiClient";
import type { AuthUser } from "@/types/api";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && isMobileStandalonePwa()) {
      const session = getCitizenSession();
      const token = getStoredToken();
      const user = getStoredUser<AuthUser>();
      if (token || user) {
        if (user?.role === "admin") throw redirect({ to: "/admin" });
        if (user?.role === "lawyer") throw redirect({ to: "/lawyer" });
        if (user?.role === "citizen") throw redirect({ to: "/citizen" });
      }
      if (session.authenticated) {
        throw redirect({ to: "/citizen" });
      }
      throw redirect({ to: "/citizen-lawyer-login" });
    }
  },
  head: () => ({ meta: [{ title: "CloseUrCase — Legal Platform" }] }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const hash = useRouterState({ select: (s) => s.location.hash });

  // `scroll-behavior: smooth` plus a lingering `#about`/`#contact` in the URL
  // can fight the user's own scrolling afterwards (the browser keeps
  // re-honoring the anchor target) — once the smooth-scroll has had time to
  // land, drop the hash so nothing keeps pulling the page back to it.
  useEffect(() => {
    if (hash !== "about" && hash !== "contact") return;
    const timer = setTimeout(() => {
      navigate({ to: "/", hash: "", replace: true, resetScroll: false });
    }, 900);
    return () => clearTimeout(timer);
  }, [hash, navigate]);

  return (
    <PublicLayout>
      <Hero />
      <RecognitionStrip />
      <About />
      <LegalServicesExplorer />
      <HowItWorks />
      <CourtExplainer />
      <PersonalNotAutomated />
      <Testimonials />
      <TheOldWayVsCloseUrCase />
      <FinalCta />
      <ContactBanner />
      <ScrollToTopButton />
    </PublicLayout>
  );
}
