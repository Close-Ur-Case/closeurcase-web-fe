import {
  FileText,
  UserCheck,
  BellRing,
  FileCheck,
  ShieldCheck,
  FolderLock,
  Landmark,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionKicker } from "@/landing-page/SectionKicker";

interface LegalNode {
  id: string;
  label: string;
  icon: typeof FileText;
  x: number;
  y: number;
  labelPosition:
    "top" | "top-right" | "right" | "bottom-right" | "bottom" | "bottom-left" | "left" | "top-left";
  accentColor: string;
}

// 8 radial nodes positioned along R=88 around center (130, 130) inside a 260x260 box
const NODES: LegalNode[] = [
  {
    id: "filing",
    label: "Court Filing",
    icon: FileText,
    x: 130,
    y: 42,
    labelPosition: "top",
    accentColor: "text-blue-700 bg-blue-50 border-blue-200",
  },
  {
    id: "advocate",
    label: "Advocate",
    icon: UserCheck,
    x: 192,
    y: 68,
    labelPosition: "top-right",
    accentColor: "text-amber-700 bg-amber-50 border-amber-200",
  },
  {
    id: "hearing",
    label: "Hearing Alerts",
    icon: BellRing,
    x: 218,
    y: 130,
    labelPosition: "right",
    accentColor: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
  {
    id: "orders",
    label: "Order Copies",
    icon: FileCheck,
    x: 192,
    y: 192,
    labelPosition: "bottom-right",
    accentColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  {
    id: "escrow",
    label: "Fee Escrow",
    icon: ShieldCheck,
    x: 130,
    y: 218,
    labelPosition: "bottom",
    accentColor: "text-cyan-700 bg-cyan-50 border-cyan-200",
  },
  {
    id: "vault",
    label: "Case Vault",
    icon: FolderLock,
    x: 68,
    y: 192,
    labelPosition: "bottom-left",
    accentColor: "text-purple-700 bg-purple-50 border-purple-200",
  },
  {
    id: "ecourts",
    label: "eCourts CNR",
    icon: Landmark,
    x: 42,
    y: 130,
    labelPosition: "left",
    accentColor: "text-sky-700 bg-sky-50 border-sky-200",
  },
  {
    id: "chat",
    label: "Lawyer Chat",
    icon: MessageSquare,
    x: 68,
    y: 68,
    labelPosition: "top-left",
    accentColor: "text-teal-700 bg-teal-50 border-teal-200",
  },
];

function getLabelClasses(pos: LegalNode["labelPosition"]) {
  switch (pos) {
    case "top":
      return "bottom-full mb-1 left-1/2 -translate-x-1/2 text-center";
    case "top-right":
      return "bottom-full mb-0.5 left-1/2 text-left";
    case "right":
      return "left-full ml-1.5 top-1/2 -translate-y-1/2 text-left";
    case "bottom-right":
      return "top-full mt-0.5 left-1/2 text-left";
    case "bottom":
      return "top-full mt-1 left-1/2 -translate-x-1/2 text-center";
    case "bottom-left":
      return "top-full mt-0.5 right-1/2 text-right";
    case "left":
      return "right-full mr-1.5 top-1/2 -translate-y-1/2 text-right";
    case "top-left":
      return "bottom-full mb-0.5 right-1/2 text-right";
  }
}

export function TheOldWayVsCloseUrCase() {
  return (
    <section className="border-t border-slate-200/70 bg-[#faf8f4] py-7 sm:py-10">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Section Header: Aligned exactly like HowItWorks, CourtExplainer, etc. */}
        <div className="mb-6 max-w-xl">
          <SectionKicker label="The paradigm shift" />
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Stop juggling and start resolving
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Compare the scattered chaos of traditional litigation against CloseUrCase&apos;s unified
            legal hub.
          </p>
        </div>

        {/* 2 Comparison Cards Side by Side */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 items-stretch max-w-5xl mx-auto">
          {/* Card 1: The Old Way */}
          <div className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-[#fffcf7] p-5 sm:p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:border-slate-300">
            <div>
              {/* Header */}
              <div className="text-center">
                <h3 className="font-serif text-xl font-semibold text-slate-900 sm:text-2xl">
                  The Old Way
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-500 max-w-xs mx-auto">
                  Slow. Manual filing, error-prone, and full of paperwork. Deadlines are easy to
                  miss, and expert help feels out of reach.
                </p>
              </div>

              {/* Diagram: The Tangled Disconnected Web (Compact 260px) */}
              <div className="relative mx-auto my-4 h-[250px] w-[250px] sm:h-[260px] sm:w-[260px]">
                {/* SVG Tangled Dashed Connecting Lines */}
                <svg
                  viewBox="0 0 260 260"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  {/* Outer subtle guide circle */}
                  <circle
                    cx="130"
                    cy="130"
                    r="88"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                    opacity="0.6"
                  />

                  {/* Tangled chaotic crossing lines */}
                  <path
                    d="M 130 42 Q 185 130 130 218"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.25"
                    strokeDasharray="3 3"
                  />
                  <path
                    d="M 68 68 Q 150 105 192 192"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.25"
                    strokeDasharray="3 3"
                  />
                  <path
                    d="M 42 130 Q 130 175 218 130"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.25"
                    strokeDasharray="3 3"
                  />
                  <path
                    d="M 192 68 Q 110 160 68 192"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.25"
                    strokeDasharray="3 3"
                  />
                  <path
                    d="M 68 68 Q 130 120 192 68"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.25"
                    strokeDasharray="3 3"
                  />
                  <path
                    d="M 42 130 Q 75 75 130 42"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.25"
                    strokeDasharray="3 3"
                  />
                  <path
                    d="M 68 192 Q 130 145 192 192"
                    fill="none"
                    stroke="#cbd5e1"
                    strokeWidth="1.25"
                    strokeDasharray="3 3"
                  />
                </svg>

                {/* Hand cursor icons pointing to chaotic paths */}
                <span className="pointer-events-none absolute left-[48%] top-[25%] -translate-x-1/2 text-xs opacity-60">
                  👆
                </span>
                <span className="pointer-events-none absolute left-[32%] top-[52%] -translate-y-1/2 text-xs opacity-60">
                  👉
                </span>
                <span className="pointer-events-none absolute left-[67%] top-[55%] -translate-y-1/2 text-xs opacity-60">
                  👈
                </span>
                <span className="pointer-events-none absolute left-[48%] bottom-[23%] -translate-x-1/2 text-xs opacity-60">
                  👇
                </span>
                <span className="pointer-events-none absolute left-[38%] top-[34%] text-[10px] opacity-50">
                  👆
                </span>
                <span className="pointer-events-none absolute right-[32%] bottom-[34%] text-[10px] opacity-50">
                  👉
                </span>

                {/* Nodes positioned along the perimeter */}
                {NODES.map((node) => {
                  const Icon = node.icon;
                  const leftPct = (node.x / 260) * 100;
                  const topPct = (node.y / 260) * 100;

                  return (
                    <div
                      key={node.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    >
                      {/* Node Icon Circle (Muted grey style) */}
                      <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-400 shadow-xs">
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      {/* Label */}
                      <span
                        className={cn(
                          "pointer-events-none absolute whitespace-nowrap text-[9px] font-medium text-slate-400",
                          getLabelClasses(node.labelPosition),
                        )}
                      >
                        {node.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-1 text-center text-[11px] text-slate-400 font-medium">
              Disconnected manual handoffs &bull; Zero central accountability
            </div>
          </div>

          {/* Card 2: The CloseUrCase Way */}
          <div className="relative flex flex-col justify-between rounded-3xl border border-[#d4af37]/40 bg-[#fffcf7] p-5 sm:p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:border-[#d4af37]/70 hover:shadow-md hover:shadow-slate-900/6">
            <div>
              {/* Header */}
              <div className="text-center">
                <h3 className="font-serif text-xl font-semibold text-slate-900 sm:text-2xl">
                  The CloseUrCase Way
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-slate-600 max-w-xs mx-auto">
                  Quick AI-powered filing, precise, and automated. You get smart alerts, secure
                  document storage, and expert support anytime you need it.
                </p>
              </div>

              {/* Diagram: The Central CloseUrCase Hub with Radiating Spokes (Compact 260px) */}
              <div className="relative mx-auto my-4 h-[250px] w-[250px] sm:h-[260px] sm:w-[260px]">
                {/* SVG Radiating Connection Spokes */}
                <svg
                  viewBox="0 0 260 260"
                  className="pointer-events-none absolute inset-0 h-full w-full"
                >
                  {/* Subtle outer aura rings */}
                  <circle
                    cx="130"
                    cy="130"
                    r="88"
                    fill="none"
                    stroke="#bfdbfe"
                    strokeWidth="1.25"
                    strokeDasharray="2 3"
                    opacity="0.6"
                  />
                  <circle
                    cx="130"
                    cy="130"
                    r="44"
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="1.25"
                    opacity="0.5"
                  />
                  <circle cx="130" cy="130" r="34" fill="#eff6ff" opacity="0.75" />

                  {/* Clean straight connection spokes from hub (130, 130) to each node */}
                  {NODES.map((node) => (
                    <line
                      key={node.id}
                      x1="130"
                      y1="130"
                      x2={node.x}
                      y2={node.y}
                      stroke="#93c5fd"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  ))}
                </svg>

                {/* Central CloseUrCase Hub Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                  <div className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full bg-gradient-to-br from-[#003272] via-[#024a96] to-[#d4af37] p-1 shadow-md shadow-[#003272]/20 ring-4 ring-blue-50">
                    <img
                      src="/logo.svg"
                      alt="CloseUrCase Hub"
                      className="h-8 w-8 sm:h-8.5 sm:w-8.5 object-contain drop-shadow-xs"
                    />
                  </div>
                  {/* Hand cursor clicking on the central hub */}
                  <span className="pointer-events-none absolute -bottom-4 text-xs">👆</span>
                </div>

                {/* Nodes positioned along the perimeter (Colorful & connected) */}
                {NODES.map((node) => {
                  const Icon = node.icon;
                  const leftPct = (node.x / 260) * 100;
                  const topPct = (node.y / 260) * 100;

                  return (
                    <div
                      key={node.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10"
                      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                    >
                      {/* Node Icon Circle */}
                      <div
                        className={cn(
                          "flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border shadow-xs transition-transform duration-200 hover:scale-110",
                          node.accentColor,
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>

                      {/* Label */}
                      <span
                        className={cn(
                          "pointer-events-none absolute whitespace-nowrap text-[9px] font-semibold text-slate-700",
                          getLabelClasses(node.labelPosition),
                        )}
                      >
                        {node.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Full-Width CTA Button */}
            <div className="mt-3">
              <a
                href="/citizen-login"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#003272] py-2.5 sm:py-3 px-4 text-center text-xs sm:text-sm font-semibold text-white shadow-sm shadow-[#003272]/20 transition-all hover:bg-[#024397] hover:shadow-md"
              >
                <span>Start with CloseUrCase</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
