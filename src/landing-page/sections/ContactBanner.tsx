import { Download } from "lucide-react";
import { Button } from "@/components/m3";
import { WhatsAppInlineIcon, whatsappUrl } from "@/components/app/WhatsAppButton";
import { usePwaInstall } from "@/lib/usePwaInstall";
import { goldButtonStyle } from "@/landing-page/theme";

export function ContactBanner() {
  const { canInstall, promptInstall } = usePwaInstall();

  return (
    <section className="bg-[#faf8f4] py-3">
      <div className="mx-auto max-w-7xl 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-[#d4af37]/30 bg-gradient-to-r from-[#0a0d14] via-[#121929] to-[#0a0d14] shadow-lg shadow-[#0a0d14]/10">
          <div
            className={`relative z-10 grid ${canInstall ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} divide-y divide-white/10 sm:divide-x sm:divide-y-0`}
          >
            <div className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row sm:p-7">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/15 text-[#25D366] sm:flex">
                  <WhatsAppInlineIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">Chat with our assistant</h2>
                  <p className="mt-0.5 text-xs text-slate-300/70">
                    Get answers instantly on WhatsApp, anytime.
                  </p>
                </div>
              </div>
              <a
                href={whatsappUrl("Hi, I'd like to know more about CloseurCase.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 text-xs font-semibold text-slate-950 transition-colors hover:bg-[#20bd5a] sm:w-auto"
              >
                <WhatsAppInlineIcon className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </div>

            {canInstall && (
              <div className="flex flex-col items-center justify-between gap-4 p-6 sm:flex-row sm:p-7">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d4af37]/15 text-[#d4af37] sm:flex">
                    <Download className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-white">Get the CloseurCase app</h2>
                    <p className="mt-0.5 text-xs text-slate-300/70">
                      One tap access on your device, anytime.
                    </p>
                  </div>
                </div>
                <Button
                  variant="filled"
                  onClick={promptInstall}
                  style={goldButtonStyle}
                  className="!rounded-full !px-6 !py-2.5 !text-xs font-semibold transition-transform active:scale-[0.98]"
                  icon={<Download className="h-4 w-4" />}
                >
                  Download app
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
