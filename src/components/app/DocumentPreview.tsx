import { useEffect, useRef, useState } from "react";
import { FileText, Maximize2 } from "lucide-react";
import { openDocumentInNewTab } from "@/lib/files";

const DOCX_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function looksLikePdf(fileName: string, fileMimeType?: string): boolean {
  if (fileMimeType) return fileMimeType === "application/pdf";
  return /\.pdf$/i.test(fileName);
}

function looksLikeImage(fileName: string, fileMimeType?: string): boolean {
  if (fileMimeType) return fileMimeType.startsWith("image/");
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(fileName);
}

function looksLikeDocx(fileName: string, fileMimeType?: string): boolean {
  if (fileMimeType) return DOCX_MIME_TYPES.has(fileMimeType);
  return /\.docx?$/i.test(fileName);
}

/** Renders a .doc/.docx file's actual content client-side (docx-preview
 * converts it straight to HTML/CSS in the browser — no server round-trip,
 * matching this app's localStorage-only data layer). Included is a prominent
 * Full Screen button that opens the rendered file in a dedicated new tab. */
export function DocxPreview({
  fileDataUrl,
  fileName,
  title,
  showFullScreenButton = true,
}: {
  fileDataUrl: string;
  fileName: string;
  title?: string;
  showFullScreenButton?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    const container = containerRef.current;
    if (container) container.innerHTML = "";

    // `docx-preview` (and its `jszip` dependency) is ~170 KB minified and is
    // only needed when a Word document is actually previewed — load it lazily
    // so it stays out of the initial bundle.
    Promise.all([import("docx-preview"), fetch(fileDataUrl).then((res) => res.blob())])
      .then(([{ renderAsync }, blob]) => {
        if (cancelled || !container) return;
        return renderAsync(blob, container, undefined, {
          ignoreWidth: true,
          ignoreHeight: true,
        });
      })
      .catch((err) => {
        console.error(`Failed to render "${fileName}" as a Word document:`, err);
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [fileDataUrl, fileName]);

  const handleFullScreen = () => {
    openDocumentInNewTab({
      title: title || fileName,
      fileName,
      fileDataUrl,
      fileMimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
  };

  return (
    <div className="space-y-3 w-full">
      {showFullScreenButton && (
        <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-foreground truncate max-w-xs sm:max-w-md">
                {fileName}
              </span>
              <span className="block text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                Word Document (.docx)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleFullScreen}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary transition-all cursor-pointer shadow-2xs"
            title="Open document in new tab (Full Screen)"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Full Screen</span>
          </button>
        </div>
      )}

      {failed ? (
        <div className="flex h-56 flex-col items-center justify-center gap-3 text-center text-xs text-muted-foreground">
          <FileText className="h-8 w-8 text-muted-foreground/60" />
          <p>Couldn't render inline preview for this Word document.</p>
          <button
            type="button"
            onClick={handleFullScreen}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground transition-all cursor-pointer shadow-xs"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span>Open Full Screen in New Tab</span>
          </button>
        </div>
      ) : (
        <div ref={containerRef} className="docx-container-rendered overflow-x-auto min-h-[200px]" />
      )}
    </div>
  );
}

/**
 * Shared fullscreen preview body for any uploaded file across the app (case
 * attachments, admin Knowledge Base, lawyer Knowledge Base) — real rendering
 * for PDFs, images, and .doc/.docx; a "no inline preview" message for
 * anything else; and `fallback` for the no-real-file case (seed/mock items
 * that only carry a name, no actual bytes).
 */
export function DocumentPreviewBody({
  fileDataUrl,
  fileMimeType,
  fileName,
  fallback,
  title,
  showFullScreenButton = true,
}: {
  fileDataUrl?: string;
  fileMimeType?: string;
  fileName: string;
  fallback: React.ReactNode;
  title?: string;
  showFullScreenButton?: boolean;
}) {
  if (!fileDataUrl) return <>{fallback}</>;

  const handleFullScreen = () => {
    openDocumentInNewTab({
      title: title || fileName,
      fileName,
      fileDataUrl,
      fileMimeType,
    });
  };

  if (looksLikePdf(fileName, fileMimeType)) {
    return (
      <div className="space-y-3 w-full">
        {showFullScreenButton && (
          <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
            <span className="text-xs font-bold text-foreground truncate max-w-xs sm:max-w-md">
              {fileName}
            </span>
            <button
              type="button"
              onClick={handleFullScreen}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary transition-all cursor-pointer shadow-2xs"
              title="Full Screen (Open document in new tab)"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Screen</span>
            </button>
          </div>
        )}
        <div className="mx-auto h-[60vh] sm:h-[70vh] w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-background shadow-sm">
          <iframe src={fileDataUrl} title={fileName} className="h-full w-full bg-white border-0" />
        </div>
      </div>
    );
  }

  if (looksLikeImage(fileName, fileMimeType)) {
    return (
      <div className="space-y-3 w-full">
        {showFullScreenButton && (
          <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
            <span className="text-xs font-bold text-foreground truncate max-w-xs sm:max-w-md">
              {fileName}
            </span>
            <button
              type="button"
              onClick={handleFullScreen}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary transition-all cursor-pointer shadow-2xs"
              title="Full Screen (Open document in new tab)"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Screen</span>
            </button>
          </div>
        )}
        <div className="mx-auto flex max-h-[60vh] sm:max-h-[70vh] max-w-3xl items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-2 shadow-sm">
          <img
            src={fileDataUrl}
            alt={fileName}
            className="max-h-[58vh] sm:max-h-[68vh] w-auto max-w-full rounded-lg object-contain"
          />
        </div>
      </div>
    );
  }

  if (looksLikeDocx(fileName, fileMimeType)) {
    return (
      <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-background p-3 sm:p-5 shadow-sm">
        <DocxPreview
          fileDataUrl={fileDataUrl}
          fileName={fileName}
          title={title}
          showFullScreenButton={showFullScreenButton}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[300px] max-w-2xl flex-col items-center justify-center gap-3 rounded-xl border border-border bg-background p-8 text-center shadow-sm">
      <FileText className="h-8 w-8 text-muted-foreground" />
      <p className="text-xs font-semibold text-foreground">{fileName}</p>
      <p className="max-w-sm text-[11px] text-muted-foreground">
        Inline preview isn't available for this file type.
      </p>
      <button
        type="button"
        onClick={handleFullScreen}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground transition-all cursor-pointer shadow-xs mt-1"
      >
        <Maximize2 className="h-3.5 w-3.5" />
        <span>Open Full Screen in New Tab</span>
      </button>
    </div>
  );
}
