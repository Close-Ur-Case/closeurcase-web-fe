// Base64 inflates size by ~33%; keep well under typical 5MB localStorage quota.
export const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/** Turns a filename into a display title — strips the extension and swaps
 * underscores/hyphens for spaces, e.g. "bare_act_2023.pdf" → "bare act 2023". */
export function titleFromFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^./\\]+$/, "");
  const spaced = withoutExt.replace(/[_-]+/g, " ").trim();
  return spaced || fileName;
}

const PDF_DOCX_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Knowledge Base uploads (admin's index and a lawyer's own docs) are
 * restricted to PDF/DOCX — checked here too since a browser's file picker
 * `accept` filter can be bypassed (e.g. "All Files", drag-and-drop). */
export function isPdfOrDocxFile(file: File): boolean {
  if (file.type) return PDF_DOCX_MIME_TYPES.has(file.type);
  return /\.(pdf|docx)$/i.test(file.name);
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return m;
    }
  });
}

/** Opens a document in a new tab as a full-screen viewer. For base64 Data URLs,
 * creates a Blob URL for PDFs/Images, or renders an interactive full-screen viewer HTML
 * tab for DOCX/other files to prevent unwanted file downloads. */
export function openDocumentInNewTab(item: {
  title: string;
  type?: string;
  category?: string;
  uploadedAt?: string;
  size?: string;
  fileDataUrl?: string;
  fileMimeType?: string;
  fileName?: string;
}) {
  const fileName = item.fileName ?? item.title;
  const isPdf = item.fileMimeType === "application/pdf" || /\.pdf$/i.test(fileName);
  const isImage =
    item.fileMimeType?.startsWith("image/") || /\.(jpe?g|png|gif|webp|svg)$/i.test(fileName);

  if (item.fileDataUrl) {
    try {
      const parts = item.fileDataUrl.split(",");
      if (parts.length === 2) {
        // If it's a PDF or Image, modern browsers can display the Blob URL natively in a new tab
        if (isPdf || isImage) {
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : isPdf ? "application/pdf" : "image/png";
          const bstr = atob(parts[1]);
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          const blob = new Blob([u8arr], { type: mime });
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
          return;
        }

        // For DOCX or non-native browser files: render an interactive full-screen viewer page
        const title = item.title || "Legal Document";
        const docType = item.type || "Personal Document";
        const date = item.uploadedAt || "Uploaded";

        const docxHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - Full Screen Viewer</title>
  <script src="https://unpkg.com/jszip/dist/jszip.min.js"></script>
  <script src="https://unpkg.com/docx-preview@0.3.3/dist/docx-preview.min.js"></script>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; min-height: 100vh; }
    .paper { background: #ffffff; color: #0f172a; max-width: 960px; width: 100%; border-radius: 16px; padding: 2.5rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); box-sizing: border-box; }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 1.25rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .badge { background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
    h1 { font-size: 22px; font-weight: 800; margin: 0.75rem 0 0.25rem 0; color: #0f172a; line-height: 1.3; }
    .meta { font-size: 12px; color: #64748b; font-family: monospace; }
    .docx-wrapper { background: transparent !important; padding: 0 !important; }
    .docx-wrapper > section.docx { width: 100% !important; max-width: 100% !important; padding: 1rem !important; margin: 0 !important; box-shadow: none !important; word-break: break-word !important; }
    .footer { margin-top: 3rem; padding-top: 1.25rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; font-family: monospace; }
  </style>
</head>
<body>
  <div class="paper">
    <div class="header">
      <div>
        <span class="badge">${escapeHtml(docType)}</span>
      </div>
      <div class="meta">UPLOADED: ${escapeHtml(date)}</div>
    </div>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">${escapeHtml(fileName)}</div>
    <div id="docx-container" style="margin-top: 1.5rem;"></div>
    <div class="footer">
      <div>FULL SCREEN VIEWER</div>
      <div>CLOSEURCASE LEGAL SYSTEM</div>
    </div>
  </div>
  <script>
    const dataUrl = "${item.fileDataUrl}";
    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => docx.renderAsync(blob, document.getElementById("docx-container")))
      .catch(err => {
        console.error("Error rendering docx:", err);
        document.getElementById("docx-container").innerHTML = "<p style='color:#ef4444;font-size:14px;'>Failed to render Word document preview.</p>";
      });
  </script>
</body>
</html>`;

        const blob = new Blob([docxHtml], { type: "text/html" });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        return;
      }
    } catch (e) {
      console.error("Failed to open file blob in new tab:", e);
    }
  }

  // Fallback HTML preview page for documents without a raw file payload (seed/mock items)
  const title = item.title || "Legal Document";
  const docType = item.type || "Statutory Reference";
  const domain = item.category ? `${item.category} Law` : "Legal Index";
  const date = item.uploadedAt || "Verified";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - CloseUrCase Document</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 2rem; background: #0f172a; color: #f8fafc; display: flex; justify-content: center; min-height: 100vh; }
    .paper { background: #ffffff; color: #0f172a; max-width: 900px; width: 100%; border-radius: 16px; padding: 3rem; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 1.5rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; }
    .badge { background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
    .domain { color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-top: 6px; }
    h1 { font-size: 24px; font-weight: 800; margin: 1rem 0 0.5rem 0; color: #0f172a; line-height: 1.3; }
    .meta { font-size: 12px; color: #64748b; font-family: monospace; }
    .content { margin-top: 2rem; font-size: 14px; line-height: 1.7; color: #334155; }
    .content p { margin-bottom: 1.25rem; }
    .callout { background: #f8fafc; border-left: 4px solid #2563eb; padding: 1.25rem; border-radius: 0 8px 8px 0; font-weight: 500; margin: 1.5rem 0; }
    .footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; font-family: monospace; }
  </style>
</head>
<body>
  <div class="paper">
    <div class="header">
      <div>
        <span class="badge">${escapeHtml(docType)}</span>
        <div class="domain">${escapeHtml(domain)}</div>
      </div>
      <div class="meta">INDEXED: ${escapeHtml(date)}</div>
    </div>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">CLOSEURCASE VERIFIED LEGAL KNOWLEDGE BASE INDEX</div>
    
    <div class="content">
      <div class="callout">
        This document represents an indexed statutory publication for <strong>${escapeHtml(title)}</strong> in the CloseUrCase legal index. Provisions contained herein are referenced by Lawyer AI during counter-argument and petition preparation.
      </div>
      <p><strong>1. STATUTORY JURISDICTION &amp; SCOPE:</strong> All registered petitions, proceedings, and legal notices issued under this domain are subject to statutory timelines and jurisdictional rules outlined in this publication.</p>
      <p><strong>2. EVIDENTIARY REQUIREMENTS:</strong> Certified physical or digital copies of orders, exhibits, and pleadings shall be produced before the presiding tribunal during hearing proceedings.</p>
      <p><strong>3. PROCEDURAL COMPLIANCE:</strong> Non-compliance with prescribed filing guidelines may warrant summary dismissal or procedural stays as mandated by applicable court rules.</p>
    </div>

    <div class="footer">
      <div>VERIFIED PUBLIC COPY</div>
      <div>CLOSEURCASE LEGAL REPOSITORY</div>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank");
}
