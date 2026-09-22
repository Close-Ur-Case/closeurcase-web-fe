import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionKicker } from "@/landing-page/SectionKicker";
import { LAWYER_PRACTICE_AREAS } from "@/components/app/lawyerPracticeAreas";

/** Compact three-step chip drill-down over the "Find a Lawyer" mega-menu
 * taxonomy: pick a practice area -> pick a specialization -> pick the legal
 * service. The final chip is the same `/citizen-login` link (with the same
 * `area / specialization / service` search params) the header dropdown uses. */

const AREAS = LAWYER_PRACTICE_AREAS;

const CHIP = "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150";
const CHIP_ON =
  "border-transparent bg-gradient-to-br from-[#e8d5a3] via-[#d4af37] to-[#b8942a] text-slate-950 shadow-sm shadow-[#d4af37]/25";
const CHIP_OFF =
  "border-[#d4af37]/30 bg-white text-slate-600 hover:border-[#d4af37]/60 hover:text-[#a9853f]";

function StepLabel({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a9853f]">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#d4af37]/15 text-[9px] tabular-nums">
        {n}
      </span>
      {text}
    </div>
  );
}

export function LegalServicesExplorer() {
  const [areaName, setAreaName] = useState(AREAS[0].category);
  const [specName, setSpecName] = useState<string | null>(null);

  const area = AREAS.find((a) => a.category === areaName) ?? AREAS[0];
  const spec = area.case_types.find((s) => s.case_type === specName) ?? null;

  return (
    <section className="border-t border-slate-200/70 bg-[#faf8f4] py-7 sm:py-10">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5">
          <SectionKicker label="Practice areas" />
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Find your legal matter
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Pick an area, narrow it down, and the last chip takes you straight to filing.
          </p>
        </div>

        <div className="rounded-2xl border border-[#d4af37]/25 bg-[#fffcf7] p-4 shadow-sm shadow-slate-900/5 sm:p-5">
          {/* Step 1 — practice area */}
          <StepLabel n={1} text="Practice area" />
          <div className="mt-2 flex flex-wrap gap-2">
            {AREAS.map((a) => (
              <button
                key={a.category}
                type="button"
                onClick={() => {
                  setAreaName(a.category);
                  setSpecName(null);
                }}
                className={cn(CHIP, a.category === areaName ? CHIP_ON : CHIP_OFF)}
              >
                {a.category}
              </button>
            ))}
          </div>

          {/* Step 2 — specialisation */}
          <div className="mt-3 border-t border-slate-200/60 pt-3">
            <StepLabel n={2} text="Specialisation" />
            <div className="mt-2 flex flex-wrap gap-2">
              {area.case_types.map((s) => (
                <button
                  key={s.case_type}
                  type="button"
                  onClick={() => setSpecName(s.case_type === specName ? null : s.case_type)}
                  className={cn(CHIP, s.case_type === specName ? CHIP_ON : CHIP_OFF)}
                >
                  {s.case_type}
                </button>
              ))}
            </div>
          </div>

          {/* Step 3 — the service (links into filing) */}
          {spec && (
            <div className="mt-3 animate-in fade-in slide-in-from-top-1 border-t border-slate-200/60 pt-3 duration-200">
              <StepLabel n={3} text="What you need" />
              <div className="mt-2 flex flex-wrap gap-2">
                {spec.legal_services.map((service) => (
                  <Link
                    key={service}
                    to="/citizen-login"
                    search={{ area: area.category, specialization: spec.case_type, service }}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/30 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-[#d4af37]/70 hover:text-[#a9853f] hover:shadow-sm hover:shadow-[#d4af37]/20"
                  >
                    {service}
                    <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Not sure which fits?{" "}
          <Link
            to="/citizen-login"
            className="font-semibold text-[#a9853f] transition-colors hover:text-[#8a6d2f] hover:underline"
          >
            Describe your matter instead →
          </Link>
        </p>
      </div>
    </section>
  );
}
