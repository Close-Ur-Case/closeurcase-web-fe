import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { LAWYER_PRACTICE_AREAS } from "@/components/app/lawyerPracticeAreas";
import { GOVERNMENT_SERVICES } from "@/data/governmentServices";

type MenuKey = "lawyer" | "gov";

const CLOSE_DELAY_MS = 150;

/** Centered desktop nav for the public marketing header. "Find a Lawyer"
 * opens a two-pane mega-menu — practice areas on the left, hovering one
 * reveals its specializations on the right, each with its specific legal
 * services listed underneath (mirrors the practice area -> specialization ->
 * legal service taxonomy). "About" smooth-scrolls to the About section on
 * the landing page (no separate route). "Government Services" opens a wide
 * grid mega-menu of official Government of India portals, grouped by
 * category — all external links, opened in a new tab. Every trigger is a
 * real link, so it still works with JS/hover disabled or on click; hover
 * just reveals the preview. */
export function PublicNav() {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [activeAreaIndex, setActiveAreaIndex] = useState(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = useRef<HTMLElement>(null);

  function openNow(key: MenuKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  }

  function closeSoon() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMenu(null), CLOSE_DELAY_MS);
  }

  function closeNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(null);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeNow();
    }
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) closeNow();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const activeArea = LAWYER_PRACTICE_AREAS[activeAreaIndex];

  return (
    <nav ref={navRef} className="relative hidden xl:flex items-center justify-center gap-1">
      <Link
        to="/citizen-login"
        onMouseEnter={() => openNow("lawyer")}
        onMouseLeave={closeSoon}
        onClick={closeNow}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-foreground transition-colors duration-150 hover:bg-muted hover:text-primary"
      >
        Find a Lawyer
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            openMenu === "lawyer" ? "rotate-180" : ""
          }`}
        />
      </Link>

      <button
        type="button"
        onMouseEnter={() => openNow("gov")}
        onMouseLeave={closeSoon}
        onClick={() => setOpenMenu((v) => (v === "gov" ? null : "gov"))}
        className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-foreground transition-colors duration-150 hover:bg-muted hover:text-primary"
      >
        Government Services
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            openMenu === "gov" ? "rotate-180" : ""
          }`}
        />
      </button>

      <Link
        to="/"
        hash="about"
        className="rounded-lg px-3 py-2 text-xs font-semibold text-foreground transition-colors duration-150 hover:bg-muted hover:text-primary"
      >
        About
      </Link>

      {/* Find a Lawyer mega-menu — fixed + viewport-centered rather than
          absolute-centered on this <nav>, which sits in an off-center grid
          column and pushed the panel off-screen on narrower desktops. */}
      <div
        onMouseEnter={() => openNow("lawyer")}
        onMouseLeave={closeSoon}
        className={`fixed left-1/2 top-16 z-50 w-[min(80vw,72rem)] -translate-x-1/2 pt-2 transition-all duration-200 ease-out ${
          openMenu === "lawyer"
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="flex">
            <div className="w-52 shrink-0 border-r border-border py-2">
              {LAWYER_PRACTICE_AREAS.map((area, i) => (
                <button
                  key={area.category}
                  type="button"
                  onMouseEnter={() => setActiveAreaIndex(i)}
                  onFocus={() => setActiveAreaIndex(i)}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold transition-colors duration-150 ${
                    i === activeAreaIndex
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {area.category}
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </button>
              ))}
            </div>

            <div className="max-h-105 flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-3">
                {activeArea.case_types.map((spec) => (
                  <div key={spec.case_type}>
                    <h4 className="text-xs font-bold text-foreground">{spec.case_type}</h4>
                    <ul className="mt-1.5 space-y-1">
                      {spec.legal_services.map((service) => (
                        <li key={service}>
                          <Link
                            to="/citizen-login"
                            search={{
                              area: activeArea.category,
                              specialization: spec.case_type,
                              service,
                            }}
                            onClick={closeNow}
                            className="text-[11px] leading-relaxed text-muted-foreground transition-colors duration-150 hover:text-primary hover:underline"
                          >
                            {service}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3">
            <span className="text-[11px] text-muted-foreground">
              Not sure which one fits? Describe your issue and we'll match you.
            </span>
            <Link
              to="/citizen-login"
              onClick={closeNow}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
            >
              File a Case
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Government Services mega-menu — see positioning note above. */}
      <div
        onMouseEnter={() => openNow("gov")}
        onMouseLeave={closeSoon}
        className={`fixed left-1/2 top-16 z-50 w-[min(80vw,72rem)] -translate-x-1/2 pt-2 transition-all duration-200 ease-out ${
          openMenu === "gov"
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0"
        }`}
      >
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          <div className="max-h-[70vh] overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-3 xl:grid-cols-4">
              {GOVERNMENT_SERVICES.map((category) => (
                <div key={category.title}>
                  <h4 className="text-xs font-bold text-foreground">{category.title}</h4>
                  <ul className="mt-1.5 space-y-1">
                    {category.links.map((link) => (
                      <li key={link.url + link.label}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={closeNow}
                          className="inline-flex items-start gap-1 text-[11px] leading-relaxed text-muted-foreground transition-colors duration-150 hover:text-primary hover:underline"
                        >
                          {link.label}
                          <ExternalLink className="mt-0.5 h-2.5 w-2.5 shrink-0 opacity-60" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border px-5 py-3">
            <span className="text-[11px] text-muted-foreground">
              Official Government of India portals — external sites, not operated by CloseUrCase.
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
