import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { CitizenLoginButton } from "@/components/app/CitizenLoginButton";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { Scale } from "lucide-react";
import { Card } from "@/components/m3";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Join CloseUrCase" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  if (!permissionsAcknowledged) {
    return <PermissionsGate onContinue={acknowledgePermissions} image="/citizen-login.png" />;
  }

  return (
    <AuthLayout
      centerLogoOnMobile
      title="Join CloseUrCase"
      subtitle="Citizens sign in with a mobile number. Lawyers register separately."
      footer={
        <>
          Lawyer or admin?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Email sign in
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        <CitizenLoginButton
          label="Citizen Login"
          className="!bg-[var(--md-sys-color-primary)] !text-[var(--md-sys-color-on-primary)] hover:!opacity-90"
        />
        <Card
          variant="outlined"
          onClick={() => navigate({ to: "/lawyer-register" })}
          className="flex w-full items-center gap-3 p-4 text-left hover:border-[var(--md-sys-color-primary)]"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--md-extended-color-lawyer) 15%, transparent)",
              color: "var(--md-extended-color-lawyer)",
            }}
          >
            <Scale className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-foreground">Register as Lawyer</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Bar ID verification required
            </span>
          </span>
        </Card>
      </div>
    </AuthLayout>
  );
}
