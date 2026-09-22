import { Scale, ShieldCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionKicker } from "@/landing-page/SectionKicker";
import { ABOUT_HIGHLIGHTS } from "@/landing-page/constants";

export function About() {
  return (
    <section id="about" className="scroll-mt-20 bg-[#faf8f4] py-7 sm:py-10">
      <div className="mx-auto grid max-w-7xl 2xl:max-w-[1440px] grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="relative">
          <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/25 bg-slate-950 p-[3px] shadow-xl shadow-slate-900/10">
            <div className="overflow-hidden rounded-[1.35rem]">
              <img
                src="/real-courtroom.jpg"
                alt="Full view of an Indian High Court court hall with judges and Advocates"
                className="h-72 w-full object-cover sm:h-80"
                loading="lazy"
              />
              <div className="absolute inset-[3px] rounded-[1.35rem] bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-[#d4af37]">
                  <Scale className="h-3.5 w-3.5" />
                  Bar Council compliant
                </p>
                <h3 className="font-serif text-lg font-semibold">
                  Authentic Indian legal jurisdiction
                </h3>
                <p className="mt-1 text-xs text-slate-300">
                  Connecting citizens to verified Advocates across India.
                </p>
              </div>
            </div>
          </div>
          <div className="absolute -bottom-3 left-6 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#d4af37]/30 bg-[#fffcf7] px-3 py-1.5 text-[11px] font-semibold text-[#a9853f] shadow-md shadow-slate-900/10">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Advocates only
          </div>
        </div>

        <div className="space-y-5 pt-4 lg:pt-0">
          <SectionKicker label="About CloseUrCase" />
          <h2 className="font-serif text-2xl font-semibold leading-snug tracking-tight text-slate-900 sm:text-3xl">
            Built for citizens. Backed by real Advocates.
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-slate-600">
            Most citizens facing a legal issue do not know where to start or who to trust.
            CloseUrCase matches your matter directly to a qualified, bar verified Lawyer, and tracks
            every hearing date, document, and update from filing to final court order.
          </p>
          <ul className="space-y-3.5 border-t border-slate-200/80 pt-2">
            {ABOUT_HIGHLIGHTS.map((item, idx) => (
              <li
                key={item}
                className={cn(
                  "flex items-start gap-3 pt-3.5 text-sm text-slate-700",
                  idx !== 0 && "border-t border-slate-200/60",
                )}
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#d4af37]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
