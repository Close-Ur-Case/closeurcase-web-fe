/** Small gold eyebrow label ("— ABOUT CLOSEURCASE") used above nearly every
 * landing-page section heading. */
export function SectionKicker({ label }: { label: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      <span className="h-px w-8 bg-gradient-to-r from-[#d4af37] to-[#d4af37]/40" />
      <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-[#a9853f]">
        {label}
      </span>
    </div>
  );
}
