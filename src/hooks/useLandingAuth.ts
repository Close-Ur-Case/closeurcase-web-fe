import { useAuth } from "@/context/useAuth";
import { getCitizenSession } from "@/features/citizen/session";

export function useLandingAuth() {
  const { user, isAuthenticated, role, token } = useAuth();
  const citizenSession = getCitizenSession();

  const isCitizen =
    role === "citizen" ||
    (!role && (citizenSession.authenticated || Boolean(token && !user?.role)));
  const isLawyer = role === "lawyer";
  const isAdmin = role === "admin";
  const isLoggedIn = Boolean(isAuthenticated || citizenSession.authenticated || token || user);

  const isSuspended = user?.status === "Suspended";

  /**
   * CITIZEN ROUTES:
   * Citizen features MUST ALWAYS navigate to citizen routes!
   * - If citizen is already logged in (not signed out): auto-login directly into citizen workspace.
   * - If citizen is suspended: route only to /citizen/profile.
   * - If citizen is not logged in: navigate to /citizen-login.
   * - NEVER navigate to /lawyer.
   */
  const citizenFileCaseTo = isCitizen
    ? isSuspended
      ? "/citizen/profile"
      : "/citizen/create-case"
    : "/citizen-login";
  const citizenDashboardTo = isCitizen
    ? isSuspended
      ? "/citizen/profile"
      : "/citizen"
    : "/citizen-login";
  const citizenMyCasesTo = isCitizen
    ? isSuspended
      ? "/citizen/profile"
      : "/citizen/my-cases"
    : "/citizen-login";
  const citizenSubscriptionsTo = isCitizen
    ? isSuspended
      ? "/citizen/profile"
      : "/citizen/subscriptions"
    : "/citizen-login";

  /**
   * LAWYER ROUTES:
   * Lawyer features MUST ALWAYS navigate to lawyer routes!
   * - If lawyer is already logged in (not signed out): auto-login directly into lawyer workspace.
   * - If lawyer is suspended: route only to /lawyer/profile.
   * - If lawyer is not logged in: navigate to /lawyer-login or /lawyer-register.
   * - NEVER navigate to /citizen.
   */
  const lawyerDashboardTo = isLawyer
    ? isSuspended
      ? "/lawyer/profile"
      : "/lawyer"
    : "/lawyer-login";
  const lawyerRegisterTo = isLawyer
    ? isSuspended
      ? "/lawyer/profile"
      : "/lawyer"
    : "/lawyer-register";
  const lawyerCasesTo = isLawyer
    ? isSuspended
      ? "/lawyer/profile"
      : "/lawyer/cases"
    : "/lawyer-login";

  return {
    user,
    role,
    isCitizen,
    isLawyer,
    isAdmin,
    isLoggedIn,
    citizenFileCaseTo,
    citizenDashboardTo,
    citizenMyCasesTo,
    citizenSubscriptionsTo,
    lawyerDashboardTo,
    lawyerRegisterTo,
    lawyerCasesTo,
  };
}
