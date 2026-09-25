import { useState, useEffect, useCallback, type ReactNode } from "react";
import type { AuthUser } from "@/types/api";
import {
  getStoredToken,
  getStoredUser,
  clearAuthStorage,
  setStoredToken,
  setStoredUser,
  isJwtExpired,
} from "@/services/apiClient";
import { authService } from "@/services/authService";
import { setCitizenSession, clearCitizenSession } from "@/features/citizen/session";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getStoredToken);
  const [user, setUserState] = useState<AuthUser | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSessionExpired, setIsSessionExpired] = useState<boolean>(false);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  const role = user?.role || null;
  const isAuthenticated = Boolean(token || user);

  const openSessionExpiredModal = useCallback((message?: string) => {
    setIsSessionExpired(true);
    if (message) setSessionExpiredMessage(message);
  }, []);

  const closeSessionExpiredModal = useCallback(() => {
    setIsSessionExpired(false);
    setSessionExpiredMessage(null);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
    clearCitizenSession();
    setTokenState(null);
    setUserState(null);
    setIsSessionExpired(false);
    setSessionExpiredMessage(null);
  }, []);

  const relogin = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await authService.autoLogin();
      if (result && (result.token || result.user)) {
        if (result.token) {
          setStoredToken(result.token);
          setTokenState(result.token);
        }
        if (result.user) {
          setStoredUser(result.user);
          setUserState(result.user);
        }
        setIsSessionExpired(false);
        setSessionExpiredMessage(null);
        return true;
      }
      return false;
    } catch (err) {
      console.warn("[AuthContext] Auto-login attempt failed:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginCitizen = useCallback((newToken: string | undefined, newUser: AuthUser) => {
    if (newToken) {
      setStoredToken(newToken);
      setTokenState(newToken);
    }
    const citizenUser: AuthUser = { ...newUser, role: "citizen" };
    setStoredUser(citizenUser);
    setUserState(citizenUser);
    setIsSessionExpired(false);
    setSessionExpiredMessage(null);

    // Backward-compatibility bridge with citizen sessionStorage
    setCitizenSession({
      authenticated: true,
      phone: citizenUser.phone || "",
      email: citizenUser.email || undefined,
      fullName: citizenUser.name || "Citizen",
    });
  }, []);

  const loginLawyer = useCallback((newToken: string | undefined, newUser: AuthUser) => {
    if (newToken) {
      setStoredToken(newToken);
      setTokenState(newToken);
    }
    const lawyerUser: AuthUser = { ...newUser, role: "lawyer" };
    setStoredUser(lawyerUser);
    setUserState(lawyerUser);
    setIsSessionExpired(false);
    setSessionExpiredMessage(null);
  }, []);

  const loginAdmin = useCallback((newToken: string | undefined, newUser: AuthUser) => {
    if (newToken) {
      setStoredToken(newToken);
      setTokenState(newToken);
    }
    const adminUser: AuthUser = { ...newUser, role: "admin" };
    setStoredUser(adminUser);
    setUserState(adminUser);
    setIsSessionExpired(false);
    setSessionExpiredMessage(null);
  }, []);

  const setUser = useCallback((updatedUser: AuthUser | null) => {
    setStoredUser(updatedUser);
    setUserState(updatedUser);
  }, []);

  // Listen to global 401 session-expired event dispatched by apiClient
  useEffect(() => {
    const handleSessionExpired = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string }>;
      setIsSessionExpired(true);
      if (customEvent.detail?.message) {
        setSessionExpiredMessage(customEvent.detail.message);
      }
    };

    window.addEventListener("cuc:session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("cuc:session-expired", handleSessionExpired);
    };
  }, []);

  // Check client-side JWT expiration periodically or on mount
  useEffect(() => {
    if (token && isJwtExpired(token)) {
      setIsSessionExpired(true);
      setSessionExpiredMessage("Your security session token has expired. Please re-login.");
    }
  }, [token]);

  // Re-verify session in background on boot if token exists, without logging out on failure
  useEffect(() => {
    if (token) {
      authService
        .getCurrentUser()
        .then((fetchedUser) => {
          if (fetchedUser) {
            setUserState(fetchedUser);
          }
        })
        .catch((err) => {
          console.warn("[AuthContext] Background session check warning:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isLoading,
        isSessionExpired,
        sessionExpiredMessage,
        openSessionExpiredModal,
        closeSessionExpiredModal,
        relogin,
        loginCitizen,
        loginLawyer,
        loginAdmin,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

