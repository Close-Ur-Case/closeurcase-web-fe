import React, { useState } from "react";
import { Check, Copy, ArrowRight, ShieldCheck, Smartphone, Key, UserCheck, X } from "lucide-react";
import { Button } from "@/components/m3";

interface FakeLoginResponseModalProps {
  open: boolean;
  role: "lawyer" | "citizen";
  data: any;
  onContinue: () => void;
  onClose: () => void;
}

export function FakeLoginResponseModal({
  open,
  role,
  data,
  onContinue,
  onClose,
}: FakeLoginResponseModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const accessToken =
    data?.session?.accessToken ||
    data?.session?.access_token ||
    data?.token ||
    "N/A";

  const deviceToken =
    data?.session?.deviceToken ||
    data?.deviceToken ||
    data?.user?.deviceToken ||
    "N/A";

  const deviceType =
    data?.session?.deviceType ||
    data?.deviceType ||
    data?.user?.deviceType ||
    "web";

  const userIdentifier =
    data?.user?.email ||
    data?.user?.phone ||
    data?.user?.id ||
    "Authenticated User";

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fake-login-response-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border/80 bg-background/95 p-5 sm:p-6 shadow-2xl backdrop-blur-md transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-16 -left-16 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="fake-login-response-title"
                className="text-base sm:text-lg font-bold tracking-tight text-foreground flex items-center gap-2"
              >
                [Fake Popup - Login response]
              </h2>
              <p className="text-xs text-muted-foreground">
                Successful authentication response for{" "}
                <span className="font-semibold text-foreground capitalize">{role}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="overflow-y-auto py-3 space-y-3.5 pr-1 flex-1">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl border border-border bg-surface/50">
              <div className="text-muted-foreground text-[10px] uppercase font-semibold">Status</div>
              <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                200 OK
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-surface/50">
              <div className="text-muted-foreground text-[10px] uppercase font-semibold">Role</div>
              <div className="font-bold text-foreground capitalize mt-0.5 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-primary" />
                {role}
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-surface/50">
              <div className="text-muted-foreground text-[10px] uppercase font-semibold">Device Type</div>
              <div className="font-bold text-foreground mt-0.5 flex items-center gap-1">
                <Smartphone className="h-3.5 w-3.5 text-indigo-500" />
                {deviceType}
              </div>
            </div>

            <div className="p-2.5 rounded-xl border border-border bg-surface/50">
              <div className="text-muted-foreground text-[10px] uppercase font-semibold">User</div>
              <div className="font-bold text-foreground truncate mt-0.5" title={userIdentifier}>
                {userIdentifier}
              </div>
            </div>
          </div>

          {/* Device Token Pill */}
          <div className="p-2.5 rounded-xl border border-border bg-surface/40 flex items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Smartphone className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  deviceToken:
                </span>
                <span className="font-mono text-[11px] text-foreground truncate block max-w-sm sm:max-w-md">
                  {deviceToken !== "N/A" ? deviceToken : "None (not supplied on login)"}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                deviceToken !== "N/A"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {deviceToken !== "N/A" ? "Active" : "Unavailable"}
            </span>
          </div>

          {/* Access Token Pill */}
          <div className="p-2.5 rounded-xl border border-border bg-surface/40 flex items-start sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Key className="h-4 w-4 text-amber-500 shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  accessToken:
                </span>
                <span className="font-mono text-[11px] text-foreground truncate block max-w-sm sm:max-w-md">
                  {accessToken !== "N/A" ? `${accessToken.slice(0, 40)}...` : "None"}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              JWT Bearer
            </span>
          </div>

          {/* Full Raw JSON Viewer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                Full Response JSON:
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative rounded-xl border border-border/80 bg-slate-950 p-3 shadow-inner max-h-56 overflow-auto">
              <pre className="font-mono text-[11px] text-emerald-400/90 whitespace-pre leading-relaxed selection:bg-emerald-800">
                {jsonString}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outlined"
            onClick={onClose}
            className="text-xs h-9 px-4 cursor-pointer"
          >
            Close
          </Button>
          <Button
            type="button"
            variant="filled"
            onClick={onContinue}
            className="text-xs h-9 px-5 cursor-pointer font-semibold"
          >
            <span className="flex items-center gap-1.5">
              <span>Continue to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
