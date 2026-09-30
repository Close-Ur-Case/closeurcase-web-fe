import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { TextField, IconButton, Button } from "@/components/m3";
import { useAdminLogin } from "@/hooks/queries/useAuth";
import { getStoredToken, getStoredUser } from "@/services/apiClient";
import type { AuthUser } from "@/types/api";
import { validateEmail } from "@/lib/validations";

export const Route = createFileRoute("/admin-login")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const token = getStoredToken();
      const user = getStoredUser<AuthUser>();
      if (token || user) {
        if (user?.role === "admin") throw redirect({ to: "/admin" });
        if (user?.role === "lawyer") throw redirect({ to: "/lawyer" });
        if (user?.role === "citizen") throw redirect({ to: "/citizen" });
      }
    }
  },
  head: () => ({ meta: [{ title: "Admin sign in — CloseUrCase" }] }),
  component: AdminLogin,
});

export function AdminLogin() {
  const navigate = useNavigate();
  const adminLogin = useAdminLogin();
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  const isPending = adminLogin.isPending;
  const emailRes = validateEmail(email);

  const handleFormEnterKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.closest("textarea")) return;
    const form = target.closest("form");
    if (!form) return;
    e.preventDefault();
    form.requestSubmit();
  };

  if (!permissionsAcknowledged) {
    return <PermissionsGate onContinue={acknowledgePermissions} />;
  }

  return (
    <AuthLayout
      centerLogoOnMobile
      centerOnMobile
      title="Admin portal sign in"
      subtitle="Authorized access for platform administrators and system controllers."
    >
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-300">
        <ShieldCheck className="h-4 w-4" />
        <span>Platform Administration Console</span>
      </div>

      <form
        className="space-y-5"
        onKeyDown={handleFormEnterKey}
        onSubmit={async (e) => {
          e.preventDefault();
          setEmailTouched(true);
          setLoginError(null);
          if (!emailRes.isValid) return;
          try {
            await adminLogin.mutateAsync({ email, password });
            navigate({ to: "/admin" });
          } catch (err: unknown) {
            const message =
              err instanceof Error
                ? err.message
                : "Authentication failed. Please verify administrator credentials.";
            setLoginError(message);
          }
        }}
      >
        {loginError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <div className="space-y-1">
          <TextField
            label="Administrator email"
            type="email"
            required
            value={email}
            onChange={(v) => {
              setEmail(v);
              setEmailTouched(true);
            }}
            placeholder="admin@closeurcase.in"
            leadingIcon={<Mail className="h-4 w-4" />}
            error={emailTouched && !emailRes.isValid}
            className="w-full"
          />
          {emailTouched && !emailRes.isValid && (
            <p className="text-[11px] font-medium text-destructive">{emailRes.error}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            leadingIcon={<Lock className="h-4 w-4" />}
            trailingIcon={
              <IconButton
                ariaLabel={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </IconButton>
            }
            className="w-full"
          />
          <div className="flex justify-end">
            <Button variant="text" className="h-auto! min-h-0! px-0! text-xs">
              Forgot password?
            </Button>
          </div>
        </div>

        <Button type="submit" variant="filled" disabled={isPending} className="-mt-3 w-full">
          {isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying credentials…
            </span>
          ) : (
            "Sign in to Admin Console"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
