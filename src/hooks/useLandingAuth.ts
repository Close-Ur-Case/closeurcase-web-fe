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
  const isLoggedIn = Boolean(
    isAuthenticated || citizenSession.authenticated || token || user,
  );

  /**
   * CITIZEN ROUTES:
   * Citizen features MUST ALWAYS navigate to citizen routes!
   * - If citizen is already logged in (not signed out): auto-login directly into citizen workspace.
   * - If citizen is not logged in: navigate to /citizen-login.
   * - NEVER navigate to /lawyer.
   */
  const citizenFileCaseTo = isCitizen ? "/citizen/create-case" : "/citizen-login";
  const citizenDashboardTo = isCitizen ? "/citizen" : "/citizen-login";
  const citizenMyCasesTo = isCitizen ? "/citizen/my-cases" : "/citizen-login";
  const citizenSubscriptionsTo = isCitizen ? "/citizen/subscriptions" : "/citizen-login";

  /**
   * LAWYER ROUTES:
   * Lawyer features MUST ALWAYS navigate to lawyer routes!
   * - If lawyer is already logged in (not signed out): auto-login directly into lawyer workspace.
   * - If lawyer is not logged in: navigate to /login or /lawyer-register.
   * - NEVER navigate to /citizen.
   */
  const lawyerDashboardTo = isLawyer ? "/lawyer" : "/login";
  const lawyerRegisterTo = isLawyer ? "/lawyer" : "/lawyer-register";
  const lawyerCasesTo = isLawyer ? "/lawyer/cases" : "/login";

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
