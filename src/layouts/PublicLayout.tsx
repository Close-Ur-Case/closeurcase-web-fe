import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Info,
  LogIn,
  Mail,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CitizenLanguageButtons } from "@/features/citizen/CitizenLanguageButtons";
import { PublicNav } from "@/components/app/PublicNav";
import { usePracticeAreas } from "@/hooks/queries/useMasterData";
import { GOVERNMENT_SERVICES } from "@/data/governmentServices";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";
import { AnimatedDownloadButton } from "@/components/app/AnimatedDownloadButton";
import { MailLink } from "@/components/app/MailLink";
import { FILLED_LINK_BUTTON_CITIZEN_CLASS, IconButton } from "@/components/m3";
import { LexBot } from "@/components/app/LexBot";

/** Gold gradient treatment for header/drawer CTAs, matching the gold CTAs
 * used throughout the new landing page instead of the component's default
 * citizen-brand green. */
const goldCitizenButtonClass =
  "!bg-gradient-to-br !from-[#e8d5a3] !via-[#d4af37] !to-[#b8942a] !text-slate-950 shadow-md shadow-[#d4af37]/20 hover:!from-[#f0e0b0] hover:!to-[#c9a84c]";

// On the homepage hero, the header renders transparent and overlaps the hero
// image so the nav visually blends into it (no seam/border). These CSS custom
// properties are scoped to the <header> element only, so any child that reads
// the shared text-foreground / text-muted-foreground / border-border theme
// tokens (logo, nav links, login link) automatically switches to light colors
// while sitting over the dark hero — without touching those components.
const heroBlendVars: CSSProperties = {
  ["--foreground" as string]: "#ffffff",
  ["--muted-foreground" as string]: "rgba(255,255,255,0.68)",
  ["--border" as string]: "rgba(255,255,255,0.16)",
  ["--muted" as string]: "rgba(255,255,255,0.10)",
};

export function PublicLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [openAreaName, setOpenAreaName] = useState<string | null>(null);
  const [openSpecName, setOpenSpecName] = useState<string | null>(null);
  const [govServicesOpen, setGovServicesOpen] = useState(false);
  const [openGovCategory, setOpenGovCategory] = useState<string | null>(null);
  const [isHeroScrolled, setIsHeroScrolled] = useState(false);
  const { translate } = useCitizenLanguage();
  const { practiceAreas } = usePracticeAreas();
  const location = useLocation();
  const isHome = location.pathname === "/";

  // Clicking the logo while already on the landing page should just glide back
  // to the very top (and reset any horizontal offset) rather than doing a
  // same-route navigation, which leaves the scroll position wherever it was.
  function handleLogoClick(e: MouseEvent) {
    if (location.pathname !== "/") return;
    e.preventDefault();
    closeMobileMenu();
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }

  // Only the homepage gets the blended, transparent-over-hero header. Every
  // other route keeps the original solid sticky header untouched.
  useEffect(() => {
    if (!isHome) {
      setIsHeroScrolled(false);
      return;
    }
    function onScroll() {
      setIsHeroScrolled(window.scrollY > 48);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const useBlendedHeader = isHome && !isHeroScrolled;

  // The mega-menu / dropdown panels rendered by <PublicNav /> live inside the
  // header DOM tree, so the white-text override above (heroBlendVars) was
  // leaking into them too — making their (normally dark-on-white) menu text
  // invisible. This resets the same tokens back to normal dark-on-light
  // values specifically inside any white/light popover surface, without
  // touching PublicNav's own source.
  const heroBlendPanelResetCss = `
    .cuc-hero-nav [class*="bg-white"],
    .cuc-hero-nav [class*="bg-popover"],
    .cuc-hero-nav [class*="bg-background"],
    .cuc-hero-nav [class*="bg-surface"] {
      --foreground: #0f172a;
      --muted-foreground: #64748b;
      --border: #e2e8f0;
      --muted: #f1f5f9;
    }
  `;

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
    setOpenAreaName(null);
    setOpenSpecName(null);
    setGovServicesOpen(false);
    setOpenGovCategory(null);
  }

  // Lock background scroll while the drawer is open, and let Escape close it.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileMenu();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header
        className={
          isHome
            ? `cuc-hero-nav fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
                useBlendedHeader
                  ? "border-b border-transparent bg-transparent"
                  : "border-b border-border bg-white/90 backdrop-blur-md shadow-sm"
              }`
            : "border-b border-border bg-white/85 backdrop-blur-md sticky top-0 z-40"
        }
        style={useBlendedHeader ? heroBlendVars : undefined}
      >
        {useBlendedHeader && <style>{heroBlendPanelResetCss}</style>}
        <div className="mx-auto grid h-16 w-full max-w-7xl 2xl:max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3 lg:gap-6 px-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 shrink-0 hover:opacity-90"
          >
            <img src="/logo.svg" alt="CloseUrCase Logo" className="h-9 w-9 object-contain" />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-foreground">
                CloseUrCase
              </span>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
                Just click for justice
              </span>
            </span>
          </Link>

          <PublicNav />

          <div className="flex items-center gap-2 sm:gap-2.5 justify-self-end">
            {/* Below xl: compact header (logo + Download + hamburger). The full
                centered nav + action cluster only fits comfortably at xl. */}
            {isHome && (
              <div className="flex xl:hidden items-center">
                <AnimatedDownloadButton useBlendedHeader={useBlendedHeader} size="sm" />
              </div>
            )}

            <div className="hidden xl:flex items-center gap-2 shrink-0">
              <CitizenLanguageButtons size="sm" showLabel={false} />

              {/* On desktop: Animated 24/7 Download Button placed on left side of Lawyer Sign In */}
              {isHome && <AnimatedDownloadButton useBlendedHeader={useBlendedHeader} size="md" />}

              <Link
                to="/login"
                className={cn(
                  FILLED_LINK_BUTTON_CITIZEN_CLASS,
                  "!h-auto whitespace-nowrap !px-3.5 !py-2 !text-xs",
                  goldCitizenButtonClass,
                )}
              >
                <LogIn className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Lawyer Sign In
              </Link>
              <Link
                to="/"
                hash="contact"
                className={cn(
                  "group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[#d4af37]/40 px-3.5 py-2 text-xs font-semibold backdrop-blur-sm transition-all hover:border-[#d4af37]",
                  useBlendedHeader
                    ? "bg-white/[0.03] text-[#e8d5a3] hover:bg-[#d4af37]/10 hover:text-white"
                    : "bg-[#d4af37]/5 text-[#8a6d2f] hover:bg-[#d4af37]/15 hover:text-[#6e5522]",
                )}
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Contact Us
              </Link>
            </div>

            {/* Clearly visible hamburger menu button with distinct background, border and high contrast */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className={cn(
                "xl:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all active:scale-95 focus:outline-none",
                useBlendedHeader
                  ? "border-[#d4af37]/45 bg-[#0a0d14]/75 text-white shadow-md shadow-black/30 hover:bg-[#0a0d14] hover:border-[#d4af37]"
                  : "border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 hover:border-slate-300",
              )}
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5 text-[#d4af37]" />
              ) : (
                <Menu
                  className={cn("h-5 w-5", useBlendedHeader ? "text-white" : "text-slate-900")}
                  strokeWidth={2.4}
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop + slide-in drawer live outside <header> on purpose: the header's
          backdrop-blur-md gives it a `backdrop-filter`, which makes it the containing
          block for any `position: fixed` descendant — inset-y-0 would then resolve
          against the header's own ~64px box instead of the viewport. */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 xl:hidden ${
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
        className={`fixed inset-y-0 right-0 z-50 w-4/5 max-w-sm overflow-y-auto border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-out xl:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="text-sm font-bold text-foreground">Menu</span>
          <IconButton onClick={closeMobileMenu} ariaLabel="Close menu">
            <X className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="space-y-3 px-4 py-4">
          <CitizenLanguageButtons size="sm" showLabel={false} />

          {/* Find a Lawyer — expandable */}
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <button
              type="button"
              onClick={() => setMobileCategoriesOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Find a Lawyer
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  mobileCategoriesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
                mobileCategoriesOpen ? "max-h-500" : "max-h-0"
              }`}
            >
              <div className="border-t border-border">
                {practiceAreas.map((area) => {
                  const isAreaOpen = openAreaName === area.category;
                  return (
                    <div key={area.category} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenAreaName(isAreaOpen ? null : area.category);
                          setOpenSpecName(null);
                        }}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        {area.category}
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                            isAreaOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isAreaOpen && (
                        <div className="space-y-1 bg-muted/30 px-4 pb-2">
                          {area.case_types?.map((spec) => {
                            const isSpecOpen = openSpecName === spec.case_type;
                            return (
                              <div key={spec.case_type}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenSpecName(isSpecOpen ? null : spec.case_type)
                                  }
                                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs font-medium text-foreground hover:bg-muted"
                                >
                                  {spec.case_type}
                                  <ChevronDown
                                    className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                                      isSpecOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>

                                {isSpecOpen && (
                                  <ul className="mb-1 ml-2 space-y-0.5 border-l border-border pl-3">
                                    {spec.legal_services.map((service) => (
                                      <li key={service}>
                                        <Link
                                          to="/citizen-login"
                                          search={{
                                            area: area.category,
                                            specialization: spec.case_type,
                                            service,
                                          }}
                                          onClick={closeMobileMenu}
                                          className="block py-1 text-[11px] text-muted-foreground hover:text-primary"
                                        >
                                          {service}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Government Services — expandable */}
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <button
              type="button"
              onClick={() => setGovServicesOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Government Services
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  govServicesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
                govServicesOpen ? "max-h-500" : "max-h-0"
              }`}
            >
              <div className="max-h-96 overflow-y-auto border-t border-border">
                {GOVERNMENT_SERVICES.map((category) => {
                  const isOpen = openGovCategory === category.title;
                  return (
                    <div key={category.title} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setOpenGovCategory(isOpen ? null : category.title)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        {category.title}
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <ul className="space-y-1 bg-muted/30 px-4 pb-2">
                          {category.links.map((link) => (
                            <li key={link.url + link.label}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeMobileMenu}
                                className="block py-1 text-[11px] text-muted-foreground hover:text-primary"
                              >
                                {link.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions — one consistent full-width pill each */}
          <div className="space-y-2.5 pt-1">
            <Link
              to="/citizen-login"
              onClick={closeMobileMenu}
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-opacity hover:opacity-90 active:opacity-80",
                goldCitizenButtonClass,
              )}
            >
              <Phone className="h-4 w-4 shrink-0" aria-hidden />
              File a Case
            </Link>

            <Link
              to="/"
              hash="contact"
              onClick={closeMobileMenu}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-[#d4af37]/70 bg-[#f5ecd2] px-6 text-sm font-semibold text-[#8a6d2f] transition-colors hover:bg-[#eedfae]"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              Contact Us
            </Link>

            <Link
              to="/"
              hash="about"
              onClick={closeMobileMenu}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Info className="h-4 w-4 shrink-0" aria-hidden />
              About
            </Link>
          </div>
        </div>
      </div>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200/70 bg-[#faf8f4]">
        <div className="mx-auto w-full max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr]">
            {/* Brand */}
            <div>
              <Link
                to="/"
                onClick={handleLogoClick}
                className="inline-flex items-center gap-2.5 hover:opacity-90"
              >
                <img src="/logo.svg" alt="CloseUrCase Logo" className="h-9 w-9 object-contain" />
                <span className="flex flex-col leading-tight">
                  <span className="text-base font-bold tracking-tight text-slate-900">
                    CloseUrCase
                  </span>
                  <span className="text-[10px] font-medium tracking-wide text-[#a9853f]">
                    Just click for justice
                  </span>
                </span>
              </Link>
              <p className="mt-4 max-w-xs text-xs leading-relaxed text-slate-600">
                India&apos;s legal-services platform connecting citizens with bar-verified advocates
                — matched to your case type and tracked from filing to resolution.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <MailLink
                  email="support@closeurcase.in"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/30 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition-colors hover:border-[#d4af37]/60 hover:text-[#a9853f]"
                >
                  <Mail className="h-3.5 w-3.5" />
                  support@closeurcase.in
                </MailLink>
                <Link
                  to="/"
                  hash="contact"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/30 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm transition-colors hover:border-[#d4af37]/60 hover:text-[#a9853f]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Contact us
                </Link>
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Every advocate is verified by our team
              </p>
            </div>

            {/* For citizens */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a9853f]">
                For citizens
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li>
                  <Link to="/citizen-login" className="transition-colors hover:text-[#a9853f]">
                    File a case
                  </Link>
                </li>
                <li>
                  <Link to="/citizen-login" className="transition-colors hover:text-[#a9853f]">
                    Find a lawyer
                  </Link>
                </li>
                <li>
                  <Link to="/citizen-login" className="transition-colors hover:text-[#a9853f]">
                    Track your case
                  </Link>
                </li>
                <li>
                  <Link to="/citizen-login" className="transition-colors hover:text-[#a9853f]">
                    Auto-Assign &amp; subscriptions
                  </Link>
                </li>
              </ul>
            </div>

            {/* For lawyers */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a9853f]">
                For lawyers
              </h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li>
                  <Link to="/lawyer-register" className="transition-colors hover:text-[#a9853f]">
                    Lawyer registration
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="transition-colors hover:text-[#a9853f]">
                    {translate("lawyerAdminLogin")}
                  </Link>
                </li>
                <li>
                  <Link to="/" hash="about" className="transition-colors hover:text-[#a9853f]">
                    About CloseUrCase
                  </Link>
                </li>
                <li>
                  <Link to="/api-docs" className="transition-colors hover:text-[#a9853f]">
                    API Documentation (Swagger)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Popular practice areas */}
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a9853f]">
                Practice areas
              </h3>
              <ul className="mt-3 grid grid-cols-1 gap-2 text-xs text-slate-600">
                {practiceAreas.slice(0, 6).map((area) => (
                  <li key={area.category}>
                    <Link
                      to="/citizen-login"
                      search={{ area: area.category }}
                      className="group inline-flex items-center gap-1 transition-colors hover:text-[#a9853f]"
                    >
                      {area.category}
                      <ArrowUpRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-slate-200/70 pt-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <p className="text-xs text-slate-500">© 2026 CloseUrCase. All rights reserved.</p>
            <Link
              to="/citizen-login"
              className="text-xs font-semibold hover:underline"
              style={{ color: "var(--md-extended-color-citizen)" }}
            >
              {translate("citizenLoginLabel")}
            </Link>
            <p className="text-[11px] text-slate-400">
              Not a law firm. Using this site does not create an attorney–client relationship.
            </p>
          </div>
        </div>
      </footer>
      <LexBot />
    </div>
  );
}
