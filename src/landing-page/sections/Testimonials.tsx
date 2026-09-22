import { CITIZEN_TESTIMONIALS, type LegalTestimonial } from "@/landing-page/constants";

function TestimonialCard({ t }: { t: LegalTestimonial }) {
  const initials = t.name
    .replace(/^Adv\.\s*/, "")
    .replace(/@.*$/, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-white/10 bg-white p-3.5 sm:p-4 lg:p-3.5 text-slate-800 shadow-md shadow-black/20 transition-all duration-300 hover:shadow-xl w-full min-w-0 box-border break-words flex flex-col justify-between">
      {/* Review text on top - more compact on desktop */}
      <p className="text-[11.5px] sm:text-[12px] lg:text-[11px] leading-relaxed text-slate-700 font-sans font-normal">
        &ldquo;{t.quote}&rdquo;
      </p>

      {/* Reviewer info at bottom: Avatar circle + Name */}
      <div className="mt-2.5 flex items-center gap-2 pt-2 border-t border-slate-100">
        <div className="flex h-5 w-5 sm:h-6 sm:w-6 lg:h-5 lg:w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#003272] via-[#024a96] to-[#d4af37] font-bold text-[8px] sm:text-[9px] lg:text-[8px] text-white shadow-xs">
          {initials || "U"}
        </div>
        <span className="text-[10.5px] sm:text-[11px] lg:text-[10.5px] font-semibold text-slate-800 truncate">
          {t.name}
        </span>
      </div>
    </div>
  );
}

export function Testimonials() {
  // Stagger items into two distinct columns of 4 cards each
  const col1 = CITIZEN_TESTIMONIALS.filter((_, i) => i % 2 === 0);
  const col2 = CITIZEN_TESTIMONIALS.filter((_, i) => i % 2 === 1);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0a0d14] via-[#0d1629] to-[#0a152b] py-12 sm:py-16 lg:py-20 text-white border-t border-b border-[#d4af37]/20">
      {/* Background subtle gold and navy ambient radial glows matching CloseUrCase theme */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#003272]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-[#d4af37]/10 blur-3xl" />

      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-10 xl:gap-14 items-center">
          {/* ON MOBILE: TESTIMONIAL WALL AT TOP (order-1), ON DESKTOP ON RIGHT (lg:order-2, narrower & more compact) */}
          <div className="order-1 lg:order-2 lg:col-span-6 xl:col-span-5 lg:ml-auto w-full max-w-md lg:max-w-[460px] mx-auto min-w-0">
            <div className="testimonial-marquee-wrapper relative h-[420px] sm:h-[460px] lg:h-[480px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,black_8%,black_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_8%,black_92%,transparent_100%)] w-full">
              {/* Soft gradient fading overlays at top & bottom matching dark navy background */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-14 sm:h-16 bg-gradient-to-b from-[#0a0d14] via-[#0a0d14]/80 to-transparent z-20" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 sm:h-16 bg-gradient-to-t from-[#0a152b] via-[#0a152b]/80 to-transparent z-20" />

              {/* TWO-COLUMN CONTINUOUS VERTICAL ANIMATED MARQUEE WALL (Opposite Directions) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:gap-3 h-full w-full max-w-full">
                {/* Column 1: Smooth continuous UPWARD stream */}
                <div className="min-w-0 overflow-hidden w-full">
                  <div className="animate-marquee-col1 w-full">
                    <div className="flex flex-col gap-2.5 sm:gap-3 lg:gap-3 pb-2.5 sm:pb-3 lg:pb-3 w-full">
                      {col1.map((t) => (
                        <TestimonialCard key={t.name} t={t} />
                      ))}
                    </div>
                    {/* Seamless duplicate stream */}
                    <div
                      className="flex flex-col gap-2.5 sm:gap-3 lg:gap-3 pb-2.5 sm:pb-3 lg:pb-3 w-full"
                      aria-hidden="true"
                    >
                      {col1.map((t, idx) => (
                        <TestimonialCard key={`c1-dup-${idx}`} t={t} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 2: Smooth continuous DOWNWARD stream (OPPOSITE DIRECTION) */}
                <div className="min-w-0 overflow-hidden w-full">
                  <div className="animate-marquee-col2 w-full">
                    <div className="flex flex-col gap-2.5 sm:gap-3 lg:gap-3 pb-2.5 sm:pb-3 lg:pb-3 w-full">
                      {col2.map((t) => (
                        <TestimonialCard key={t.name} t={t} />
                      ))}
                    </div>
                    {/* Seamless duplicate stream */}
                    <div
                      className="flex flex-col gap-2.5 sm:gap-3 lg:gap-3 pb-2.5 sm:pb-3 lg:pb-3 w-full"
                      aria-hidden="true"
                    >
                      {col2.map((t, idx) => (
                        <TestimonialCard key={`c2-dup-${idx}`} t={t} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-2 lg:order-1 lg:col-span-6 xl:col-span-7 space-y-5 max-w-xl">
            <h2 className="font-serif font-semibold text-3xl sm:text-4xl lg:text-[42px] tracking-tight text-white leading-tight">
              Your success is our priority
            </h2>

            <p className="text-xs sm:text-sm lg:text-[14.5px] leading-relaxed text-slate-300 font-normal">
              &ldquo;We started CloseUrCase because we saw citizens and entrepreneurs being held
              back by overwhelming legal complexity. Our mission is to be the partner you can always
              count on.
            </p>

            <p className="text-xs sm:text-sm lg:text-[14.5px] leading-relaxed text-slate-300 font-normal">
              We combine technology with a network of verified advocates across India to handle
              these complexities for you. Your success is our priority, because when you thrive,
              India thrives&rdquo;
            </p>

            <div className="pt-2 border-t border-white/10">
              <h4 className="font-semibold text-sm sm:text-base text-white tracking-wide">
                Founding Advocates &amp; Leadership
              </h4>
              <p className="text-xs sm:text-sm text-[#d4af37]/90 font-normal">
                Legal Operations, CloseUrCase
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
