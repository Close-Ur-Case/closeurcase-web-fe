import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm, type ProfileFormFields } from "@/components/app/ProfileForm";
import { getAdminProfile, updateAdminProfile } from "@/data/appStore";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/profile")({
  component: AdminProfilePage,
});

function AdminProfilePage() {
  const profile = useMemo(() => getAdminProfile(), []);

  function handleSave(fields: ProfileFormFields) {
    updateAdminProfile(fields);
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your platform administrator account details."
        actionsPosition="below"
      />

      <ProfileForm
        role="admin"
        defaults={profile}
        defaultPhotoUrl="/logo.svg"
        wide
        onSave={handleSave}
        extraField={() => (
          <div className="space-y-4 rounded-2xl border border-border/80 bg-surface/95 p-5 shadow-2xs sm:p-6">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-primary shrink-0" />
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Admin Authorization & Security
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                Highest Privilege
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-foreground">Super Administrator Access</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Full platform access — Lawyer verification, user management, case oversight, and knowledge base control.
              </p>
            </div>
          </div>
        )}
      />
    </>
  );
}
