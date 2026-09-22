import { Archive, FilePlus, FileText, CalendarClock, Gavel, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";
import { setCitizenSession, type CitizenCasePath } from "@/features/citizen/session";

type CitizenCasePathPickerProps = {
  value: CitizenCasePath;
  onChange: (path: CitizenCasePath) => void;
  className?: string;
};

export function CitizenCasePathPicker({ value, onChange, className }: CitizenCasePathPickerProps) {
  const { translate } = useCitizenLanguage();

  const options: { id: CitizenCasePath; label: string; icon: React.ReactNode }[] = [
    { id: "new", label: translate("newCasePath"), icon: <FilePlus className="h-5 w-5 shrink-0" /> },
    { id: "filed", label: "Filed", icon: <FileText className="h-5 w-5 shrink-0" /> },
    { id: "hearing", label: "Hearing Stage", icon: <CalendarClock className="h-5 w-5 shrink-0" /> },
    { id: "order", label: "Order Issued", icon: <ClipboardCheck className="h-5 w-5 shrink-0" /> },
    { id: "judgment", label: "Judgment", icon: <Gavel className="h-5 w-5 shrink-0" /> },
    {
      id: "closed",
      label: translate("closedCasePath"),
      icon: <Archive className="h-5 w-5 shrink-0" />,
    },
  ];

  const select = (path: CitizenCasePath) => {
    setCitizenSession({ casePath: path });
    onChange(path);
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/80 bg-surface p-4 sm:p-5 shadow-2xs space-y-3",
        className,
      )}
    >
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {translate("selectCaseType")}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{translate("pickCaseTypeDesc")}</p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {options.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => select(opt.id)}
              aria-pressed={active}
              className={cn(
                "flex min-h-[4.5rem] items-center gap-3 rounded-xl border-2 px-3 py-3 text-left transition-all active:scale-[0.99]",
                active
                  ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                  : "border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {opt.icon}
              </span>
              <span className="text-sm font-bold leading-snug">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
