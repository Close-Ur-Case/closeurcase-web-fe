import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { TextField, IconButton, Button } from "@/components/m3";

import { validateEmail } from "@/lib/validations";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Lawyer & Admin sign in — CloseUrCase" }] }),
  component: Login,
});

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("lawyer@CloseUrCase.app");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  const emailRes = validateEmail(email);
  const getRole = (e: string) => (e.includes("admin") ? "admin" : "lawyer");

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
      title="Lawyer & Admin sign in"
      subtitle="Email and password for Lawyers and platform administrators."
      footer={
        <>
          Citizen user?{" "}
          <Link to="/citizen-login" className="font-semibold text-primary hover:underline">
            Sign in with mobile number
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
        onSubmit={(e) => {
          e.preventDefault();
          setEmailTouched(true);
          if (!emailRes.isValid) return;
          const role = getRole(email);
          navigate({ to: role === "lawyer" ? "/lawyer" : "/admin" });
        }}
      >
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
            placeholder="you@example.com"
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

        <Button type="submit" variant="filled" className="-mt-3 w-full">
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
