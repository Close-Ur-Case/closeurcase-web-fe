import { cn } from "@/lib/utils";
import type { CitizenLanguage } from "@/features/citizen/session";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";

const LANG_OPTIONS: { value: CitizenLanguage; letter: string; name: string }[] = [
  { value: "en", letter: "E", name: "English" },
  { value: "hi", letter: "ह", name: "Hindi" },
  { value: "te", letter: "త", name: "Telugu" },
];

type CitizenLanguageButtonsProps = {
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
};

export function CitizenLanguageButtons({
  className,
  size = "md",
  showLabel = true,
}: CitizenLanguageButtonsProps) {
  // Language switching is currently hidden
  return null;
}
