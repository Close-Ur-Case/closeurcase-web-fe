import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { Eye, EyeOff, Lock, Mail, AlertCircle, Loader2 } from "lucide-react";
import { TextField, IconButton, Button } from "@/components/m3";
import { useLawyerLogin } from "@/hooks/queries/useAuth";
import { getStoredToken, getStoredUser } from "@/services/apiClient";
import type { AuthUser } from "@/types/api";

import { validateEmail } from "@/lib/validations";

export const Route = createFileRoute("/lawyer-login")({
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
  head: () => ({ meta: [{ title: "Lawyer sign in — CloseUrCase" }] }),
  component: LawyerLogin,
});

export function LawyerLogin() {
  const navigate = useNavigate();
  const lawyerLogin = useLawyerLogin();
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  const isPending = lawyerLogin.isPending;

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
      title="Lawyer sign in"
      subtitle="Email and password for Advocates and Legal Counsel."
      footer={
        <>
          Citizen user?{" "}
          <Link to="/citizen-login" className="font-semibold text-primary hover:underline">
            Sign in with mobile or email
          </Link>
          {" · "}
          New Lawyer?{" "}
          <Link to="/lawyer-register" className="font-semibold text-primary hover:underline">
            Register
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onKeyDown={handleFormEnterKey}
        onSubmit={async (e) => {
          e.preventDefault();
          setEmailTouched(true);
          setLoginError(null);
          if (!emailRes.isValid) return;
          try {
            await lawyerLogin.mutateAsync({ email, password });
            navigate({ to: "/lawyer" });
          } catch (err: unknown) {
            const message =
              err instanceof Error
                ? err.message
                : "Authentication failed. Please verify lawyer credentials.";
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
            label="Email address"
            type="email"
            required
            value={email}
            onChange={(v) => {
              setEmail(v);
              setEmailTouched(true);
            }}
            placeholder="advocate@example.com"
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
              Signing in…
            </span>
          ) : (
            "Sign in as Lawyer"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
