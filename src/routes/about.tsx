import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Scale,
  UserCheck,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  BookOpen,
  MapPin,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  HelpCircle,
  Clock,
  Briefcase,
  Layers,
  MessageSquare,
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Card } from "@/components/m3";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Platform & How It Works — CloseUrCase" },
      {
        name: "description",
        content:
          "Discover how CloseUrCase connects citizens, Lawyers, and admins with AI-powered legal workflows.",
      },
    ],
  }),
  component: AboutPage,
});

type RoleKey = "citizen" | "lawyer" | "admin";

function AboutPage() {
  const [activeRole, setActiveRole] = useState<RoleKey>("citizen");
  const [activeStep, setActiveStep] = useState<number>(1);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const steps = [
    {
      step: 1,
      title: "Case Filing & AI Assessment",
      subtitle: "Plain language intake & smart prediction",
      icon: Sparkles,
      color:
        "text-[var(--md-extended-color-warning)] bg-[var(--md-extended-color-warning)]/10 border-[var(--md-extended-color-warning)]/30",
      activeColor:
        "bg-[var(--md-extended-color-warning)] text-[var(--md-extended-color-on-warning)]",
      description:
        "Citizens describe their legal dispute in everyday language. The AI assessment model parses the situation, identifies statutory categories (e.g. Civil, Criminal, Property, Family Law), calculates confidence scores, and structures the case draft.",
      details: [
        "Natural language input processing",
        "Statutory category confidence scoring",
        "Automated case summary structuring",
        "Initial legal urgency assessment",
      ],
    },
    {
      step: 2,
      title: "Geo-Location & Lawyer Matching",
      subtitle: "Proximity & practice area pairing",
      icon: MapPin,
      color:
        "text-[var(--md-extended-color-citizen)] bg-[var(--md-extended-color-citizen)]/10 border-[var(--md-extended-color-citizen)]/30",
      activeColor:
        "bg-[var(--md-extended-color-citizen)] text-[var(--md-extended-color-on-citizen)]",
      description:
        "Using GPS or manual region selection, the platform matches the case with nearby verified Lawyers specializing in the predicted legal domain, ensuring swift local legal representation.",
      details: [
        "GPS & manual location filtering",
        "Specialization-based Lawyer matching",
        "Verified bar registration check",
        "Auto-assignment or direct lawyer selection",
      ],
    },
    {
      step: 3,
      title: "AI Legal Research & Case Strategy",
      subtitle: "Indexed statutory acts & argument drafting",
      icon: BookOpen,
      color:
        "text-[var(--md-extended-color-lawyer)] bg-[var(--md-extended-color-lawyer)]/10 border-[var(--md-extended-color-lawyer)]/30",
      activeColor: "bg-[var(--md-extended-color-lawyer)] text-[var(--md-extended-color-on-lawyer)]",
      description:
        "Lawyers receive assigned cases with full context. Using the Super Admin indexed Legal Knowledge Base, lawyers can generate draft arguments, search statutory acts/sections, and refine case filings.",
      details: [
        "Indexed statutory acts & sections search",
        "AI arguments & grounds generator",
        "Document repository & exhibit attachments",
        "Case timeline & status update logs",
      ],
    },
    {
      step: 4,
      title: "Transparent Tracking & Resolution",
      subtitle: "Real-time milestones to case closure",
      icon: CheckCircle2,
      color: "text-[var(--md-chart-7)] bg-[var(--md-chart-7)]/10 border-[var(--md-chart-7)]/30",
      activeColor: "bg-[var(--md-chart-7)] text-white",
      description:
        "Citizens stay informed through live milestone updates. Super Administrators monitor overall platform health, audit log integrity, and handle any procedural overrides until final case disposition.",
      details: [
        "Real-time milestone progress bar",
        "Instant notification updates",
        "Super Admin compliance overview",
        "Structured digital case closure audit",
      ],
    },
  ];

  const faqs = [
    {
      question: "What is CloseUrCase and who is it designed for?",
      answer:
        "CloseUrCase is an integrated legal workflow management platform connecting three key stakeholders: Citizens seeking structured dispute resolution, Licensed Lawyers managing cases with AI research support, and Super Administrators overseeing compliance and platform knowledge bases.",
    },
    {
      question: "Is AI output on CloseUrCase legally binding or a replacement for a lawyer?",
      answer:
        "No. AI tools within CloseUrCase (such as statutory category prediction and argument drafting) are assistant utilities engineered to streamline research and case preparation for qualified Lawyers. All legal strategy and representation remain strictly with licensed attorneys.",
    },
    {
      question: "How are Lawyers verified on the platform?",
      answer:
        "Lawyers must submit their Bar Registration ID, practice categories, and office location during signup. Super Administrators verify these details before approving the account to accept client cases.",
    },
    {
      question: "How does the AI Category Prediction engine work?",
      answer:
        "When a citizen enters a case description in plain English or local language context, the prediction engine analyzes key facts, actions, and statutory keywords to suggest the matching legal classification along with confidence percentages.",
    },
    {
      question: "How does location matching connect citizens with nearby Lawyers?",
      answer:
        "Citizens can allow browser GPS location access or manually pick their district/state. The platform filters active, approved lawyers in that jurisdiction who specialize in the case's category.",
    },
    {
      question: "Is this platform live or a demonstration system?",
      answer:
        "This instance is a functional demonstration prototype designed to showcase complete multi-role legal workflows, AI research integrations, and case tracking end-to-end.",
    },
  ];

  return (
    <PublicLayout>
      {/* Hero Header */}
      <section className="border-b border-border bg-surface/60 py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Platform Overview & Architecture</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Empowering Transparent Legal Resolution
          </h1>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            CloseUrCase bridges the gap between citizens facing legal challenges and legal
            professionals. Discover how our AI-assisted workflows bring clarity, speed, and
            statutory precision to every step.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 font-medium text-foreground">
              <Zap className="h-4 w-4 text-warning" />
              <span>AI Category Prediction</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 font-medium text-foreground">
              <MapPin className="h-4 w-4 text-[var(--md-extended-color-citizen)]" />
              <span>Geo-Proximity Lawyer Matching</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 font-medium text-foreground">
              <BookOpen className="h-4 w-4 text-[var(--md-extended-color-lawyer)]" />
              <span>Indexed Legal Knowledge Base</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 font-medium text-foreground">
              <ShieldCheck className="h-4 w-4 text-[var(--md-extended-color-admin)]" />
              <span>Admin Verification & Audit</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Role Showcase */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Role-Based Ecosystem
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tailored Experiences for Every Stakeholder
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Click a role below to explore how CloseUrCase serves citizens, Lawyers, and
            administrators.
          </p>
        </div>

        {/* Role Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-col sm:flex-row rounded-xl border border-border bg-surface p-1.5 shadow-xs gap-1 sm:gap-0">
            <button
              onClick={() => setActiveRole("citizen")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
                activeRole === "citizen"
                  ? "shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              style={
                activeRole === "citizen"
                  ? {
                      backgroundColor: "var(--md-extended-color-citizen)",
                      color: "var(--md-extended-color-on-citizen)",
                    }
                  : undefined
              }
            >
              <UserCheck className="h-4 w-4" />
              <span>Citizen / User</span>
            </button>
            <button
              onClick={() => setActiveRole("lawyer")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
                activeRole === "lawyer"
                  ? "shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              style={
                activeRole === "lawyer"
                  ? {
                      backgroundColor: "var(--md-extended-color-lawyer)",
                      color: "var(--md-extended-color-on-lawyer)",
                    }
                  : undefined
              }
            >
              <Scale className="h-4 w-4" />
              <span>Lawyer / Lawyer</span>
            </button>
            <button
              onClick={() => setActiveRole("admin")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-all ${
                activeRole === "admin"
                  ? "shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              style={
                activeRole === "admin"
                  ? {
                      backgroundColor: "var(--md-extended-color-admin)",
                      color: "var(--md-extended-color-on-admin)",
                    }
                  : undefined
              }
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Super Administrator</span>
            </button>
          </div>
        </div>

        {/* Role Detail Panels */}
        <div className="rounded-2xl border border-border bg-surface p-6 md:p-10 shadow-sm transition-all">
          {activeRole === "citizen" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--md-extended-color-citizen) 10%, transparent)",
                    color: "var(--md-extended-color-citizen)",
                  }}
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Citizen Portal Capabilities</span>
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Effortless Intake & Real-time Progress Tracking
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For individuals navigating legal matters, CloseUrCase removes confusion. Simply
                  state your issue, receive instant category guidance, select an Lawyer near you,
                  and follow every hearing milestone online.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--md-extended-color-citizen)]" />
                      <span>Smart Intake</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      AI predicts legal domain and required documentation.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-[var(--md-extended-color-citizen)]" />
                      <span>Geo Lawyer Search</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Find certified lawyers in your district via GPS.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-[var(--md-extended-color-citizen)]" />
                      <span>Milestone Timeline</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Track hearing dates, filings, and case updates.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-[var(--md-extended-color-citizen)]" />
                      <span>Digital Vault</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Securely store case documents & identity files.
                    </p>
                  </div>
                </div>

                <div className="pt-3">
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold shadow-xs transition-all hover:opacity-90"
                    style={{
                      backgroundColor: "var(--md-extended-color-citizen)",
                      color: "var(--md-extended-color-on-citizen)",
                    }}
                  >
                    <span>Sign Up as Citizen</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div
                className="lg:col-span-5 rounded-xl border p-5 space-y-3"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--md-extended-color-citizen) 20%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--md-extended-color-citizen) 5%, transparent)",
                }}
              >
                <div
                  className="flex items-center justify-between text-xs font-bold"
                  style={{ color: "var(--md-extended-color-citizen)" }}
                >
                  <span>LIVE DEMO PREVIEW</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--md-extended-color-citizen) 20%, transparent)",
                    }}
                  >
                    Citizen View
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs space-y-2">
                  <div className="text-muted-foreground text-[11px]">Case Description</div>
                  <div className="p-2 rounded bg-muted/60 text-foreground font-medium text-[11px]">
                    "Landlord refused to return my security deposit after lease completion..."
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: "var(--md-extended-color-citizen)" }}
                    >
                      Predicted Category: Property & Rent Act
                    </span>
                    <span className="text-[10px] text-muted-foreground">94% Confidence</span>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground text-[11px]">Matched Lawyer</div>
                    <div className="text-[10px] text-muted-foreground">
                      Adv. Rajesh Sharma — Property Specialist (2.4 km away)
                    </div>
                  </div>
                  <span
                    className="rounded-md px-2 py-1 text-[10px] font-bold"
                    style={{
                      backgroundColor: "var(--md-extended-color-citizen)",
                      color: "var(--md-extended-color-on-citizen)",
                    }}
                  >
                    Assigned
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeRole === "lawyer" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--md-extended-color-lawyer) 10%, transparent)",
                    color: "var(--md-extended-color-lawyer)",
                  }}
                >
                  <Scale className="h-4 w-4" />
                  <span>Lawyer Workspace Capabilities</span>
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  AI-Powered Legal Research & Case Workspace
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Lawyers gain a modern digital chamber. Manage assigned clients, utilize statutory
                  search across indexed Acts & Sections, generate legal arguments, and update case
                  statuses effortlessly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-[var(--md-extended-color-lawyer)]" />
                      <span>Statutory Search</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Search indexed acts, provisions, and citations.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[var(--md-extended-color-lawyer)]" />
                      <span>Arguments Generator</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Produce structured legal grounds for pleadings.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-[var(--md-extended-color-lawyer)]" />
                      <span>Case Management</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Track client files, hearings, and evidence.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--md-extended-color-lawyer)]" />
                      <span>Verified Profile</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Showcase bar credentials & client ratings.
                    </p>
                  </div>
                </div>

                <div className="pt-3">
                  <Link
                    to="/lawyer-register"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold shadow-xs transition-all hover:opacity-90"
                    style={{
                      backgroundColor: "var(--md-extended-color-lawyer)",
                      color: "var(--md-extended-color-on-lawyer)",
                    }}
                  >
                    <span>Register as Lawyer</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div
                className="lg:col-span-5 rounded-xl border p-5 space-y-3"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--md-extended-color-lawyer) 20%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--md-extended-color-lawyer) 5%, transparent)",
                }}
              >
                <div
                  className="flex items-center justify-between text-xs font-bold"
                  style={{ color: "var(--md-extended-color-lawyer)" }}
                >
                  <span>LIVE DEMO PREVIEW</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--md-extended-color-lawyer) 20%, transparent)",
                    }}
                  >
                    Lawyer View
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-[11px]">
                      AI Legal Assistant
                    </span>
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: "var(--md-extended-color-lawyer)" }}
                    >
                      KB Indexed
                    </span>
                  </div>
                  <div className="p-2 rounded bg-muted/60 text-muted-foreground text-[10px] space-y-1">
                    <div className="font-semibold text-foreground">Relevant Provision:</div>
                    <div>
                      Section 106, Transfer of Property Act — Notice of termination of lease.
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    Case Status Updater
                  </span>
                  <span
                    className="rounded px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: "var(--md-extended-color-lawyer-container)",
                      color: "var(--md-extended-color-on-lawyer-container)",
                    }}
                  >
                    Drafting Pleadings
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeRole === "admin" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div
                  className="inline-flex items-center gap-2 rounded-md px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--md-extended-color-admin) 10%, transparent)",
                    color: "var(--md-extended-color-admin)",
                  }}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Super Admin Capabilities</span>
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  Platform Governance & Knowledge Base Indexing
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Super Administrators hold full platform oversight. Upload statutory acts, index
                  legal documentation for AI search, verify lawyer credentials, and manage case
                  resolution integrity.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5 text-[var(--md-extended-color-admin)]" />
                      <span>Knowledge Base Upload</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Index new statutory acts, sections & amendments.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-[var(--md-extended-color-admin)]" />
                      <span>Lawyer Verification</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Review bar IDs & approve practitioner profiles.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-[var(--md-extended-color-admin)]" />
                      <span>Case Record Override</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Reassign Lawyers or update stuck case records.
                    </p>
                  </div>
                  <div className="rounded-lg border border-border bg-background p-3.5">
                    <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-[var(--md-extended-color-admin)]" />
                      <span>Platform Analytics</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Monitor resolution times & intake volume.
                    </p>
                  </div>
                </div>

                <div className="pt-3">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold shadow-xs transition-all hover:opacity-90"
                    style={{
                      backgroundColor: "var(--md-extended-color-admin)",
                      color: "var(--md-extended-color-on-admin)",
                    }}
                  >
                    <span>Super Admin Login</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              <div
                className="lg:col-span-5 rounded-xl border p-5 space-y-3"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--md-extended-color-admin) 20%, transparent)",
                  backgroundColor:
                    "color-mix(in srgb, var(--md-extended-color-admin) 5%, transparent)",
                }}
              >
                <div
                  className="flex items-center justify-between text-xs font-bold"
                  style={{ color: "var(--md-extended-color-admin)" }}
                >
                  <span>LIVE DEMO PREVIEW</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px]"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--md-extended-color-admin) 20%, transparent)",
                    }}
                  >
                    Admin View
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground text-[11px]">
                      Knowledge Base Status
                    </span>
                    <span className="text-[10px] text-success font-semibold">
                      1,420 Sections Indexed
                    </span>
                  </div>
                  <div className="p-2 rounded bg-muted/60 text-[10px] text-muted-foreground">
                    Latest file:{" "}
                    <span className="font-medium text-foreground">
                      Consumer_Protection_Act_2019.pdf
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-xs flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-foreground">
                    Pending Lawyer Verification
                  </span>
                  <span
                    className="rounded px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      backgroundColor: "var(--md-extended-color-warning-container)",
                      color: "var(--md-extended-color-on-warning-container)",
                    }}
                  >
                    2 Approvals Required
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Interactive 4-Step Workflow Timeline */}
      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">
              Interactive Journey
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              How CloseUrCase Works Step-by-Step
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Click on any step below to explore what happens at each stage of case resolution.
            </p>
          </div>

          {/* Stepper Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {steps.map((s) => {
              const IconComponent = s.icon;
              const isSelected = activeStep === s.step;
              return (
                <Card
                  key={s.step}
                  variant="outlined"
                  onClick={() => setActiveStep(s.step)}
                  className={`text-left p-4 flex flex-col justify-between ${
                    isSelected
                      ? "border-primary! bg-primary/5 shadow-sm ring-1 ring-primary/30"
                      : "hover:border-muted-foreground/30 hover:bg-muted/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-bold ${s.color}`}
                      >
                        0{s.step}
                      </span>
                      <IconComponent
                        className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <h4 className="mt-3 text-sm font-bold text-foreground">{s.title}</h4>
                    <p className="mt-1 text-[11px] text-muted-foreground">{s.subtitle}</p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-border flex items-center justify-between text-[11px] font-semibold text-primary">
                    <span>{isSelected ? "Active Stage" : "Click to view"}</span>
                    <span>→</span>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Selected Step Deep Dive Display */}
          {steps.map((s) => {
            if (s.step !== activeStep) return null;
            const IconComponent = s.icon;
            return (
              <div
                key={s.step}
                className="rounded-2xl border border-primary/20 bg-background p-6 md:p-8 shadow-sm transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border ${s.color}`}
                    >
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Stage 0{s.step} Breakdown
                      </span>
                      <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary self-start md:self-auto">
                    Interactive Workflow Step
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
                  <div className="lg:col-span-7 space-y-4">
                    <p className="text-sm text-foreground leading-relaxed">{s.description}</p>
                    <div className="space-y-2 pt-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Key Technical Highlights:
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground">
                        {s.details.map((detail, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 rounded-lg bg-surface border border-border px-3 py-2"
                          >
                            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                            <span>{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 rounded-xl border border-border bg-surface p-5 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        System Actions Executed:
                      </h5>
                      <ul className="space-y-2 text-xs">
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-primary font-bold">1.</span>
                          <span>Input validation & payload sanitization</span>
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-primary font-bold">2.</span>
                          <span>AI vector embeddings query against statutory index</span>
                        </li>
                        <li className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-primary font-bold">3.</span>
                          <span>Real-time event notification dispatched to matching Lawyers</span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border text-center text-xs text-muted-foreground">
                      <span>Seamless transitions with full audit logging.</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Platform Architecture & Capabilities Cards */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Core Technology
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Built for Precision & Scale
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            A look under the hood at the architectural principles powering CloseUrCase.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface p-6 space-y-3 hover:border-primary/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Sparkles className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">AI NLP Categorization</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Transforms unstructured user descriptions into codified statutory categories with high
              precision metrics.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 space-y-3 hover:border-primary/40 transition-all">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--md-extended-color-citizen) 10%, transparent)",
                color: "var(--md-extended-color-citizen)",
              }}
            >
              <MapPin className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">Geospatial Lawyer Index</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pairs location data with specialized bar registries to find the right Lawyer near the
              citizen.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 space-y-3 hover:border-primary/40 transition-all">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--md-extended-color-lawyer) 10%, transparent)",
                color: "var(--md-extended-color-lawyer)",
              }}
            >
              <BookOpen className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">Knowledge Base Citation</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Provides lawyers with immediate citations to Acts, Sections, and landmark legal
              precedent.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 space-y-3 hover:border-primary/40 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--md-chart-7)]/10 text-[var(--md-chart-7)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h4 className="text-base font-bold text-foreground">Super Admin Governance</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Rigorous credential verification and transparent audit logging across all case
              lifecycle events.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Accordion */}
      <section className="border-t border-border bg-surface py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Questions & Clarity</span>
            </div>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Everything you need to know about CloseUrCase operations and legal compliance
              boundaries.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-background transition-all overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <span className="pr-4">{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3 bg-surface/40">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive CTA Banner */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-surface to-background p-8 md:p-12 text-center relative overflow-hidden shadow-md">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Ready to Streamline Your Legal Workflow?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Whether you are a citizen needing legal assistance or a licensed Lawyer seeking AI
            research tools, CloseUrCase provides the structure you need.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-all"
            >
              <span>Get Started as User</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/lawyer-register"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-xs font-semibold text-foreground hover:bg-muted transition-all"
            >
              <Scale className="h-4 w-4" />
              <span>Lawyer Registration</span>
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-3 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Contact Us</span>
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
