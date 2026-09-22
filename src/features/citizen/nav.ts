import { useMemo } from "react";
import { LayoutGrid, Search, Folder, User, Bell, CreditCard } from "lucide-react";
import type { NavItem } from "@/layouts/DashboardLayout";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";

/** Citizen sidebar/nav destinations — translated, unlike lawyer's and admin's
 * (citizen is the only role with an i18n system), so this is a hook rather
 * than a static array. */
export function useCitizenNav(): NavItem[] {
  const { translate } = useCitizenLanguage();

  return useMemo(
    () => [
      { to: "/citizen", label: translate("navDashboard"), icon: LayoutGrid },
      { to: "/citizen/create-case", label: translate("navFindLawyer"), icon: Search },
      { to: "/citizen/my-cases", label: translate("navMyCases"), icon: Folder },
      {
        to: "/citizen/subscriptions",
        label: translate("navMySubscriptions"),
        icon: CreditCard,
      },
      { to: "/citizen/notifications", label: translate("navNotifications"), icon: Bell },
      { to: "/citizen/profile", label: translate("navMyProfile"), icon: User },
    ],
    [translate],
  );
}
