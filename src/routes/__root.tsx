import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { CitizenLanguageProvider } from "@/features/citizen/i18n/CitizenLanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { Button, FILLED_LINK_BUTTON_CLASS, OUTLINED_LINK_BUTTON_CLASS } from "@/components/m3";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className={FILLED_LINK_BUTTON_CLASS}>
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button
            variant="filled"
            onClick={() => {
              router.invalidate();
              reset();
            }}
          >
            Try again
          </Button>
          {/* Plain <a>, not a router Link — a full page reload is intentional here to
              reset all app state after a crash. */}
          <a href="/" className={OUTLINED_LINK_BUTTON_CLASS}>
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function ScrollToTop() {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const hash = useRouterState({ select: (s) => s.location.hash });

  useEffect(() => {
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  // Reset scroll on real route (pathname) changes only. A hash-only
  // navigation on the same page — the "About" / "Contact" links in the
  // public header and footer point at `/#about` / `/#contact` — must keep
  // its scroll position so the browser can bring that section into view.
  useEffect(() => {
    if (window.location.hash) return;
    const reset = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document.querySelectorAll("main, [data-scroll-container], #dashboard-main").forEach((el) => {
        el.scrollTop = 0;
      });
    };
    reset();
    const rafId = requestAnimationFrame(reset);
    const tm = setTimeout(reset, 50);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(tm);
    };
  }, [pathname]);

  // Smooth-scroll to the `#hash` target once it has rendered. Target
  // sections carry `scroll-mt-*` so the sticky header doesn't overlap them.
  useEffect(() => {
    if (!hash) return;
    const scrollToHash = () => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const rafId = requestAnimationFrame(scrollToHash);
    const tm = setTimeout(scrollToHash, 60);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(tm);
    };
  }, [hash, pathname]);

  useEffect(() => {
    let lastPath = router.state.location.pathname;
    return router.subscribe("onRendered", () => {
      const nextPath = router.state.location.pathname;
      const changedPath = nextPath !== lastPath;
      lastPath = nextPath;
      // Leave scroll alone for hash-only navigations and for the hash
      // being cleared afterwards — only jump to top on an actual route change.
      if (!changedPath || window.location.hash) return;
      window.scrollTo(0, 0);
      document.querySelectorAll("main, [data-scroll-container], #dashboard-main").forEach((el) => {
        el.scrollTop = 0;
      });
    });
  }, [router]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CitizenLanguageProvider>
          <ScrollToTop />
          <Outlet />
        </CitizenLanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
