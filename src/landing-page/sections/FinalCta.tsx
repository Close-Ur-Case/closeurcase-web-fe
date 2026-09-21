import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowUpRight, CheckCircle2, MessageSquareText, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { MailLink } from "@/components/app/MailLink";
import { supportService } from "@/services/supportService";

const FEEDBACK_TYPES = [
  "General Feedback",
  "Feature Request",
  "Bug Report",
  "Advocate Experience",
  "UX / Design",
];

const SATISFACTION_LEVELS = [
  { label: "Needs Improvement", value: "poor" },
  { label: "Good", value: "good" },
  { label: "Very Good", value: "very_good" },
  { label: "Excellent", value: "excellent" },
  { label: "Loved it! ✦", value: "loved" },
];

export function FinalCta() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userRole, setUserRole] = useState("");
  const [feedbackCategory, setFeedbackCategory] = useState(FEEDBACK_TYPES[0]);
  const [satisfaction, setSatisfaction] = useState("loved");
  const [feedbackDetails, setFeedbackDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await supportService.submitInquiry({
        name: fullName,
        email,
        phone,
        category: "feedback",
        subject: `App Feedback: ${feedbackCategory} (${satisfaction}) - ${userRole || "Visitor"}`,
        message: `${feedbackDetails}\n\nRole: ${userRole || "Not specified"}\nSatisfaction: ${satisfaction}`,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      console.error("Failed to submit feedback:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit feedback. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setSubmitted(false);
    setFullName("");
    setEmail("");
    setPhone("");
    setUserRole("");
    setFeedbackCategory(FEEDBACK_TYPES[0]);
    setSatisfaction("loved");
    setFeedbackDetails("");
  }

  return (
    <section id="contact" className="scroll-mt-20 bg-[#faf8f4] py-6 sm:py-8">
      {/* Same width as other landing page sections: max-w-7xl 2xl:max-w-[1440px] */}
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#d4af37]/25 bg-white p-6 sm:p-8 lg:p-10 shadow-lg shadow-slate-900/5">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14 items-center">
            {/* LEFT COLUMN: Editorial Heading, Direct Email Badge & Improved Vector Illustration */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-6">
              <div className="space-y-3">
                <h2 className="font-serif font-semibold text-2xl sm:text-3xl lg:text-[36px] tracking-tight text-slate-900 leading-tight">
                  Help Us Shape <br />
                  CloseUrCase.
                </h2>
                <p className="max-w-sm text-xs sm:text-sm leading-relaxed text-slate-600 font-normal">
                  Tell us what you love, what feels clunky, or what we should build next. Your
                  feedback directly shapes our roadmap for citizens and advocates.
                </p>

                {/* Single direct email on the card so user can mail directly if preferred */}
                <div className="pt-1">
                  <MailLink
                    email="feedback@closeurcase.com"
                    className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-[#a9853f] transition-colors group"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#d4af37]/12 text-[#a9853f] group-hover:bg-[#d4af37]/20 transition-colors">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <span>
                      Prefer email? Write directly to{" "}
                      <strong className="font-semibold text-slate-800 group-hover:text-[#a9853f]">
                        feedback@closeurcase.com
                      </strong>
                    </span>
                  </MailLink>
                </div>
              </div>

              {/* High-Fidelity Editorial Line Art Illustration */}
              <div className="relative pt-2 hidden sm:flex justify-center lg:justify-start">
                <img
                  src="/feedback-illustration.jpg"
                  alt="Launching feedback into flight"
                  className="w-full max-w-[280px] lg:max-w-[320px] object-contain mix-blend-multiply select-none pointer-events-none"
                  loading="lazy"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: Compact Minimalist Form Container */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-[#fbfaf6] p-5 sm:p-7 border border-[#d4af37]/20 shadow-xs">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#d4af37]/15 text-[#a9853f] mb-3">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-slate-900">
                      Thank you for your feedback!
                    </h3>
                    <p className="mt-1.5 max-w-sm text-xs text-slate-600 leading-relaxed">
                      Your response has been logged directly into our product system. We review
                      every single note to make CloseUrCase better.
                    </p>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 cursor-pointer"
                    >
                      Submit another note
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Row 1: Full Name */}
                    <div>
                      <label
                        htmlFor="feedback-name"
                        className="block text-[11px] font-medium text-slate-500 italic tracking-wide mb-0.5"
                      >
                        Full name*
                      </label>
                      <input
                        id="feedback-name"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Tilak Varma"
                        className="w-full bg-transparent border-b border-slate-200 py-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none transition-colors"
                      />
                    </div>

                    {/* Row 2: Email & Phone Number (Two Columns) */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="feedback-email"
                          className="block text-[11px] font-medium text-slate-500 italic tracking-wide mb-0.5"
                        >
                          Email*
                        </label>
                        <input
                          id="feedback-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full bg-transparent border-b border-slate-200 py-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="feedback-phone"
                          className="block text-[11px] font-medium text-slate-500 italic tracking-wide mb-0.5"
                        >
                          Phone number
                        </label>
                        <input
                          id="feedback-phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full bg-transparent border-b border-slate-200 py-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Row 3: Role & Feedback Topic (Two Columns) */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="feedback-role"
                          className="block text-[11px] font-medium text-slate-500 italic tracking-wide mb-0.5"
                        >
                          I use CloseUrCase as
                        </label>
                        <input
                          id="feedback-role"
                          type="text"
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value)}
                          placeholder="Citizen / Advocate / Student"
                          className="w-full bg-transparent border-b border-slate-200 py-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="feedback-category"
                          className="block text-[11px] font-medium text-slate-500 italic tracking-wide mb-0.5"
                        >
                          Feedback Topic*
                        </label>
                        <div className="relative">
                          <select
                            id="feedback-category"
                            value={feedbackCategory}
                            onChange={(e) => setFeedbackCategory(e.target.value)}
                            className="w-full appearance-none bg-transparent border-b border-slate-200 py-1 text-xs sm:text-sm text-slate-900 focus:border-[#d4af37] focus:outline-none transition-colors pr-5 cursor-pointer"
                          >
                            {FEEDBACK_TYPES.map((type) => (
                              <option key={type} value={type}>
                                {type}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-1 bottom-1 text-[11px] text-slate-400">
                            ↓
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row 4: App Experience Satisfaction Chips */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 italic tracking-wide mb-1.5">
                        How is your experience with the app?*
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {SATISFACTION_LEVELS.map((lvl) => {
                          const isSelected = satisfaction === lvl.value;
                          return (
                            <button
                              key={lvl.value}
                              type="button"
                              onClick={() => setSatisfaction(lvl.value)}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all cursor-pointer",
                                isSelected
                                  ? "border-transparent bg-gradient-to-br from-[#e8d5a3] via-[#d4af37] to-[#b8942a] text-slate-950 font-semibold shadow-xs"
                                  : "border-[#d4af37]/30 bg-white text-slate-700 hover:border-[#d4af37] hover:bg-[#fffcf7]",
                              )}
                            >
                              {lvl.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Row 5: Detailed Feedback Textarea */}
                    <div>
                      <label
                        htmlFor="feedback-details"
                        className="block text-[11px] font-medium text-slate-500 italic tracking-wide mb-0.5"
                      >
                        Feedback &amp; Suggestions*
                      </label>
                      <textarea
                        id="feedback-details"
                        required
                        rows={2}
                        value={feedbackDetails}
                        onChange={(e) => setFeedbackDetails(e.target.value)}
                        placeholder="Tell us what worked well or what we can improve..."
                        className="w-full bg-transparent border-b border-slate-200 py-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d4af37] focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    {submitError && (
                      <p className="text-xs text-red-600 font-medium">{submitError}</p>
                    )}

                    {/* Row 6: Submit Button with CloseUrCase Metallic Gold Styling */}
                    <div className="pt-1">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-[#e8d5a3] via-[#d4af37] to-[#b8942a] px-5 py-2 text-xs font-bold text-slate-950 shadow-md shadow-[#d4af37]/25 transition-all hover:from-[#f0e0b0] hover:to-[#c9a84c] active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <span>{isSubmitting ? "Sending..." : "Send App Feedback"}</span>
                        {!isSubmitting && (
                          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} />
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
