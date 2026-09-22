const RECOGNITION_MARKS = [
  "Bar Council of India",
  "District & Sessions Courts",
  "High Courts of India",
  "Consumer Commissions",
  "NCLT & DRT",
  "Lok Adalat",
];

export function RecognitionStrip() {
  return (
    <section className="border-b border-slate-200/60 bg-[#faf8f4]">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          Recognised across Indian courts &amp; forums
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {RECOGNITION_MARKS.map((mark) => (
            <span
              key={mark}
              className="text-xs font-semibold uppercase tracking-wider text-slate-400 sm:text-sm"
            >
              {mark}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
