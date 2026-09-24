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
          // Never automatically log out on background validation error
          // Session remains intact in localStorage and user only logs out on manual Sign out
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
