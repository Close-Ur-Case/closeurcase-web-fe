import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Upload,
  BookOpen,
  Trash2,
  CheckCircle2,
  Sparkles,
  Plus,
  Search,
  Eye,
  X,
  Maximize2,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { DocumentPreviewBody } from "@/components/app/DocumentPreview";
import {
  getKnowledgeBase,
  addKnowledgeItem,
  deleteKnowledgeItem,
  subscribeToStore,
  getActiveCaseCategories,
} from "@/data/appStore";
import { knowledgeService } from "@/services/knowledgeService";
import type { KnowledgeItem, LegalCategory } from "@/types";
import {
  MAX_ATTACHMENT_BYTES,
  formatFileSize,
  readFileAsDataUrl,
  titleFromFileName,
  isPdfOrDocxFile,
  openDocumentInNewTab,
} from "@/lib/files";
import {
  TextField,
  Select,
  Button,
  IconButton,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/m3";

export const Route = createFileRoute("/admin/knowledge-base")({
  component: KnowledgeBasePage,
});

const types: KnowledgeItem["type"][] = [
  "Act",
  "Rule",
  "Regulation",
  "Amendment",
  "Judgement",
  "Order",
];

type SortOrder = "newest" | "oldest";

export function KnowledgeBasePage() {
  const [rows, setRows] = useState<KnowledgeItem[]>(getKnowledgeBase);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activePdfModal, setActivePdfModal] = useState<KnowledgeItem | null>(null);
  // Confirm delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteItem = rows.find((r) => r.id === pendingDeleteId);

  // Upload modal form states
  const [managedCategories, setManagedCategories] = useState(() => getActiveCaseCategories());
  const [type, setType] = useState<KnowledgeItem["type"]>("Act");
  const [cat, setCat] = useState<LegalCategory>(
    () => (getActiveCaseCategories()[0]?.name as LegalCategory) ?? "Criminal",
  );
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const sync = () => {
      setRows(getKnowledgeBase());
      setManagedCategories(getActiveCaseCategories());
    };
    const unsub = subscribeToStore(sync);

    // Hydrate remote legal documents from Supabase Edge Function
    knowledgeService
      .getKnowledgeItems()
      .then((remoteItems) => {
        if (remoteItems && Array.isArray(remoteItems) && remoteItems.length > 0) {
          const existingKb = getKnowledgeBase();
          remoteItems.forEach((r) => {
            if (!existingKb.some((k) => k.id === r.id || k.title === r.title)) {
              addKnowledgeItem({
                id: r.id,
                title: r.title,
                type: (r.type as KnowledgeItem["type"]) || "Act",
                category: (r.category as LegalCategory) || "Criminal",
                size: r.size || "1.2 MB",
                fileName: r.fileName || r.title,
                fileMimeType: r.fileMimeType || "application/pdf",
                fileUrl: r.fileUrl,
                uploadedAt: r.uploadedAt
                  ? r.uploadedAt.split("T")[0]
                  : new Date().toISOString().split("T")[0],
              });
            }
          });
        }
      })
      .catch((err) => console.warn("Failed to fetch remote knowledge items:", err));

    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const matches = rows.filter(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase()) ||
        r.type.toLowerCase().includes(search.toLowerCase()),
    );
    return matches.sort((a, b) =>
      sortOrder === "newest"
        ? b.uploadedAt.localeCompare(a.uploadedAt)
        : a.uploadedAt.localeCompare(b.uploadedAt),
    );
  }, [rows, search, sortOrder]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileSelected) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const title = titleFromFileName(fileSelected.name);
      const fileDataUrl = await readFileAsDataUrl(fileSelected);
      addKnowledgeItem({
        title,
        type,
        category: cat,
        size: formatFileSize(fileSelected.size),
        fileDataUrl,
        fileName: fileSelected.name,
        fileMimeType: fileSelected.type,
      });

      // Asynchronously persist to Supabase backend API
      knowledgeService
        .addKnowledgeItem({
          title,
          type,
          category: cat,
          size: formatFileSize(fileSelected.size),
          fileName: fileSelected.name,
          fileMimeType: fileSelected.type,
        })
        .catch((err) => console.warn("Remote knowledge indexing error:", err));

      setSuccessMsg(`"${title}" successfully indexed into Knowledge Base!`);
      setFileSelected(null);
      setShowUploadModal(false);

      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Failed to store document in Knowledge Base:", err);
      setUploadError("Failed to store the document. Try a smaller file.");
    } finally {
      setIsUploading(false);
    }
  };

  const cols: Column<KnowledgeItem>[] = [
    {
      key: "title",
      header: "Document Title",
      render: (r) => (
        <div className="flex items-start gap-2.5 py-0.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
            <BookOpen className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1.5">
            <span className="block w-full text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
              {r.title}
            </span>
            {/* Type + Domain + Date fold in here when the table's narrow — their own columns take over above that. */}
            <div className="flex flex-wrap items-center gap-1.5 @5xl:hidden">
              <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                {r.type}
              </span>
              <span className="inline-block rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-foreground">
                {r.category} Law
              </span>
              <span className="text-[10px] text-muted-foreground">· {r.uploadedAt}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      hideCompact: true,
      render: (r) => (
        <span className="inline-block rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {r.type}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category Domain",
      hideCompact: true,
      render: (r) => <span className="text-xs text-muted-foreground">{r.category} Law</span>,
    },
    {
      key: "uploadedAt",
      header: "Indexed On",
      hideCompact: true,
      render: (r) => <span className="text-xs text-muted-foreground">{r.uploadedAt}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <IconButton ariaLabel={`View ${r.title}`} onClick={() => setActivePdfModal(r)}>
            <Eye className="h-4 w-4 text-primary" />
          </IconButton>
          <IconButton
            ariaLabel="Remove document from index"
            onClick={() => setPendingDeleteId(r.id)}
          >
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      <PageHeader
        title="Knowledge Base & Legal Indexing"
        description="Upload and index statutory acts, amendments, and landmark judgements referenced by Lawyer AI."
      />

      {/* Success alert */}
      {successMsg && (
        <div
          className="flex items-center gap-2 rounded-lg p-3 sm:p-4 text-xs font-bold"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--md-extended-color-success) 10%, transparent)",
            color: "var(--md-extended-color-success)",
          }}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SEARCH BAR, SORT & UPLOAD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-surface p-2.5 sm:p-3 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-80 md:w-96 min-w-0 flex-1">
          <TextField
            value={search}
            onChange={setSearch}
            placeholder="Search acts, judgements, domains..."
            leadingIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            className="w-full min-w-0 flex-1"
          />
          <IconButton
            variant="filled"
            onClick={() => {
              setUploadError("");
              setShowUploadModal(true);
            }}
            ariaLabel="Upload document"
            className="shrink-0 sm:hidden"
          >
            <Plus className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Select
            label="Sort"
            value={sortOrder}
            onChange={(v) => setSortOrder(v as SortOrder)}
            options={[
              { value: "newest", label: "Newest First" },
              { value: "oldest", label: "Oldest First" },
            ]}
            className="flex-1 sm:w-44"
          />
          <Button
            icon={<Plus className="h-4 w-4" />}
            onClick={() => {
              setUploadError("");
              setShowUploadModal(true);
            }}
            className="hidden sm:inline-flex shrink-0"
          >
            Upload Document
          </Button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <span className="text-xs font-bold text-foreground">
            Indexed Reference Documents ({filtered.length})
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Acts, Amendments & Judgements
          </span>
        </div>
        <DataTable
          columns={cols}
          rows={filtered}
          empty="No knowledge base documents match your search."
        />
      </div>

      {/* UPLOAD MODAL */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal} maxWidth="600px">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 w-full">
            <span className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Upload Document to Knowledge Base
            </span>
            <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setShowUploadModal(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </IconButton>
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form id="kb-upload-form" onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Document Type"
                value={type}
                onChange={(v) => setType(v as KnowledgeItem["type"])}
                options={types.map((t) => ({ value: t, label: t }))}
              />
              <Select
                label="Legal Domain"
                value={cat}
                onChange={(v) => setCat(v as LegalCategory)}
                options={managedCategories.map((c) => ({ value: c.name, label: `${c.name} Law` }))}
              />
            </div>

            {/* File dropzone */}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-6 py-6 text-xs text-muted-foreground hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground text-center">
                {fileSelected ? fileSelected.name : "Select PDF or DOCX File"}
              </span>
              <span className="text-[10px] text-muted-foreground text-center">
                Supported format: PDF, DOCX (Up to 4MB — stored in your browser)
              </span>
              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (!f) return;
                  if (!isPdfOrDocxFile(f)) {
                    setUploadError("Only PDF and DOCX files are supported.");
                    setFileSelected(null);
                    return;
                  }
                  if (f.size > MAX_ATTACHMENT_BYTES) {
                    setUploadError("File is too large — please select a file under 4MB.");
                    setFileSelected(null);
                    return;
                  }
                  setUploadError("");
                  setFileSelected(f);
                }}
              />
            </label>
            {uploadError && (
              <p className="text-[11px] font-semibold text-destructive">{uploadError}</p>
            )}
          </form>
        </DialogContent>
        <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 w-full">
          <Button
            variant="outlined"
            onClick={() => setShowUploadModal(false)}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            onClick={() =>
              (document.getElementById("kb-upload-form") as HTMLFormElement | null)?.requestSubmit()
            }
            disabled={!fileSelected || isUploading}
          >
            {isUploading ? "Uploading & Indexing…" : "Upload & Index Document"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* PDF VIEWER POPUP MODAL */}
      <Dialog
        open={activePdfModal !== null}
        onOpenChange={(open) => !open && setActivePdfModal(null)}
        maxWidth="860px"
      >
        {activePdfModal && (
          <PdfModalBody
            item={activePdfModal}
            hasRealFile={Boolean(activePdfModal.fileDataUrl)}
            onClose={() => setActivePdfModal(null)}
          />
        )}
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Remove Document from Index"
        message={`Are you sure you want to permanently remove "${pendingDeleteItem?.title ?? "this document"}" from the Knowledge Base? This action cannot be undone and the AI will lose access to this reference.`}
        confirmLabel="Yes, Remove Document"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteKnowledgeItem(pendingDeleteId);
            knowledgeService
              .deleteKnowledgeItem(pendingDeleteId)
              .catch((err) => console.warn("Remote knowledge deletion error:", err));
          }
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}

interface PdfModalBodyProps {
  item: KnowledgeItem;
  hasRealFile: boolean;
  onClose: () => void;
}

function PdfModalBody({ item, hasRealFile, onClose }: PdfModalBodyProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between gap-3 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-foreground truncate">{item.title}</h3>
              <p className="text-[10px] text-muted-foreground">
                {item.type} · {item.category} Law · {item.size}
              </p>
            </div>
          </div>
          {/* Hidden focus-sink: md-dialog auto-focuses the first focusable
              element on open. This invisible zero-size button absorbs that
              initial focus so the X button doesn't appear highlighted. */}
          <span tabIndex={0} aria-hidden="true" className="sr-only" />
          <div className="flex items-center gap-2 shrink-0">
            {/* Full Screen (Open in new tab) */}
            <button
              type="button"
              onClick={() => openDocumentInNewTab(item)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
              title="Full Screen (Open document in new tab)"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Full Screen</span>
            </button>
            <IconButton ariaLabel="Close preview" tabIndex={-1} onClick={onClose}>
              <X className="h-4 w-4 text-muted-foreground" />
            </IconButton>
          </div>
        </DialogTitle>
      </DialogHeader>
      <DialogContent>
        <div className="space-y-4 py-2">
          <DocumentPreviewBody
            fileDataUrl={hasRealFile ? item.fileDataUrl : undefined}
            fileMimeType={item.fileMimeType}
            fileName={item.fileName ?? item.title}
            showFullScreenButton={false}
            fallback={
              <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background p-4 sm:p-6 shadow-sm space-y-4 text-foreground">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border pb-3 gap-2">
                  <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-muted-foreground">
                    ADMIN KNOWLEDGE BASE INDEX
                  </span>
                  <span className="text-[10px] sm:text-xs font-mono text-muted-foreground">
                    VERIFIED PUBLIC COPY
                  </span>
                </div>

                <div className="text-center space-y-1 py-2">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wide">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    DOMAIN: {item.category.toUpperCase()} LAW
                  </p>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-foreground/90">
                  <p className="font-semibold text-foreground">
                    STATUTORY TEXT &amp; REFERENCE PROVISIONS:
                  </p>
                  <p className="bg-muted/40 p-4 rounded-xl border border-border/50 font-sans">
                    This document represents an indexed statutory publication for{" "}
                    <strong>{item.title}</strong> in the CloseUrCase admin legal index.
                  </p>
                  <p>
                    1. Provisions contained herein are automatically referenced by Lawyer AI during
                    counter-argument generation.
                  </p>
                  <p>2. Official gazette notification date: {item.uploadedAt}.</p>
                </div>
              </div>
            }
          />
        </div>
      </DialogContent>
      <DialogFooter className="flex items-center justify-between w-full gap-2">
        <span className="text-xs text-muted-foreground">Viewing Document in Admin Viewer</span>
        <Button onClick={onClose} className="w-full sm:w-auto">
          Close Preview
        </Button>
      </DialogFooter>
    </>
  );
}
