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
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSession;
    return { ...defaultSession, ...JSON.parse(raw) };
  } catch {
    return defaultSession;
  }
}

export function setCitizenSession(partial: Partial<CitizenSession>) {
  const next = { ...getCitizenSession(), ...partial };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearCitizenSession() {
  sessionStorage.removeItem(STORAGE_KEY);
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
