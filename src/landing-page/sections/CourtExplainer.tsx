import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ChevronDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Card } from "@/components/m3";
import { SectionKicker } from "@/landing-page/SectionKicker";
import { goldButtonStyle } from "@/landing-page/theme";
import { INDIAN_COURTS } from "@/landing-page/constants";

export function CourtExplainer() {
  const [openCourtId, setOpenCourtId] = useState<string | null>("district");

  return (
    <section className="bg-[#faf8f4] py-7 sm:py-10">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-xl">
          <SectionKicker label="Indian jurisdiction guide" />
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Which court handles your legal matter?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Explore the hierarchy of courts and specialized forums in India to identify where your
            case belongs.
          </p>
        </div>

        <div className="space-y-3">
          {INDIAN_COURTS.map((court) => {
            const isOpen = openCourtId === court.id;
            const IconComponent = court.icon;

            return (
              <Card
                key={court.id}
                variant={isOpen ? "filled" : "outlined"}
                className={cn(
                  "overflow-hidden !rounded-2xl border transition-all duration-300",
                  isOpen
                    ? "!border-[#d4af37]/70 !bg-gradient-to-b from-white to-[#fffcf7] shadow-md shadow-slate-900/6 ring-1 ring-[#d4af37]/15"
                    : "!border-slate-200/80 !bg-white shadow-sm shadow-slate-900/[0.03] hover:!border-[#d4af37]/35 hover:shadow-md hover:shadow-slate-900/5",
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenCourtId(isOpen ? null : court.id)}
                  className="flex w-full items-center justify-between p-4 text-left sm:p-5"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
                        isOpen
                          ? "bg-gradient-to-br from-[#e8d5a3] via-[#d4af37] to-[#b8942a] text-slate-950 shadow-sm"
                          : "bg-[#d4af37]/10 text-[#a9853f] ring-1 ring-[#d4af37]/15",
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h3 className="font-serif text-base font-semibold text-slate-900 sm:text-lg">
                          {court.title}
                        </h3>
                        <span className="rounded-full bg-[#d4af37]/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[#a9853f]">
                          {court.badge}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-600">{court.subtitle}</p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "ml-4 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-300",
                      isOpen && "rotate-180 text-[#d4af37]",
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-[#d4af37]/15 px-5 py-5 sm:px-6">
                    <div className="mb-4 h-px w-12 bg-gradient-to-r from-[#d4af37] to-transparent" />
                    <h4 className="mb-3 text-xs font-semibold tracking-wide text-slate-900">
                      Common legal matters handled
                    </h4>
                    <div className="mb-5 grid gap-2.5 sm:grid-cols-2">
                      {court.matters.map((matter) => (
                        <div
                          key={matter}
                          className="flex items-start gap-2 text-xs text-slate-700 sm:text-sm"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" />
                          <span>{matter}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
