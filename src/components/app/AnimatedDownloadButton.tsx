import { Download } from "lucide-react";
import { usePwaInstall } from "@/lib/usePwaInstall";
import { cn } from "@/lib/utils";

interface AnimatedDownloadButtonProps {
  useBlendedHeader?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function AnimatedDownloadButton({
  useBlendedHeader = false,
  className,
  size = "md",
}: AnimatedDownloadButtonProps) {
  const { promptInstall } = usePwaInstall();
  const isSm = size === "sm";

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (!accepted && typeof window !== "undefined") {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIos) {
        alert(
          "To install CloseUrCase on your device, tap the Share icon in Safari and select 'Add to Home Screen'.",
        );
      } else {
        alert(
          "To install CloseUrCase, open your browser menu (⋮) and tap 'Install app' or 'Add to Home screen'.",
        );
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleInstall}
      title="Download CloseUrCase App"
      aria-label="Download CloseUrCase App"
      className={cn(
        "group inline-flex shrink-0 items-center justify-center font-semibold rounded-full transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]",
        isSm ? "h-9 px-2.5 sm:px-3 text-xs gap-1.5" : "h-9 px-3.5 text-xs gap-2",
        useBlendedHeader
          ? "border border-[#d4af37]/50 bg-[#d4af37]/15 text-[#f5ebd2] backdrop-blur-sm shadow-sm hover:border-[#d4af37] hover:bg-[#d4af37]/25 hover:text-white"
          : "border border-[#d4af37]/55 bg-[#d4af37]/10 text-[#8a6d2f] shadow-sm hover:border-[#d4af37] hover:bg-[#d4af37]/20 hover:text-[#6e5522]",
        className,
      )}
    >
      <Download
        className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-y-0.5"
        strokeWidth={2.2}
      />
      {/* In the compact (header) size, drop the label on the narrowest phones
          so the logo + button + hamburger row can't overflow ~375px. */}
      <span className={isSm ? "hidden min-[390px]:inline" : undefined}>Download App</span>
    </button>
  );
}

export { AnimatedDownloadButton as DownloadAppButton };
