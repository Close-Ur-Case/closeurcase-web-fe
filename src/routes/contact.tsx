import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  Building2,
  ShieldCheck,
  UserCheck,
  Scale,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { TextField, Select, Button } from "@/components/m3";
import { supportService } from "@/services/supportService";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — CloseUrCase Legal Platform" },
      {
        name: "description",
        content:
          "Get in touch with CloseUrCase support for inquiries, lawyer registration help, and technical assistance.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "general",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await supportService.submitInquiry(formData);
      setSubmitted(true);
    } catch (err: unknown) {
      console.error("Failed to submit inquiry:", err);
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit inquiry. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {/* Hero Header */}
      <section className="border-b border-border bg-surface/60 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>We're Here to Help</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Get in Touch with CloseUrCase
          </h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Have a question about filing a case, Lawyer verification, or platform features? Send us
            a message and our team will get back to you promptly.
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Contact Information & Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground">Contact Information</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Reach out directly via email, phone, or submit the contact form.
              </p>
            </div>

            <div className="space-y-4">
              {/* Card 1: Support Email */}
              <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-primary/40 transition-all">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email Us
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    support@CloseUrCase.com
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    For general support & onboarding assistance
                  </p>
                </div>
              </div>

              {/* Card 2: Helpline */}
              <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-primary/40 transition-all">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Call Support
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    +1 (800) 555-CASE (2273)
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Monday – Friday, 9:00 AM – 6:00 PM EST
                  </p>
                </div>
              </div>

              {/* Card 3: Office Headquarters */}
              <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4 shadow-xs hover:border-primary/40 transition-all">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--md-extended-color-lawyer) 10%, transparent)",
                    color: "var(--md-extended-color-lawyer)",
                  }}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Headquarters
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Legal Tech Plaza, Suite 400
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Washington, D.C., 20001</p>
                </div>
              </div>

              {/* Card 4: Response Guarantee */}
              <div className="rounded-xl border border-success/20 bg-success/5 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-success shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-success">Quick Response Time</div>
                    <div className="text-[11px] text-success/80">
                      Average response within 2–4 business hours
                    </div>
                  </div>
                </div>
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                  Fast
                </span>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="rounded-xl border border-border bg-background p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>Need Immediate Answers?</span>
              </h4>
              <p className="text-xs text-muted-foreground">
                Check our platform overview or role signup options:
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Link
                  to="/about"
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <span>About Platform</span>
                  <span className="text-[10px]">→</span>
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <span>Citizen Sign Up</span>
                  <span className="text-[10px]">→</span>
                </Link>
                <Link
                  to="/lawyer-register"
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                >
                  <span>Lawyer Signup</span>
                  <span className="text-[10px]">→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary mb-2">
                <MessageSquare className="h-4 w-4" />
                <span>Send a Direct Message</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">How Can We Help You?</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Fill out the form below and a representative will respond shortly.
              </p>

              {submitted ? (
                <div className="mt-8 rounded-xl border border-success/30 bg-success/10 p-8 text-center space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-white shadow-md">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Thank You for Reaching Out!</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Your message has been successfully logged. Our legal support coordinator will
                    review your inquiry and get back to you at{" "}
                    <span className="font-semibold text-foreground">
                      {formData.email || "your email"}
                    </span>
                    .
                  </p>
                  <Button
                    variant="filled"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        category: "general",
                        subject: "",
                        message: "",
                      });
                    }}
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <TextField
                      label="Your Full Name"
                      type="text"
                      required
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(v) => setFormData({ ...formData, name: v })}
                      className="w-full"
                    />

                    <TextField
                      label="Email Address"
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(v) => setFormData({ ...formData, email: v })}
                      className="w-full"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Inquiry Category"
                      value={formData.category}
                      onChange={(v) => setFormData({ ...formData, category: v })}
                      className="w-full"
                      options={[
                        { value: "general", label: "General Platform Inquiry" },
                        { value: "citizen", label: "Citizen Case Filing Support" },
                        { value: "lawyer", label: "Lawyer Verification & Onboarding" },
                        { value: "technical", label: "Technical Bug / Issue" },
                        { value: "partnership", label: "Legal Partnership / Enterprise" },
                      ]}
                    />

                    <TextField
                      label="Subject"
                      type="text"
                      required
                      placeholder="Brief summary of your inquiry"
                      value={formData.subject}
                      onChange={(v) => setFormData({ ...formData, subject: v })}
                      className="w-full"
                    />
                  </div>

                  <TextField
                    label="Message"
                    type="textarea"
                    rows={5}
                    required
                    placeholder="Please provide details about your request or inquiry..."
                    value={formData.message}
                    onChange={(v) => setFormData({ ...formData, message: v })}
                    className="w-full"
                  />

                  {submitError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                      {submitError}
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      We respect your privacy. Information is confidential.
                    </p>
                    <Button
                      type="submit"
                      variant="filled"
                      disabled={isSubmitting}
                      icon={isSubmitting ? undefined : <Send className="h-3.5 w-3.5" />}
                      trailingIcon={!isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
