import { cn } from "@/lib/utils";
import { SectionKicker } from "@/landing-page/SectionKicker";
import { goldIconCircle } from "@/landing-page/theme";
import { STEPS } from "@/landing-page/constants";

export function HowItWorks() {
  return (
    <section className="border-t border-slate-200/70 bg-[#faf8f4] py-7 sm:py-10">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="mb-7 max-w-xl">
          <SectionKicker label="How it works" />
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            From your first message to final order
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Four steps, logged, tracked, and visible to you throughout.
          </p>
        </div>

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-[2.75rem] hidden h-px bg-gradient-to-r from-transparent via-[#d4af37]/40 to-transparent lg:block"
          />
          {STEPS.map((step) => (
            <div
              key={step.title}
              className="relative rounded-3xl border border-slate-200/80 bg-[#fffcf7] p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:border-[#d4af37]/30 hover:shadow-md hover:shadow-slate-900/6"
            >
              <span className="absolute right-5 top-5 font-serif text-3xl font-semibold text-slate-100">
                0{step.step}
              </span>
              <div
                className={cn(
                  "relative z-10 flex h-11 w-11 items-center justify-center rounded-full ring-4 ring-[#faf8f4]",
                  goldIconCircle,
                )}
              >
                <step.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-4 font-serif text-base font-semibold text-slate-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
