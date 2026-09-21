import { Link, useRouter, useRouterState, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  LogOut,
  Bell,
  User,
  ChevronDown,
  Menu as MenuIcon,
  X,
  Bot,
  LayoutGrid,
  Folder,
  Sparkles,
  BookOpen,
  Search,
  Activity,
  Users,
  Scale,
  MapPin,
  CreditCard,
  IndianRupee,
} from "lucide-react";
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { getNotifications, getProfilePhoto, subscribeToStore } from "@/data/appStore";
import { notificationService } from "@/services/notificationService";
import { LexBot } from "@/components/app/LexBot";
import { WhatsAppFloatingButton } from "@/components/app/WhatsAppButton";
import { UserAvatar } from "@/components/app/UserAvatar";
import { LocationIndicator } from "@/components/app/LocationIndicator";
import { VideoCallsMenu } from "@/components/app/VideoCallsMenu";
import { CitizenLanguageButtons } from "@/features/citizen/CitizenLanguageButtons";
import { VideoCallProvider } from "@/features/video-call/VideoCallContext";
import { clearCitizenSession } from "@/features/citizen/session";
import { useAuth } from "@/context/useAuth";
import { IconButton, Badge } from "@/components/m3";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Optional group heading rendered above this item whenever it differs from the previous item's section. */
  section?: string;
}

/** Lawyer-only mobile bottom tab bar destinations. */
const LAWYER_BOTTOM_NAV: {
  to: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}[] = [
  { to: "/lawyer", label: "Home", icon: LayoutGrid, match: (p) => p === "/lawyer" },
  {
    to: "/lawyer/cases",
    label: "My Cases",
    icon: Folder,
    match: (p) => p.startsWith("/lawyer/cases"),
  },
  {
    to: "/lawyer/revenue",
    label: "Revenue",
    icon: IndianRupee,
    match: (p) => p.startsWith("/lawyer/revenue"),
  },
  {
    to: "/lawyer/ai-assistant",
    label: "Counter Generator",
    icon: Sparkles,
    match: (p) => p.startsWith("/lawyer/ai-assistant"),
  },
  {
    to: "/lawyer/knowledge-base",
    label: "Knowledge Base",
    icon: BookOpen,
    match: (p) => p.startsWith("/lawyer/knowledge-base"),
  },
];

/** Citizen-only mobile bottom tab bar destinations. */
const CITIZEN_BOTTOM_NAV: {
  to: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}[] = [
  { to: "/citizen", label: "Home", icon: LayoutGrid, match: (p) => p === "/citizen" },
  {
    to: "/citizen/my-cases",
    label: "My Cases",
    icon: Folder,
    match: (p) => p.startsWith("/citizen/my-cases"),
  },
  {
    to: "/citizen/create-case",
    label: "Find a Lawyer",
    icon: Search,
    match: (p) => p.startsWith("/citizen/create-case"),
  },
  {
    to: "/citizen/subscriptions",
    label: "Plans",
    icon: CreditCard,
    match: (p) => p.startsWith("/citizen/subscriptions"),
  },
  {
    to: "/citizen/profile",
    label: "My Profile",
    icon: User,
    match: (p) => p.startsWith("/citizen/profile"),
  },
];

/** Admin-only mobile bottom tab bar destinations. */
const ADMIN_BOTTOM_NAV: {
  to: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
}[] = [
  { to: "/admin", label: "Home", icon: LayoutGrid, match: (p) => p === "/admin" },
  { to: "/admin/users", label: "Users", icon: Users, match: (p) => p.startsWith("/admin/users") },
  {
    to: "/admin/lawyers",
    label: "Lawyers",
    icon: Scale,
    match: (p) => p.startsWith("/admin/lawyers"),
  },
  {
    to: "/admin/cases",
    label: "Case Management",
    icon: Folder,
    match: (p) => p.startsWith("/admin/cases"),
  },
  {
    to: "/admin/knowledge-base",
    label: "Knowledge Base",
    icon: BookOpen,
    match: (p) => p.startsWith("/admin/knowledge-base"),
  },
];

function bottomNavForRole(role: "citizen" | "lawyer" | "admin") {
  if (role === "lawyer") return LAWYER_BOTTOM_NAV;
  if (role === "admin") return ADMIN_BOTTOM_NAV;
  return CITIZEN_BOTTOM_NAV;
}

/** M3 navigation-drawer destination item — active state is a secondary-container pill. */
function NavDestination({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[var(--md-sys-shape-corner-full)] px-3.5 py-2.5 text-sm transition-colors ${
        active
          ? "bg-[var(--md-sys-color-secondary-container)] font-semibold text-[var(--md-sys-color-on-secondary-container)]"
          : "text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-on-surface)]/8 hover:text-[var(--md-sys-color-on-surface)]"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {item.label}
    </Link>
  );
}

function NavList({
  nav,
  pathname,
  role,
  onItemClick,
}: {
  nav: NavItem[];
  pathname: string;
  role: string;
  onItemClick?: () => void;
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
      {nav.map((item, idx) => {
        const active =
          pathname === item.to || (item.to !== `/${role}` && pathname.startsWith(item.to));
        const showSection = item.section && item.section !== nav[idx - 1]?.section;
        return (
          <div key={item.to}>
            {showSection && (
              <div
                className={`px-3.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)]/70 ${idx === 0 ? "" : "mt-3"}`}
              >
                {item.section}
              </div>
            )}
            <NavDestination item={item} active={active} onClick={onItemClick} />
          </div>
        );
      })}
    </nav>
  );
}

export function DashboardLayout({
  role,
  roleLabel,
  userName,
  nav,
  children,
  fullBleed = false,
  hideBottomNav = false,
  hideFloatingWidgets = false,
}: {
  role: "citizen" | "lawyer" | "admin";
  roleLabel: string;
  userName: string;
  nav: NavItem[];
  children: ReactNode;
  /** For pages like chat and the Find a Lawyer wizard that need to fill the
   *  exact remaining height and manage their own internal scrolling — skips
   *  main's padding/max-width wrapper (which has no defined height) and stops
   *  main itself from scrolling, so a h-full child is actually bounded by
   *  real space. Independent of `hideBottomNav`/`hideFloatingWidgets` — most
   *  fullBleed pages still want the floating tab bar and widgets visible. */
  fullBleed?: boolean;
  /** Hides the floating mobile bottom tab bar — for pages like chat that pin
   *  their own message composer to the bottom of the screen, which the tab
   *  bar would otherwise sit on top of. */
  hideBottomNav?: boolean;
  /** Hides the WhatsApp/Legal Bot bottom-right floating buttons — for pages
   *  with their own bottom-right action button(s) (e.g. the Find a Lawyer
   *  wizard's Continue button) that these would otherwise sit on top of. */
  hideFloatingWidgets?: boolean;
}) {
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const mainRef = useRef<HTMLElement>(null);
  const { logout } = useAuth();

  const resetScroll = () => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    const dashboardMain = document.getElementById("dashboard-main");
    if (dashboardMain) {
      dashboardMain.scrollTop = 0;
    }
    document.querySelectorAll("main, [data-scroll-container]").forEach((el) => {
      el.scrollTop = 0;
    });
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  useLayoutEffect(() => {
    resetScroll();
  }, [pathname]);

  useEffect(() => {
    resetScroll();
    const rafId = requestAnimationFrame(resetScroll);
    const timer = setTimeout(resetScroll, 50);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [pathname]);

  useEffect(() => {
    return router.subscribe("onRendered", () => {
      resetScroll();
      requestAnimationFrame(resetScroll);
    });
  }, [router]);

  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [botMenuOpen, setBotMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(
    () => getNotifications(role).filter((n) => !n.read).length,
  );
  // Admin has no seed identity photo of their own — the site logo stands in
  // until a real photo is uploaded, instead of a random name-hashed avatar.
  const defaultPhotoUrl = role === "admin" ? "/logo.svg" : undefined;
  const [photoUrl, setPhotoUrl] = useState(() => getProfilePhoto(role) ?? defaultPhotoUrl);
  const [showLocationToast, setShowLocationToast] = useState(false);

  useEffect(() => {
    notificationService
      .getNotifications({ role })
      .then((backendAlerts) => {
        if (Array.isArray(backendAlerts)) {
          const unread = backendAlerts.filter((n) => !n.read).length;
          if (unread > 0) setUnreadCount(unread);
        }
      })
      .catch((err: unknown) => {
        console.warn("[Dashboard Layout] Notification count notice:", err);
      });

    const sync = () => {
      setUnreadCount(getNotifications(role).filter((n) => !n.read).length);
      setPhotoUrl(getProfilePhoto(role) ?? defaultPhotoUrl);
    };
    return subscribeToStore(sync);
  }, [role, defaultPhotoUrl]);

  // Every time a citizen/lawyer session lands on the dashboard, briefly show
  // a "Detecting location…" card so the location-based matching feels alive.
  useEffect(() => {
    if (role !== "citizen" && role !== "lawyer") return;
    setShowLocationToast(true);
    const timer = setTimeout(() => setShowLocationToast(false), 1600);
    return () => clearTimeout(timer);
  }, [role]);

  const bottomNav = bottomNavForRole(role);

  return (
    <VideoCallProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* ── Mobile Navigation Drawer (modal) ── */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Scrim */}
            <div
              className="fixed inset-0 bg-[var(--md-sys-color-scrim)]/40 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Drawer */}
            <div className="relative w-64 max-w-[80%] flex-col bg-[var(--md-sys-color-surface-container-low)] shadow-[var(--md-sys-elevation-level1)] flex animate-in slide-in-from-left-full duration-200">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] px-5">
                <Link
                  to="/"
                  className="flex items-center gap-2.5 tracking-tight"
                  onClick={() => setMobileMenuOpen(false)}
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
                <IconButton ariaLabel="Close menu" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>

              <NavList
                nav={nav}
                pathname={pathname}
                role={role}
                onItemClick={() => setMobileMenuOpen(false)}
              />

              {(role === "lawyer" || role === "citizen") && (
                <div className="shrink-0 border-t border-[var(--md-sys-color-outline-variant)] p-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setBotMenuOpen(true);
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-[var(--md-sys-shape-corner-full)] px-3.5 py-2.5 text-sm text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:bg-[var(--md-sys-color-on-surface)]/8 hover:text-[var(--md-sys-color-on-surface)]"
                  >
                    <Bot className="h-[18px] w-[18px] shrink-0" />
                    Legal Bot
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Permanent Navigation Drawer (desktop) ── */}
        <aside className="hidden w-56 flex-shrink-0 flex-col bg-[var(--md-sys-color-surface-container-low)] border-r border-[var(--md-sys-color-outline-variant)] md:flex h-screen sticky top-0">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center border-b border-[var(--md-sys-color-outline-variant)] px-5">
            <Link
              to="/"
              className="flex items-center gap-2.5 tracking-tight hover:opacity-90 transition-opacity"
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
          </div>

          <NavList nav={nav} pathname={pathname} role={role} />

          {(role === "lawyer" || role === "citizen") && (
            <div className="shrink-0 border-t border-[var(--md-sys-color-outline-variant)] p-2">
              <button
                onClick={() => setBotMenuOpen(true)}
                className="flex w-full cursor-pointer items-center gap-3 rounded-[var(--md-sys-shape-corner-full)] px-3.5 py-2.5 text-sm text-[var(--md-sys-color-on-surface-variant)] transition-colors hover:bg-[var(--md-sys-color-on-surface)]/8 hover:text-[var(--md-sys-color-on-surface)]"
              >
                <Bot className="h-[18px] w-[18px] shrink-0" />
                Legal Bot
              </button>
            </div>
          )}
        </aside>

        {/* ── Right column: top app bar + scrollable content ── */}
        <div className="flex flex-1 flex-col min-w-0 h-screen">
          {/* Top App Bar (M3 small top app bar) */}
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--md-sys-color-outline-variant)] bg-surface px-4 sm:px-6 sticky top-0 z-40">
            {/* Mobile: hamburger only */}
            <div className="flex items-center gap-1 md:hidden">
              <IconButton ariaLabel="Open menu" onClick={() => setMobileMenuOpen(true)}>
                <MenuIcon className="h-5 w-5" />
              </IconButton>
            </div>
            {/* Desktop: location indicator on the left */}
            <div className="hidden md:block">
              {(role === "citizen" || role === "lawyer") && <LocationIndicator />}
            </div>

            {/* Right: video calls + bell + profile */}
            <div className="flex items-center gap-1 sm:gap-2">
              {role === "citizen" && <CitizenLanguageButtons size="sm" showLabel={false} />}

              {(role === "citizen" || role === "lawyer") && <VideoCallsMenu role={role} />}

              {/* Notification bell */}
              <div className="relative">
                <IconButton
                  ariaLabel="Notifications"
                  onClick={() => navigate({ to: `/${role}/notifications` as never })}
                >
                  <Bell className="h-5 w-5" />
                </IconButton>
                {unreadCount > 0 && <Badge count={unreadCount} />}
              </div>

              {/* Profile menu — a custom M3-token-styled popover rather than md-menu, since
                md-menu is built strictly for lists of md-menu-item and doesn't handle
                mixed decorative content (the name/role header block) well. */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex cursor-pointer items-center gap-2 rounded-[var(--md-sys-shape-corner-full)] px-2 py-1.5 text-sm transition-colors hover:bg-[var(--md-sys-color-on-surface)]/8"
                >
                  <UserAvatar name={userName} photoUrl={photoUrl} size="sm" role={role} />
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>

                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40 cursor-pointer"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-[var(--md-sys-shape-corner-medium)] bg-[var(--md-sys-color-surface-container)] shadow-[var(--md-sys-elevation-level2)]">
                      <div className="flex items-center gap-2.5 border-b border-[var(--md-sys-color-outline-variant)] px-4 py-3">
                        <UserAvatar name={userName} photoUrl={photoUrl} size="md" role={role} />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">
                            {userName}
                          </div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {roleLabel}
                          </div>
                        </div>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            navigate({ to: `/${role}/profile` as never });
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-[var(--md-sys-shape-corner-small)] px-3 py-2 text-sm text-foreground transition-colors hover:bg-[var(--md-sys-color-on-surface)]/8"
                        >
                          <User className="h-4 w-4 text-muted-foreground" />
                          My Profile
                        </button>
                        <button
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                            navigate({ to: role === "citizen" ? "/citizen-login" : "/login" });
                          }}
                          className="flex w-full cursor-pointer items-center gap-2 rounded-[var(--md-sys-shape-corner-small)] px-3 py-2 text-sm text-[var(--md-sys-color-error)] transition-colors hover:bg-[var(--md-sys-color-error)]/8"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* "Detecting location…" pop-up — anchored right after the header (and
            the mobile location strip, when shown) so it never covers the
            hamburger/bell/profile controls, regardless of which bar sits above it. */}
          {showLocationToast && (
            <div className="relative z-50 h-0">
              <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center px-4">
                <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                  <MapPin className="h-4 w-4 shrink-0 animate-pulse text-primary" />
                  <span className="text-xs font-semibold text-foreground">Detecting location…</span>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable main content (or, for fullBleed pages like chat, a strictly bounded box) */}
          <main
            id="dashboard-main"
            data-scroll-container="true"
            data-scroll-restoration-id="dashboard-main"
            ref={mainRef}
            className={
              fullBleed
                ? "flex-1 min-h-0 overflow-hidden"
                : "flex-1 min-h-0 overflow-y-auto px-3 py-3 sm:px-6 sm:py-6 md:px-10 md:py-5 pb-24 md:pb-10"
            }
          >
            {fullBleed ? (
              <div key={pathname} className="h-full w-full">
                {children}
              </div>
            ) : (
              <div
                key={pathname}
                className={`mx-auto w-full space-y-4 sm:space-y-6 ${role === "citizen" ? "max-w-6xl" : "max-w-none"}`}
              >
                {children}
              </div>
            )}
          </main>
        </div>

        {/* ── Mobile Navigation Bar — flush, edge-to-edge bottom tab bar pinned to
              the bottom of the viewport; every role gets one. ── */}
        {!hideBottomNav && (
          <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] shadow-[var(--md-sys-elevation-level2)] md:hidden">
            {bottomNav.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex flex-1 flex-col items-center gap-0.5 px-0.5 py-2.5 text-center text-[9.5px] font-semibold leading-tight"
                >
                  <span
                    className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                      active ? "bg-[var(--md-sys-color-secondary-container)]" : ""
                    }`}
                  >
                    <Icon
                      className={`h-4.5 w-4.5 ${active ? "text-[var(--md-sys-color-on-secondary-container)]" : "text-[var(--md-sys-color-on-surface-variant)]"}`}
                    />
                  </span>
                  <span
                    className={
                      active
                        ? "text-[var(--md-sys-color-on-surface)]"
                        : "text-[var(--md-sys-color-on-surface-variant)]"
                    }
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}

        {/* Floating widgets — except pages that pin their own bottom-right action
          button(s) to the screen, where these would overlap it. Lawyer and citizen
          get WhatsApp in the floating slot and Legal Bot moves into the sidebar/
          hamburger menu instead; admin keeps the floating bot trigger, raised to
          clear its bottom tab bar. */}
        {!hideBottomNav && !hideFloatingWidgets && (role === "lawyer" || role === "citizen") && (
          <>
            <WhatsAppFloatingButton position="right" raised />
            <LexBot open={botMenuOpen} onOpenChange={setBotMenuOpen} hideTrigger />
          </>
        )}
        {!hideBottomNav && !hideFloatingWidgets && role === "admin" && <LexBot raised />}
      </div>
    </VideoCallProvider>
  );
}
