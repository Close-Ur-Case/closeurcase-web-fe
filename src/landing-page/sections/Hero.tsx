import { Link } from "@tanstack/react-router";
import { LogIn, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { FILLED_LINK_BUTTON_CLASS } from "@/components/m3";
import { CitizenLanguageButtons } from "@/features/citizen/CitizenLanguageButtons";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";
import { HERO_TRUST_POINTS } from "@/landing-page/constants";

const HERO_SOCIAL_LINKS = [
  {
    href: "https://ecourts.gov.in",
    title: "eCourts Services Portal",
    path: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </>
    ),
    stroke: true,
  },
  {
    href: "https://x.com/ecourts_india",
    title: "eCourts India on X",
    path: (
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    ),
  },
  {
    href: "https://www.facebook.com/eCourtsindia",
    title: "eCourts India on Facebook",
    path: (
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    ),
  },
  {
    href: "https://www.instagram.com/ecourtsindia",
    title: "eCourts India on Instagram",
    path: (
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    ),
  },
];

export function Hero() {
  const { translate } = useCitizenLanguage();
  const heroTitleParts = translate("heroTitle").split(",");

  return (
    <section className="relative flex min-h-[85vh] flex-col justify-between overflow-hidden bg-[#0a0d14] lg:min-h-[72vh]">
      <div
        className="absolute inset-0 bg-cover bg-right bg-no-repeat opacity-90"
        style={{ backgroundImage: "url('/bghero-new.jpg')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:24px_24px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14] via-[#0a0d14]/90 to-transparent sm:via-[#0a0d14]/85 lg:w-[65%] xl:w-[58%] 2xl:w-[52%]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/40 to-transparent" />

      <p
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-0.1em] right-[-0.02em] z-0 select-none whitespace-nowrap font-serif text-[22vw] font-semibold italic leading-none text-[#d4af37]/[0.09] lg:text-[16vw] 2xl:text-[14vw]"
      >
        Justice.
      </p>

      <div className="absolute left-4 top-20 z-10 md:hidden">
        <CitizenLanguageButtons size="sm" showLabel={false} className="max-w-fit" />
      </div>

      <div className="absolute right-4 top-20 z-20 hidden items-center gap-2 sm:right-6 sm:top-24 md:flex lg:right-8 xl:right-12">
        {HERO_SOCIAL_LINKS.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            title={item.title}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f0e8]/90 text-slate-800 transition-colors hover:bg-white"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill={item.stroke ? "none" : "currentColor"}
              stroke={item.stroke ? "currentColor" : undefined}
              strokeWidth={item.stroke ? 1.8 : undefined}
              strokeLinecap={item.stroke ? "round" : undefined}
              strokeLinejoin={item.stroke ? "round" : undefined}
            >
              {item.path}
            </svg>
          </a>
        ))}
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl 2xl:max-w-[1440px] flex-1 flex-col justify-center px-6 pb-12 pt-16 sm:px-8 lg:px-12 2xl:px-16 lg:pb-10 lg:pt-16">
        <div className="max-w-2xl 2xl:max-w-3xl">
          <p className="mb-4 font-serif text-base italic tracking-wide text-[#d4af37]/90">
            A private legal service built on trust and transparency
          </p>
          <div className="mb-6 h-px w-16 bg-gradient-to-r from-[#d4af37] to-transparent" />

          <h1 className="font-serif text-[2.6rem] font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[3.9rem] 2xl:text-[4.4rem]">
            {heroTitleParts.length > 1 ? (
              <>
                <span className="block text-white">{heroTitleParts[0]},</span>
                <span className="mt-1 block bg-gradient-to-r from-[#e8d5a3] via-[#d4af37] to-[#c9a84c] bg-clip-text text-transparent">
                  {heroTitleParts.slice(1).join(",")}
                </span>
              </>
            ) : (
              <span className="text-white">{translate("heroTitle")}</span>
            )}
          </h1>

          <p className="mt-5 max-w-md text-base leading-relaxed text-slate-300/85">
            {translate("heroDesc")}
          </p>

          <div className="mt-9 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <Link
              to="/citizen-login"
              className={cn(
                FILLED_LINK_BUTTON_CLASS,
                "!rounded-full !bg-gradient-to-br !from-[#e8d5a3] !via-[#d4af37] !to-[#b8942a] !px-8 !py-3.5 !text-sm font-semibold !text-slate-950 shadow-lg shadow-[#d4af37]/25 transition-all hover:!from-[#f0e0b0] hover:!to-[#c9a84c] active:scale-[0.98] justify-center shrink-0",
              )}
            >
              <Scale className="h-4 w-4 shrink-0" aria-hidden />
              File a Case
            </Link>
            <Link
              to="/lawyer-register"
              className="group inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#d4af37]/40 bg-white/[0.03] px-5 py-2.5 text-xs font-semibold text-[#e8d5a3] backdrop-blur-sm transition-all hover:border-[#d4af37] hover:bg-[#d4af37]/10 hover:text-white active:scale-[0.98] sm:w-auto sm:shrink-0"
            >
              <LogIn className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
              Register as Lawyer
            </Link>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10 bg-[#0a0d14]/85 backdrop-blur-md">
        <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-6 py-4 sm:px-8 lg:px-12 2xl:px-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0">
            {HERO_TRUST_POINTS.map((item, idx) => (
              <div
                key={item.title}
                className={cn(
                  "flex items-center gap-3",
                  idx !== 0 && "sm:border-l sm:border-white/10 sm:pl-8",
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 text-[#d4af37]">
                  <item.icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                  <p className="mt-0.5 text-[11px] text-white/50">{item.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-15 -mb-1 w-full overflow-hidden leading-none">
        <svg
          className="relative block h-10 w-full text-[#faf8f4] sm:h-14"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,40 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </section>
  );
}
