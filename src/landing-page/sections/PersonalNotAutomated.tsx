import { ShieldCheck, Users, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionKicker } from "@/landing-page/SectionKicker";
import { goldIconCircle } from "@/landing-page/theme";

const ROWS = [
  {
    icon: ShieldCheck,
    title: "Bar verified qualifications",
    desc: "Every Lawyer is verified by the Bar Council before accepting a case.",
  },
  {
    icon: Users,
    title: "Complete Advocate transparency",
    desc: "You always know who is representing you — name, registration, and specialisation.",
  },
  {
    icon: Activity,
    title: "Real time case logging",
    desc: "Hearing dates and status updates are logged in real time, not communicated by hand.",
  },
];

export function PersonalNotAutomated() {
  return (
    <section className="border-t border-slate-200/70 bg-[#faf8f4] py-7 sm:py-10">
      <div className="mx-auto grid max-w-7xl 2xl:max-w-[1440px] grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8">
        <div className="space-y-6">
          <div>
            <SectionKicker label="Personal, not automated" />
            <h2 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-3xl">
              Your case, in the hands of a qualified Lawyer
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
              Technology helps us find the right match quickly, but once your matter is assigned, a
              licensed Lawyer carries it forward — with verified registration, clear accountability,
              and no anonymous intermediaries.
            </p>
          </div>

          <div className="divide-y divide-slate-200/70 border-t border-slate-200/70">
            {ROWS.map((row) => (
              <div key={row.title} className="flex items-start gap-4 py-4">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    goldIconCircle,
                  )}
                >
                  <row.icon className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{row.title}</h4>
                  <p className="mt-0.5 text-xs text-slate-600">{row.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#d4af37]/20 p-[3px] shadow-xl shadow-slate-900/10">
          <div className="overflow-hidden rounded-[1.35rem]">
            <img
              src="/real-consultation.jpg"
              alt="Senior Indian Advocate conducting legal consultation in office"
              className="h-80 w-full object-cover sm:h-96"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
