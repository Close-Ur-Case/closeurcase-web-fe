import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  BookOpen,
  Search,
  Upload,
  Eye,
  Trash2,
  X,
  FileCheck2,
  Maximize2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { DocumentPreviewBody } from "@/components/app/DocumentPreview";
import { formatDateTime } from "@/lib/dateUtils";
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
import {
  getKnowledgeBase,
  saveKnowledgeBase,
  deleteKnowledgeItem,
  getActiveCaseCategories,
} from "@/data/appStore";
import { knowledgeService } from "@/services/knowledgeService";
import { storageService } from "@/services/storageService";
import { masterDataService } from "@/services/masterDataService";
import type { KnowledgeItem } from "@/types";
import {
  MAX_ATTACHMENT_BYTES,
  formatFileSize,
  titleFromFileName,
  isPdfOrDocxFile,
  openDocumentInNewTab,
} from "@/lib/files";

export const Route = createFileRoute("/admin/knowledge-base")({
  component: KnowledgeBasePage,
});

type SortOrder = "newest" | "oldest";

export function KnowledgeBasePage() {
  const [rows, setRows] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activePdfModal, setActivePdfModal] = useState<KnowledgeItem | null>(null);

  // Confirm delete
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteItem = rows.find((r) => r.id === pendingDeleteId);

  // Upload modal form states
  const [managedCategories, setManagedCategories] = useState<{ id: string; name: string }[]>(() =>
    getActiveCaseCategories().map((c) => ({ id: c.id, name: c.name })),
  );
  const [catId, setCatId] = useState<string>(
    () => getActiveCaseCategories()[0]?.id ?? "cat_1",
  );
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadError, setUploadError] = useState("");

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const data = await knowledgeService.getKnowledgeItems({ scope: "global" });
      const items: KnowledgeItem[] = Array.isArray(data)
        ? data.map((r: any) => ({
            id: r.id,
            title: r.title,
            category: r.categoryName || r.category || "General",
            categoryId: r.category,
            categoryName: r.categoryName,
            size: r.size || "1.0 MB",
            fileName: r.fileName || r.title,
            fileMimeType: r.fileMimeType || "application/pdf",
            fileUrl: r.fileUrl || null,
            fileDataUrl: r.fileUrl || undefined,
            uploadedAt: r.uploadedAt || new Date().toISOString(),
            scope: "global" as const,
            uploadedBy: r.uploadedBy || "admin",
          }))
        : [];
      setRows(items);
      const current = getKnowledgeBase();
      const personalOnly = current.filter((k) => k.scope === "personal");
      saveKnowledgeBase([...personalOnly, ...items]);
    } catch (err: any) {
      console.error("Failed to load knowledge base items:", err);
      setIsError("Unable to load documents. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    masterDataService
      .getCategories()
      .then((cats) => {
        if (cats && Array.isArray(cats) && cats.length > 0) {
          setManagedCategories(cats.map((c) => ({ id: c.id, name: c.name })));
          setCatId(cats[0].id);
        }
      })
      .catch((err) => console.warn("Failed to fetch categories:", err));
  }, [fetchDocuments]);

  const filtered = useMemo(() => {
    const matches = rows.filter(
      (r) =>
        r.scope !== "personal" &&
        (r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.category.toLowerCase().includes(search.toLowerCase()) ||
          (r.categoryName && r.categoryName.toLowerCase().includes(search.toLowerCase()))),
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

      let fileUrl = "";
      try {
        const uploadRes = await storageService.uploadFile(fileSelected, {
          bucket: "knowledge-base",
          folder: "global-docs",
        });
        if (uploadRes && uploadRes.fileUrl) {
          fileUrl = uploadRes.fileUrl;
        }
      } catch (storageErr) {
        console.warn("Storage upload fallback to data URL:", storageErr);
      }

      await knowledgeService.addKnowledgeItem({
        title,
        categoryId: catId,
        category: catId,
        size: formatFileSize(fileSelected.size),
        fileName: fileSelected.name,
        fileMimeType: fileSelected.type,
        fileUrl: fileUrl || undefined,
        scope: "global",
        uploadedBy: "admin",
      });

      await fetchDocuments();

      setSuccessMsg(`"${title}" has been successfully added to the library.`);
      setFileSelected(null);
      setShowUploadModal(false);

      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Failed to store document in Knowledge Base:", err);
      setUploadError("Unable to upload document. Please ensure the file is under 4MB.");
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
            <div className="flex flex-wrap items-center gap-1.5 @5xl:hidden">
              <span className="inline-block rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-foreground">
                {r.categoryName || r.category}
              </span>
              <span className="text-[10px] text-muted-foreground">· {formatDateTime(r.uploadedAt)}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideCompact: true,
      render: (r) => (
        <span className="inline-block rounded-md border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground">
          {r.categoryName || r.category}
        </span>
      ),
    },
    {
      key: "uploadedAt",
      header: "Date Added",
      hideCompact: true,
      render: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.uploadedAt)}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <IconButton ariaLabel="View document" onClick={() => setActivePdfModal(r)}>
            <Eye className="h-4 w-4 text-primary" />
          </IconButton>
          <IconButton
            ariaLabel="Delete document"
            onClick={() => setPendingDeleteId(r.id)}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <PageHeader
        title="Knowledge Base"
        description="Centralized legal library for acts, rules, judgments, and statutory references accessible by all lawyers."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outlined"
              onClick={fetchDocuments}
              disabled={isLoading}
              icon={<RotateCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />}
              className="text-xs"
            >
              Refresh
            </Button>
            <Button
              variant="filled"
              onClick={() => {
                setUploadError("");
                setFileSelected(null);
                setShowUploadModal(true);
              }}
              icon={<Upload className="h-4 w-4" />}
            >
              Upload Document
            </Button>
          </div>
        }
      />

      {/* SUCCESS BANNER */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-xl">
          <FileCheck2 className="h-4 w-4 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* ERROR BANNER */}
      {isError && (
        <div className="flex items-center justify-between gap-2 p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{isError}</span>
          </div>
          <Button variant="outlined" onClick={fetchDocuments} className="text-xs py-1 h-7">
            Retry
          </Button>
        </div>
      )}

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3 sm:p-4 shadow-2xs">
        <div className="flex-1 min-w-0">
          <TextField
            value={search}
            onChange={(val: string) => setSearch(val)}
            placeholder="Search documents by title, category…"
            leadingIcon={<Search className="h-4 w-4" />}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2 sm:shrink-0 w-full sm:w-auto">
          <Select
            label="Sort"
            value={sortOrder}
            onChange={(v: string) => setSortOrder(v as SortOrder)}
            options={[
              { value: "newest", label: "Newest First" },
              { value: "oldest", label: "Oldest First" },
            ]}
            className="w-full sm:w-44"
          />
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4 shadow-2xs">
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-xs">Loading knowledge documents…</p>
          </div>
        ) : (
          <DataTable
            columns={cols}
            rows={filtered}
            empty={
              search
                ? "No knowledge base documents match your search."
                : "No documents found in the library. Click 'Upload Document' to add one."
            }
          />
        )}
      </div>

      {/* UPLOAD MODAL */}
      <Dialog open={showUploadModal} onOpenChange={(open: boolean) => setShowUploadModal(open)} maxWidth="560px">
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
            <div>
              <Select
                label="Category"
                value={catId}
                onChange={(v: string) => setCatId(v)}
                options={managedCategories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            </div>

            {/* File dropzone */}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-6 py-6 text-xs text-muted-foreground hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground text-center">
                {fileSelected ? fileSelected.name : "Select PDF or DOCX File"}
              </span>
              <span className="text-[10px] text-muted-foreground text-center">
                Supported formats: PDF, DOCX (Up to 4MB)
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
                    setUploadError("File exceeds 4MB size limit.");
                    setFileSelected(null);
                    return;
                  }
                  setUploadError("");
                  setFileSelected(f);
                }}
              />
            </label>

            {uploadError && (
              <p className="text-xs text-destructive text-center font-medium">{uploadError}</p>
            )}

            <div className="rounded-lg bg-surface-container-low p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Shared Library Access</p>
              <p>
                Documents uploaded here are published to the shared knowledge base, making them available to all lawyers for reference and research.
              </p>
            </div>
          </form>
        </DialogContent>
        <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 w-full">
          <Button variant="outlined" onClick={() => setShowUploadModal(false)} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={() =>
              (document.getElementById("kb-upload-form") as HTMLFormElement | null)?.requestSubmit()
            }
            disabled={!fileSelected || isUploading}
            icon={isUploading ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            className="w-full sm:w-auto"
          >
            {isUploading ? "Uploading…" : "Upload Document"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* PDF VIEWER MODAL */}
      <Dialog
        open={Boolean(activePdfModal)}
        onOpenChange={(open: boolean) => !open && setActivePdfModal(null)}
        maxWidth="950px"
      >
        {activePdfModal && (
          <PdfModalBody
            item={activePdfModal}
            hasRealFile={Boolean(activePdfModal.fileDataUrl || activePdfModal.fileUrl)}
            onClose={() => setActivePdfModal(null)}
          />
        )}
      </Dialog>

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete Document"
        message={`Are you sure you want to remove "${pendingDeleteItem?.title ?? "this document"}" from the knowledge library? Lawyers will no longer have access to this document.`}
        confirmLabel="Confirm Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={async () => {
          if (!pendingDeleteId) return;
          try {
            await knowledgeService.deleteKnowledgeItem(pendingDeleteId);
            deleteKnowledgeItem(pendingDeleteId);
            setRows((prev) => prev.filter((r) => r.id !== pendingDeleteId));
            setPendingDeleteId(null);
          } catch (err) {
            console.error("Failed to delete knowledge item:", err);
            setPendingDeleteId(null);
          }
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
                {item.categoryName || item.category} · {item.size}
              </p>
            </div>
          </div>
          <span tabIndex={0} aria-hidden="true" className="sr-only" />
          <div className="flex items-center gap-2 shrink-0">
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
            fileDataUrl={hasRealFile ? item.fileDataUrl || item.fileUrl || undefined : undefined}
            fileMimeType={item.fileMimeType}
            fileName={item.fileName ?? item.title}
            showFullScreenButton={false}
            fallback={
              <div className="mx-auto flex max-w-2xl min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-xl border border-border bg-background p-4 sm:p-6 text-center shadow-sm">
                <BookOpen className="h-8 w-8 text-primary" />
                <h4 className="text-sm font-bold text-foreground">
                  {item.fileName ?? item.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {item.categoryName || item.category} · {item.size}
                </p>
                <p className="max-w-md text-[11px] text-muted-foreground mt-2">
                  Document reference available in the knowledge library. Use Full Screen to view the complete document.
                </p>
              </div>
            }
          />
        </div>
      </DialogContent>
      <DialogFooter className="flex items-center justify-between w-full gap-2">
        <span className="text-xs text-muted-foreground">Document Preview</span>
        <Button onClick={onClose} className="w-full sm:w-auto">
          Close Preview
        </Button>
      </DialogFooter>
    </>
  );
}
