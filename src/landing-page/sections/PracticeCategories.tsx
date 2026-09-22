import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/m3";
import { SectionKicker } from "@/landing-page/SectionKicker";
import { goldIconCircle } from "@/landing-page/theme";
import { PRACTICE_CATEGORIES } from "@/landing-page/constants";

export function PracticeCategories() {
  return (
    <section className="border-t border-slate-200/70 bg-[#faf8f4] py-7 sm:py-10">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-6 max-w-xl">
          <SectionKicker label="Practice categories" />
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Explore legal jurisdictions &amp; matter types
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Find the right court, procedure, and Advocate for your specific legal needs.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRACTICE_CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            return (
              <Card
                key={cat.id}
                variant="outlined"
                className="group flex flex-col overflow-hidden !rounded-3xl !border-[#d4af37]/30 !bg-[#fffcf7] shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:!border-[#d4af37]/60 hover:shadow-lg hover:shadow-slate-900/8"
              >
                <div className="h-0.5 w-full bg-gradient-to-r from-[#e8d5a3] via-[#d4af37] to-[#b8942a]" />
                <div className="flex h-44 w-full items-center justify-center bg-white p-4">
                  <img
                    src={cat.image}
                    alt={cat.altText}
                    className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-1 flex-col border-t border-[#d4af37]/15 p-5">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        goldIconCircle,
                      )}
                    >
                      <IconComp className="h-4 w-4" />
                    </span>
                    <h3 className="font-serif text-base font-semibold leading-snug text-slate-900">
                      {cat.title}
                    </h3>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Forum</span>
                      <span className="text-right font-medium text-slate-900">{cat.court}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Key act</span>
                      <span className="text-right font-medium text-slate-900">{cat.act}</span>
                    </div>
                    <p className="mt-2 text-[11px] italic text-slate-500">{cat.remedy}</p>
                  </div>
                  <Link
                    to={cat.link}
                    className="mt-auto inline-flex items-center gap-1.5 border-b border-transparent pt-5 text-xs font-semibold text-slate-900 transition-colors hover:border-[#d4af37]/50 hover:text-[#a9853f]"
                  >
                    File this case type
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
