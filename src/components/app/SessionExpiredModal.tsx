import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/context/useAuth";
import {
  Clock,
  RotateCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  User,
} from "lucide-react";
import { Button } from "@/components/m3";

export function SessionExpiredModal() {
  const {
    isSessionExpired,
    sessionExpiredMessage,
    closeSessionExpiredModal,
    relogin,
    logout,
    user,
    role,
  } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isSessionExpired) return null;

  const userRole = role || user?.role || "citizen";
  const userDisplayName =
    user?.name ||
    (userRole === "admin"
      ? "Platform Admin"
      : userRole === "lawyer"
        ? "Advocate"
        : "Citizen User");
  const userIdentifier = user?.phone || user?.email || "";

  const handleRelogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const restored = await relogin();
      if (restored) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setIsSubmitting(false);
          closeSessionExpiredModal();
        }, 900);
      } else {
        setIsSubmitting(false);
        setErrorMessage(
          "Auto-login was unable to restore your session automatically. Please click Logout and sign in again.",
        );
      }
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Auto-login failed. Please sign in again to continue.",
      );
    }
  };

  const handleLogout = () => {
    closeSessionExpiredModal();
    logout();
    if (userRole === "lawyer" || userRole === "admin") {
      navigate({ to: "/login" });
    } else {
      navigate({ to: "/citizen-login" });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/80 bg-background/95 p-6 shadow-2xl backdrop-blur-md transition-all sm:p-7 animate-in zoom-in-95 duration-200">
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-amber-500/15 blur-2xl dark:bg-amber-400/10" />
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-primary/15 blur-2xl" />

        <div className="relative flex flex-col items-center text-center">
          {/* Icon Badge */}
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner ring-1 ring-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400">
            {success ? (
              <CheckCircle2 className="h-7 w-7 text-emerald-500 animate-in zoom-in-50 duration-200" />
            ) : isSubmitting ? (
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            ) : (
              <Clock className="h-7 w-7 animate-pulse text-amber-600 dark:text-amber-400" />
            )}
          </div>

          {/* Title */}
          <h2
            id="session-expired-title"
            className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
          >
            {success ? "Session Restored!" : "Session Expired"}
          </h2>

          {/* Description */}
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {success
              ? "Your session has been restored successfully. You can continue right where you left off."
              : sessionExpiredMessage ||
                "Your authentication token has expired. Click Re-login to auto-login again without losing your entered data, or click Logout to end the session."}
          </p>

          {/* User Preview Card */}
          {user && (
            <div className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/40 p-3 text-left">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-xs font-semibold text-foreground">
                      {userDisplayName}
                    </span>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                      {userRole}
                    </span>
                  </div>
                  {userIdentifier && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {userIdentifier}
                    </p>
                  )}
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-3 w-3" />
                Expired
              </span>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="mt-4 flex w-full items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-left text-xs text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="leading-tight">{errorMessage}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex w-full flex-col-reverse gap-2.5 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outlined"
              onClick={handleLogout}
              disabled={isSubmitting || success}
              className="w-full flex items-center justify-center gap-2 border-border/80 text-foreground hover:bg-muted"
            >
              <LogOut className="h-4 w-4 text-muted-foreground" />
              <span>Logout</span>
            </Button>

            <Button
              type="button"
              variant="filled"
              onClick={handleRelogin}
              disabled={isSubmitting || success}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground shadow-sm hover:opacity-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Auto-logging in…</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Restored!</span>
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4" />
                  <span>Re-login</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
