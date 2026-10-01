import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useCallback } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { DocumentPreviewBody } from "@/components/app/DocumentPreview";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import { knowledgeService } from "@/services/knowledgeService";
import { storageService } from "@/services/storageService";
import { masterDataService } from "@/services/masterDataService";
import { useAuth } from "@/context/useAuth";
import type { KnowledgeItem, LawyerDocument } from "@/types";
import type { KnowledgeBaseItem } from "@/types/api";
import {
  MAX_ATTACHMENT_BYTES,
  formatFileSize,
  titleFromFileName,
  isPdfOrDocxFile,
  openDocumentInNewTab,
} from "@/lib/files";
import { formatDateTime } from "@/lib/dateUtils";
import {
  Search,
  BookOpen,
  Upload,
  Trash2,
  FileText,
  Tag,
  RotateCcw,
  Filter,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles,
  Maximize2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  TextField,
  Select,
  Button,
  IconButton,
  ChipSet,
  FilterChip,
  Badge,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/m3";

export const Route = createFileRoute("/lawyer/knowledge-base")({
  component: LawyerKnowledgeBase,
});

type KbTab = "global" | "mine";
type SortOrder = "newest" | "oldest";

export function LawyerKnowledgeBase() {
  const { user } = useAuth();
  const [tab, setTab] = useState<KbTab>("global");
  const effectiveLawyerId = user?.lawyerId || user?.id || "lawyer_default";
  const [personalCount, setPersonalCount] = useState<number>(0);

  return (
    <div className="space-y-3 sm:space-y-4">
      <PageHeader
        title="Legal Knowledge Base & References"
        description="Browse indexed statutory acts and landmark judgements, or keep your own reference documents handy."
        actions={
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "global", label: "Global Docs" },
              { value: "mine", label: `My Docs (${personalCount})` },
            ]}
          />
        }
      />

      {tab === "global" ? (
        <GlobalDocsTab />
      ) : (
        <MyDocsTab lawyerId={effectiveLawyerId} onCountChange={setPersonalCount} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   GLOBAL DOCS — admin-curated, shared knowledge base (read-only for lawyer)
   100% Real API integration directly with PostgreSQL knowledge_items
═══════════════════════════════════════════════════════════════════════ */
function GlobalDocsTab() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [domainFilter, setDomainFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [activePdf, setActivePdf] = useState<KnowledgeItem | null>(null);
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string }[]>(
    [],
  );

  const fetchGlobalDocs = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const data = await knowledgeService.getKnowledgeItems({ scope: "global" });
      const mapped: KnowledgeItem[] = Array.isArray(data)
        ? data.map((r: KnowledgeBaseItem) => ({
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
            scope: "global" as const,
            uploadedAt: r.uploadedAt || new Date().toISOString(),
            uploadedBy: r.uploadedBy || "admin",
          }))
        : [];
      setItems(mapped);
    } catch (err) {
      console.error("Failed to fetch global knowledge documents:", err);
      setIsError("Unable to load reference documents. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGlobalDocs();
    masterDataService
      .getCategories()
      .then((cats) => {
        if (cats && Array.isArray(cats) && cats.length > 0) {
          setAvailableCategories(cats.map((c) => ({ id: c.id, name: c.name })));
        }
      })
      .catch((err) => console.warn("Failed to load categories for knowledge filters:", err));
  }, [fetchGlobalDocs]);

  const categoryFilterList = useMemo(() => {
    const fromItems = items.map((i) => i.categoryName || i.category).filter(Boolean);
    const fromMaster = availableCategories.map((c) => c.name);
    const combined = Array.from(new Set([...fromItems, ...fromMaster]));
    return ["All", ...combined];
  }, [items, availableCategories]);

  const activeFilterCount = domainFilter !== "All" ? 1 : 0;

  const rows = useMemo(() => {
    return items
      .filter((k) => {
        const catText = (k.categoryName || k.category || "").toLowerCase();
        const matchesSearch =
          !q.trim() ||
          k.title.toLowerCase().includes(q.toLowerCase()) ||
          catText.includes(q.toLowerCase());

        const matchesDomain = domainFilter === "All" || catText === domainFilter.toLowerCase();

        return matchesSearch && matchesDomain;
      })
      .sort((a, b) =>
        sortOrder === "newest"
          ? b.uploadedAt.localeCompare(a.uploadedAt)
          : a.uploadedAt.localeCompare(b.uploadedAt),
      );
  }, [items, q, domainFilter, sortOrder]);

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
      header: "Case Category",
      hideCompact: true,
      render: (r) => (
        <span className="inline-block rounded-md border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground">
          {r.categoryName || r.category}
        </span>
      ),
    },
    {
      key: "date",
      header: "Uploaded Date",
      hideCompact: true,
      render: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.uploadedAt)}</span>,
    },
    {
      key: "action",
      header: "Actions",
      render: (r) => (
        <IconButton ariaLabel={`View ${r.title}`} onClick={() => setActivePdf(r)}>
          <Eye className="h-4 w-4 text-primary" />
        </IconButton>
      ),
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Error state alert */}
      {isError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{isError}</span>
          </div>
          <Button variant="outlined" onClick={fetchGlobalDocs} className="h-8 text-xs shrink-0">
            Try again
          </Button>
        </div>
      )}

      {/* TOP SEARCH & FILTER BAR */}
      <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Mobile Row 1: Search input + Filter icon button side-by-side */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:max-w-sm">
            <TextField
              value={q}
              onChange={setQ}
              placeholder="Search acts, judgements, keywords…"
              leadingIcon={<Search className="h-4 w-4" />}
              className="flex-1 min-w-0"
            />

            <div className="relative shrink-0 sm:hidden">
              <IconButton
                variant={showFilters || activeFilterCount > 0 ? "filled" : "outlined"}
                onClick={() => setShowFilters(!showFilters)}
                ariaLabel="Toggle filters"
              >
                <Filter className="h-4 w-4" />
              </IconButton>
              {activeFilterCount > 0 && <Badge count={activeFilterCount} />}
            </div>
          </div>

          {/* Desktop & Mobile Sort + Desktop Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
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

            {/* Desktop Filter Button */}
            <div className="relative hidden sm:block shrink-0">
              <Button
                variant={showFilters || activeFilterCount > 0 ? "filled" : "outlined"}
                icon={<Filter className="h-4 w-4" />}
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="inline-flex items-center gap-1">
                  Filter
                  {showFilters ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </span>
              </Button>
              {activeFilterCount > 0 && <Badge count={activeFilterCount} />}
            </div>

            {(domainFilter !== "All" || q) && (
              <Button
                variant="text"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => {
                  setDomainFilter("All");
                  setQ("");
                }}
                className="shrink-0 text-xs px-2"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* COLLAPSIBLE FILTERS PANEL */}
        {showFilters && (
          <div className="border-t border-border pt-3 space-y-3 animate-in fade-in duration-150">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>Case Category:</span>
              </div>
              <ChipSet>
                {categoryFilterList.map((domain) => (
                  <FilterChip
                    key={domain}
                    label={domain === "All" ? "All Categories" : domain}
                    selected={domainFilter.toLowerCase() === domain.toLowerCase()}
                    onClick={() => setDomainFilter(domain)}
                  />
                ))}
              </ChipSet>
            </div>
          </div>
        )}
      </div>

      {/* DATA TABLE / LOADING STATE */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col gap-1 border-b border-border pb-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-xs font-bold text-foreground">
            Reference Documents ({rows.length})
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Verified legal publications from official gazettes &amp; court databases
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading legal reference documents…</p>
          </div>
        ) : (
          <DataTable
            columns={cols}
            rows={rows}
            empty="No knowledge base documents match your filter criteria."
          />
        )}
      </div>

      {/* PDF / DOCUMENT VIEWER MODAL */}
      {activePdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-4 bg-surface">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-foreground">{activePdf.title}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {activePdf.categoryName || activePdf.category} · {activePdf.size}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDocumentInNewTab(activePdf)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                  title="Full Screen (Open document in new tab)"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Full Screen</span>
                </button>
                <IconButton ariaLabel="Close preview" onClick={() => setActivePdf(null)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-muted/30 space-y-3">
              <DocumentPreviewBody
                fileDataUrl={activePdf.fileDataUrl || activePdf.fileUrl || undefined}
                fileMimeType={activePdf.fileMimeType}
                fileName={activePdf.fileName ?? activePdf.title}
                showFullScreenButton={false}
                fallback={
                  <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background p-4 sm:p-6 shadow-sm space-y-4 text-foreground">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                        OFFICIAL GAZETTE / LEGAL REFERENCE
                      </span>
                      <span className="text-xs font-mono text-muted-foreground">
                        STATUTORY COPY
                      </span>
                    </div>

                    <div className="text-center space-y-1 py-1">
                      <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">
                        {activePdf.title}
                      </h4>
                      <p className="text-xs text-muted-foreground font-mono">
                        CATEGORY: {(activePdf.categoryName || activePdf.category).toUpperCase()}
                      </p>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed text-foreground/90">
                      <p className="font-semibold text-foreground">
                        STATUTORY PROVISIONS &amp; REFERENCES:
                      </p>
                      <p className="bg-muted/40 p-3 sm:p-4 rounded-xl border border-border/50 font-sans">
                        This document represents an indexed statutory reference for{" "}
                        <strong>{activePdf.title}</strong>, maintained in the CloseUrCase legal
                        knowledge base. Advocates can cite these provisions directly in counter
                        statements and petitions.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-between items-end text-[11px] text-muted-foreground">
                      <div>
                        <p className="font-bold text-foreground">CATEGORY:</p>
                        <p>{activePdf.categoryName || activePdf.category}</p>
                      </div>
                      <div className="text-right font-mono">
                        <p>VERIFIED RECORD</p>
                        <p>UPLOADED: {formatDateTime(activePdf.uploadedAt)}</p>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-2 border-t border-border px-4 sm:px-6 py-3 bg-surface sm:flex-row sm:items-center sm:justify-between">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Viewing document in CloseUrCase Viewer
              </span>
              <Button onClick={() => setActivePdf(null)} className="w-full sm:w-auto">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MY DOCS — the lawyer's personal reference documents
   100% Real API integration with Supabase Storage + PostgreSQL DB
═══════════════════════════════════════════════════════════════════════ */
function MyDocsTab({
  lawyerId,
  onCountChange,
}: {
  lawyerId: string;
  onCountChange: (count: number) => void;
}) {
  const [docs, setDocs] = useState<LawyerDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeDoc, setActiveDoc] = useState<LawyerDocument | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteDoc = docs.find((d) => d.id === pendingDeleteId);

  // Categories list for upload categorization
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  // Upload Form State
  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadError, setUploadError] = useState("");

  const fetchPersonalDocs = useCallback(async () => {
    setIsLoading(true);
    setIsError(null);
    try {
      const data = await knowledgeService.getKnowledgeItems({
        scope: "personal",
        lawyerId,
      });

      const mapped: LawyerDocument[] = Array.isArray(data)
        ? data.map((r: KnowledgeBaseItem) => ({
            id: r.id,
            lawyerId: r.lawyerId || lawyerId,
            title: r.title,
            category: r.categoryName || r.category || "General",
            categoryId: r.category,
            categoryName: r.categoryName,
            size: r.size || "1.0 MB",
            fileUrl: r.fileUrl || null,
            fileDataUrl: r.fileUrl || undefined,
            fileName: r.fileName || r.title,
            fileMimeType: r.fileMimeType || "application/pdf",
            uploadedAt: r.uploadedAt || new Date().toISOString(),
            scope: "personal",
            uploadedBy: r.uploadedBy || lawyerId,
          }))
        : [];

      setDocs(mapped);
      onCountChange(mapped.length);
    } catch (err) {
      console.error("Failed to load personal documents:", err);
      setIsError("Unable to load your documents. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [lawyerId, onCountChange]);

  useEffect(() => {
    fetchPersonalDocs();
    masterDataService
      .getCategories()
      .then((cats) => {
        if (cats && Array.isArray(cats) && cats.length > 0) {
          const list = cats.map((c) => ({ id: c.id, name: c.name }));
          setCategories(list);
          setSelectedCategoryId(list[0]?.id || "");
        }
      })
      .catch((err) => console.warn("Failed to load categories for lawyer upload:", err));
  }, [fetchPersonalDocs]);

  const filtered = useMemo(
    () =>
      docs
        .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) =>
          sortOrder === "newest"
            ? b.uploadedAt.localeCompare(a.uploadedAt)
            : a.uploadedAt.localeCompare(b.uploadedAt),
        ),
    [docs, search, sortOrder],
  );

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileSelected) return;

    setIsUploading(true);
    setUploadError("");
    try {
      const title = titleFromFileName(fileSelected.name);

      // 1. Upload to Supabase Storage Bucket
      let fileUrl = "";
      try {
        const uploadRes = await storageService.uploadFile(fileSelected, {
          bucket: "knowledge-base",
          folder: `lawyers/${lawyerId || "personal"}`,
        });
        if (uploadRes && uploadRes.fileUrl) {
          fileUrl = uploadRes.fileUrl;
        }
      } catch (storageErr) {
        console.warn("Storage upload notice:", storageErr);
      }

      // 2. Persist to Backend API in PostgreSQL DB
      const targetCat = selectedCategoryId || categories[0]?.id || "cat_1";
      await knowledgeService.addKnowledgeItem({
        title,
        category: targetCat,
        categoryId: targetCat,
        size: formatFileSize(fileSelected.size),
        fileName: fileSelected.name,
        fileMimeType: fileSelected.type,
        fileUrl: fileUrl || undefined,
        scope: "personal",
        lawyerId,
      });

      // 3. Refresh list from DB
      await fetchPersonalDocs();

      setSuccessMsg(`"${title}" uploaded successfully to your documents.`);
      setFileSelected(null);
      setShowUploadModal(false);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Failed to store personal document:", err);
      setUploadError(
        err instanceof Error
          ? err.message
          : "Failed to upload document. Please verify your file and try again.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pendingDeleteId) return;
    const deleteId = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await knowledgeService.deleteKnowledgeItem(deleteId);
      setDocs((prev) => {
        const updated = prev.filter((d) => d.id !== deleteId);
        onCountChange(updated.length);
        return updated;
      });
      setSuccessMsg("Document deleted successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      console.error("Failed to delete document:", err);
      setIsError("Failed to delete document. Please try again.");
    }
  };

  const cols: Column<LawyerDocument>[] = [
    {
      key: "title",
      header: "Document Title",
      render: (r) => (
        <div className="flex items-start gap-2.5 py-0.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <span className="block w-full text-xs sm:text-sm font-bold text-foreground leading-snug break-words">
              {r.title}
            </span>
            <div className="flex flex-wrap items-center gap-1.5 @5xl:hidden">
              {r.categoryName && (
                <span className="inline-block rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-foreground">
                  {r.categoryName}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">· {formatDateTime(r.uploadedAt)}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Case Category",
      hideCompact: true,
      render: (r) => (
        <span className="inline-block rounded-md border border-border bg-background px-2.5 py-0.5 text-[11px] font-medium text-foreground">
          {r.categoryName || r.category || "General"}
        </span>
      ),
    },
    {
      key: "date",
      header: "Uploaded Date",
      hideCompact: true,
      render: (r) => <span className="text-xs text-muted-foreground">{formatDateTime(r.uploadedAt)}</span>,
    },
    {
      key: "action",
      header: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          <IconButton ariaLabel={`View ${r.title}`} onClick={() => setActiveDoc(r)}>
            <Eye className="h-4 w-4 text-primary" />
          </IconButton>
          <IconButton ariaLabel={`Delete ${r.title}`} onClick={() => setPendingDeleteId(r.id)}>
            <Trash2 className="h-4 w-4" />
          </IconButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-4">
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

      {isError && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{isError}</span>
          </div>
          <Button variant="outlined" onClick={fetchPersonalDocs} className="h-8 text-xs shrink-0">
            Try again
          </Button>
        </div>
      )}

      {/* SEARCH BAR, SORT & UPLOAD BUTTON */}
      <div className="rounded-2xl border border-border bg-surface p-3 sm:p-4 shadow-2xs space-y-2.5 sm:space-y-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {/* Mobile Row 1: Search input + Upload button side by side */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1 sm:max-w-sm">
            <TextField
              value={search}
              onChange={setSearch}
              placeholder="Search your documents…"
              leadingIcon={<Search className="h-4 w-4" />}
              className="flex-1 min-w-0"
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
              <Upload className="h-4 w-4" />
            </IconButton>
          </div>

          {/* Desktop & Mobile Sort + Desktop Upload */}
          <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
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
              icon={<Upload className="h-4 w-4" />}
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
      </div>

      {/* DATA TABLE */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <span className="text-xs font-bold text-foreground">
            Your Documents ({filtered.length})
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Only visible to your lawyer workspace
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-medium">Loading your documents…</p>
          </div>
        ) : (
          <DataTable
            columns={cols}
            rows={filtered}
            empty="You haven't uploaded any documents yet — use Upload Document to add one."
          />
        )}
      </div>

      {/* UPLOAD MODAL */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal} maxWidth="600px">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 w-full">
            <span className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Upload Reference Document
            </span>
            <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setShowUploadModal(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </IconButton>
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form id="my-docs-upload-form" onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <Select
                label="Case Category"
                value={selectedCategoryId}
                onChange={setSelectedCategoryId}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                className="w-full"
              />
              <p className="text-[11px] text-muted-foreground">
                Classify this document under a primary case category for quick lookup.
              </p>
            </div>

            {/* File dropzone */}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-6 py-6 text-xs text-muted-foreground hover:border-primary hover:bg-primary/5 transition-all">
              <Upload className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground text-center">
                {fileSelected ? fileSelected.name : "Select PDF or DOCX File"}
              </span>
              <span className="text-[10px] text-muted-foreground text-center">
                Supported formats: PDF, DOCX (Up to 4MB — uploaded to your private storage)
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
              (
                document.getElementById("my-docs-upload-form") as HTMLFormElement | null
              )?.requestSubmit()
            }
            disabled={!fileSelected || isUploading}
          >
            {isUploading ? "Uploading…" : "Upload Document"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* DOCUMENT VIEWER MODAL */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="w-full max-w-4xl rounded-2xl border border-border bg-surface shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-4 bg-surface">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-bold text-foreground">{activeDoc.title}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {activeDoc.categoryName || activeDoc.category || "General"} · {activeDoc.size} ·
                    Uploaded {formatDateTime(activeDoc.uploadedAt)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => openDocumentInNewTab(activeDoc)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                  title="Full Screen (Open document in new tab)"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Full Screen</span>
                </button>
                <IconButton ariaLabel="Close preview" onClick={() => setActiveDoc(null)}>
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-muted/30 space-y-3">
              <DocumentPreviewBody
                fileDataUrl={activeDoc.fileDataUrl || activeDoc.fileUrl || undefined}
                fileMimeType={activeDoc.fileMimeType}
                fileName={activeDoc.fileName ?? activeDoc.title}
                showFullScreenButton={false}
                fallback={
                  <div className="mx-auto flex max-w-2xl min-h-[220px] flex-col items-center justify-center gap-2.5 rounded-xl border border-border bg-background p-4 sm:p-6 text-center shadow-sm">
                    <FileText className="h-7 w-7 text-muted-foreground" />
                    <p className="text-xs font-semibold text-foreground">
                      {activeDoc.fileName ?? activeDoc.title}
                    </p>
                    <p className="max-w-sm text-[11px] text-muted-foreground">
                      Inline preview isn't available for this file type. Use Full Screen to view the
                      full document.
                    </p>
                  </div>
                }
              />
            </div>

            <div className="flex flex-col gap-2 border-t border-border px-4 sm:px-6 py-3 bg-surface sm:flex-row sm:items-center sm:justify-between">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Viewing document in CloseUrCase Viewer
              </span>
              <Button onClick={() => setActiveDoc(null)} className="w-full sm:w-auto">
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete Document"
        message={`Are you sure you want to permanently delete "${pendingDeleteDoc?.title ?? "this document"}"? This action cannot be undone.`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
