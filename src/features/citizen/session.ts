export type CitizenCasePath = "new" | "filed" | "hearing" | "order" | "judgment" | "closed";

export type CitizenLanguage = "en" | "hi" | "te";

export interface CitizenSession {
  authenticated: boolean;
  phone: string;
  email?: string;
  fullName?: string;
  casePath: CitizenCasePath;
  language: CitizenLanguage;
}

const STORAGE_KEY = "CloseUrCase.citizen.session";

const defaultSession: CitizenSession = {
  authenticated: false,
  phone: "",
  casePath: "new",
  language: "en",
};

export function getCitizenSession(): CitizenSession {
  if (typeof window === "undefined") return defaultSession;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...defaultSession, ...JSON.parse(raw) };
    }

    // Auto-heal from primary auth storage if available
    const authUserRaw = localStorage.getItem("cuc_auth_user");
    if (authUserRaw) {
      const authUser = JSON.parse(authUserRaw);
      if (authUser && (authUser.role === "citizen" || !authUser.role)) {
        return {
          ...defaultSession,
          authenticated: true,
          phone: authUser.phone || "",
          email: authUser.email || undefined,
          fullName: authUser.name || "Citizen",
        };
      }
    }

    return defaultSession;
  } catch {
    return defaultSession;
  }
}

export function setCitizenSession(partial: Partial<CitizenSession>) {
  if (typeof window === "undefined") return;
  const next = { ...getCitizenSession(), ...partial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearCitizenSession() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function formatCitizenPhoneDisplay(phone?: string, email?: string) {
  if (phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }
    if (digits.length > 0) return phone;
  }
  if (email) return email;
  return "Citizen";
}
