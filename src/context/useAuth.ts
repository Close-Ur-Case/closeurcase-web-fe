import { createContext, useContext } from "react";
import type { AuthUser } from "@/types/api";

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  role: "citizen" | "lawyer" | "admin" | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionExpired: boolean;
  sessionExpiredMessage: string | null;
  openSessionExpiredModal: (message?: string) => void;
  closeSessionExpiredModal: () => void;
  relogin: () => Promise<boolean>;
  loginCitizen: (token: string | undefined, user: AuthUser) => void;
  loginLawyer: (token: string | undefined, user: AuthUser) => void;
  loginAdmin: (token: string | undefined, user: AuthUser) => void;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
