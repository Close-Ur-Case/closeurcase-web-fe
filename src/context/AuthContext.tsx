import { useState, useEffect, useCallback, type ReactNode } from "react";
import type { AuthUser } from "@/types/api";
import {
  getStoredToken,
  getStoredUser,
  clearAuthStorage,
  setStoredToken,
  setStoredUser,
} from "@/services/apiClient";
import { authService } from "@/services/authService";
import { setCitizenSession, clearCitizenSession } from "@/features/citizen/session";
import { AuthContext } from "./useAuth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getStoredToken);
  const [user, setUserState] = useState<AuthUser | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const role = user?.role || null;
  const isAuthenticated = Boolean(token || user);

  const logout = useCallback(() => {
    clearAuthStorage();
    clearCitizenSession();
    setTokenState(null);
    setUserState(null);
  }, []);

  const loginCitizen = useCallback((newToken: string | undefined, newUser: AuthUser) => {
    if (newToken) {
      setStoredToken(newToken);
      setTokenState(newToken);
    }
    const citizenUser: AuthUser = { ...newUser, role: "citizen" };
    setStoredUser(citizenUser);
    setUserState(citizenUser);

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
  }, []);

  const loginAdmin = useCallback((newToken: string | undefined, newUser: AuthUser) => {
    if (newToken) {
      setStoredToken(newToken);
      setTokenState(newToken);
    }
    const adminUser: AuthUser = { ...newUser, role: "admin" };
    setStoredUser(adminUser);
    setUserState(adminUser);
  }, []);

  const setUser = useCallback((updatedUser: AuthUser | null) => {
    setStoredUser(updatedUser);
    setUserState(updatedUser);
  }, []);

  // Listen to unauthorized event dispatched from apiClient
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener("cuc:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("cuc:unauthorized", handleUnauthorized);
  }, [logout]);

  // Optionally verify session on boot if token exists
  useEffect(() => {
    if (token && !user) {
      setIsLoading(true);
      authService
        .getCurrentUser()
        .then((fetchedUser) => {
          if (fetchedUser) {
            setUserState(fetchedUser);
          }
        })
        .catch(() => {
          // If token expired/invalid, clear
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [token, user, logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        isLoading,
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
