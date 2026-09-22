import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  centerLogoOnMobile = false,
  centerOnMobile = false,
  wide = false,
  fitDesktop = false,
  image = "/lawyer-login.png",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Mobile only: shows a larger, centered logo + wordmark above the card
   * instead of the (mobile-hidden) navbar logo. */
  centerLogoOnMobile?: boolean;
  /** Mobile only: vertically centers the card in the viewport instead of
   * letting it sit at the top of the page. Only safe for short screens (the
   * login screens) — taller multi-step forms must stay top-aligned so they
   * can scroll. No effect on desktop. */
  centerOnMobile?: boolean;
  /** When true, expands the form column for rich multi-step forms. */
  wide?: boolean;
  /** Desktop only: run as a fixed-height application screen — the area below
   * the header is exactly `100vh - header`, and nothing inside it scrolls.
   * Callers using this must keep each screen's content within that budget. */
  fitDesktop?: boolean;
  /** Right-panel illustration, desktop only. Defaults to the lawyer/courtroom
   * artwork; pass a different asset (e.g. citizen-login.png) per screen. */
  image?: string;
}) {
  return (
    /* Desktop: the page itself never scrolls (h-screen + overflow-hidden) — only
       the left column does. That keeps the right-hand image fixed and fully in
       frame. Mobile keeps normal document flow so the whole page scrolls. */
    <div
      data-auth-shell
      className="flex min-h-screen flex-col bg-background lg:h-screen lg:min-h-0 lg:overflow-hidden"
    >
      <header className="hidden shrink-0 border-b border-border bg-surface sm:block">
        <div className="mx-auto flex h-16 w-full max-w-[1560px] items-center justify-between px-6 sm:px-8 lg:px-10">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90">
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
        </div>
      </header>

      <div
        className={cn(
          "flex w-full min-w-0 flex-1 lg:min-h-0",
          centerOnMobile && "items-center lg:items-stretch",
        )}
      >
        <main
          className={cn(
            "w-full min-w-0 lg:h-full lg:w-[55%] lg:overflow-x-hidden xl:w-[54%]",
            fitDesktop
              ? "lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden"
              : "lg:overflow-y-auto lg:[scrollbar-gutter:stable]",
          )}
        >
          <div
            className={cn(
              "mx-auto w-full min-w-0 px-6 py-6 sm:py-6 lg:px-10 xl:px-14",
              wide ? "max-w-[760px]" : "max-w-xl",
              // On desktop the left column is a flex column. Using `lg:my-auto` on the card child
              // vertically centers content when there is room, while preventing `justify-center`
              // overflow from pushing the header/title off the top of the viewport.
              "lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:py-4",
            )}
          >
            {centerLogoOnMobile && (
              <div className="mb-6 flex flex-col items-center gap-3 sm:hidden">
                <img src="/logo.svg" alt="CloseUrCase Logo" className="h-24 w-24 object-contain" />
                <span className="text-2xl font-extrabold tracking-tight text-foreground">
                  CloseUrCase
                </span>
              </div>
            )}
            <div
              className={cn(
                // Mobile keeps the bordered/shadowed card. Desktop drops all
                // of that chrome — no border, no shadow, no card background —
                // so the form sits directly on the page and uses the full
                // width of the left column, the way Facebook's login/signup
                // forms do, rather than looking boxed-in.
                "w-full min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6",
                "lg:my-auto lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none",
                fitDesktop && "lg:flex lg:h-full lg:max-h-[680px] lg:min-h-0 lg:flex-col",
              )}
            >
              <h1 className="shrink-0 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 shrink-0 text-[13px] leading-snug text-muted-foreground sm:text-sm">
                  {subtitle}
                </p>
              )}
              <div
                className={cn(
                  "mt-4 min-w-0",
                  fitDesktop && "lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-hidden",
                )}
              >
                {children}
              </div>
              {footer && (
                <div
                  className={cn(
                    "mt-4 shrink-0 text-center text-sm text-muted-foreground",
                    fitDesktop && "lg:mt-3 lg:text-[13px]",
                  )}
                >
                  {footer}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* ── Right: static full-height image, desktop only, never scrolls.
            Widths are the exact complement of <main>'s so the row totals 100%
            and the image can never define the page width. ── */}
        <aside className="relative hidden min-w-0 shrink-0 overflow-hidden lg:block lg:w-[45%] xl:w-[46%]">
          <img
            src={image}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </aside>
      </div>
    </div>
  );
}
