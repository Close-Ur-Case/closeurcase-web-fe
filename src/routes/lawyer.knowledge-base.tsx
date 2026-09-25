import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { DocumentPreviewBody } from "@/components/app/DocumentPreview";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import {
  getKnowledgeBase,
  addKnowledgeItem,
  getLawyers,
  getLawyerDocuments,
  addLawyerDocument,
  deleteLawyerDocument,
  subscribeToStore,
} from "@/data/appStore";
import { knowledgeService } from "@/services/knowledgeService";
import { useAuth } from "@/context/useAuth";
import type { KnowledgeItem, LawyerDocument, LegalCategory } from "@/types";
import {
  MAX_ATTACHMENT_BYTES,
  formatFileSize,
  readFileAsDataUrl,
  titleFromFileName,
  isPdfOrDocxFile,
  openDocumentInNewTab,
} from "@/lib/files";
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
  const lawyersList = getLawyers();
  const currentLawyerId = user?.lawyerId || user?.id || "";
  const currentLawyer =
    lawyersList.find(
      (l) =>
        (currentLawyerId && (l.id === currentLawyerId || l.id === user?.id)) ||
        (user?.email && l.email?.toLowerCase() === user.email.toLowerCase()),
    ) || null;
  const myDocs = useMyDocs(currentLawyer?.id ?? currentLawyerId);

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
              { value: "mine", label: `My Docs (${myDocs.docs.length})` },
            ]}
          />
        }
      />

      {tab === "global" ? <GlobalDocsTab /> : <MyDocsTab state={myDocs} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   GLOBAL DOCS — admin-curated, shared knowledge base (read-only for lawyer)
═══════════════════════════════════════════════════════════════════════ */
function GlobalDocsTab() {
  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [domainFilter, setDomainFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>(getKnowledgeBase);
  const [activePdf, setActivePdf] = useState<KnowledgeItem | null>(null);

  useEffect(() => {
    const sync = () => setItems(getKnowledgeBase());
    const unsub = subscribeToStore(sync);

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
                // The API calls this `fileUrl`; `KnowledgeItem` stores it as
                // `fileDataUrl`, so a plain passthrough silently dropped it.
                fileDataUrl: r.fileUrl ?? undefined,
                uploadedAt: r.uploadedAt
                  ? r.uploadedAt.split("T")[0]
                  : new Date().toISOString().split("T")[0],
              });
            }
          });
        }
      })
      .catch((err) => console.warn("Failed to fetch remote knowledge items for lawyer:", err));

    return unsub;
  }, []);

  const availableTypes = useMemo(() => {
    const typesSet = new Set(items.map((i) => i.type).filter(Boolean));
    return ["All", ...Array.from(typesSet)];
  }, [items]);

  const availableDomains = useMemo(() => {
    const domainsSet = new Set(items.map((i) => i.category).filter(Boolean));
    return ["All", ...Array.from(domainsSet)];
  }, [items]);

  const activeFilterCount = (typeFilter !== "All" ? 1 : 0) + (domainFilter !== "All" ? 1 : 0);

  const rows = items
    .filter((k) => {
      const matchesSearch =
        k.title.toLowerCase().includes(q.toLowerCase()) ||
        k.category.toLowerCase().includes(q.toLowerCase()) ||
        k.type.toLowerCase().includes(q.toLowerCase());

      const matchesType = typeFilter === "All" || k.type.toLowerCase() === typeFilter.toLowerCase();
      const matchesDomain =
        domainFilter === "All" || k.category.toLowerCase() === domainFilter.toLowerCase();

      return matchesSearch && matchesType && matchesDomain;
    })
    .sort((a, b) =>
      sortOrder === "newest"
        ? b.uploadedAt.localeCompare(a.uploadedAt)
        : a.uploadedAt.localeCompare(b.uploadedAt),
    );

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
      header: "Document Type",
      hideCompact: true,
      render: (r) => (
        <span className="inline-block rounded-md bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
          {r.type}
        </span>
      ),
    },
    {
      key: "category",
      header: "Domain",
      hideCompact: true,
      render: (r) => (
        <span className="inline-block rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground">
          {r.category}
        </span>
      ),
    },
    {
      key: "date",
      header: "Uploaded Date",
      hideCompact: true,
      render: (r) => <span className="text-xs text-muted-foreground">{r.uploadedAt}</span>,
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
      {/* TOP SEARCH & FILTER TOGGLE BAR */}
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

            {/* Mobile Filter Toggle Button (side-by-side with Search input!) */}
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

            {(typeFilter !== "All" || domainFilter !== "All" || q) && (
              <Button
                variant="text"
                icon={<RotateCcw className="h-4 w-4" />}
                onClick={() => {
                  setTypeFilter("All");
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

        {/* COLLAPSIBLE FILTERS PANEL — LIVES UNDER FILTER BUTTON */}
        {showFilters && (
          <div className="border-t border-border pt-3 space-y-3 animate-in fade-in duration-150">
            {/* Document Type Filter Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <FileText className="h-3.5 w-3.5 text-primary" />
                <span>Document Type:</span>
              </div>
              <ChipSet>
                {availableTypes.map((type) => (
                  <FilterChip
                    key={type}
                    label={type === "All" ? "All Types" : type}
                    selected={typeFilter.toLowerCase() === type.toLowerCase()}
                    onClick={() => setTypeFilter(type)}
                  />
                ))}
              </ChipSet>
            </div>

            {/* Legal Domain Filter Buttons */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>Legal Domain:</span>
              </div>
              <ChipSet>
                {availableDomains.map((domain) => (
                  <FilterChip
                    key={domain}
                    label={domain === "All" ? "All Domains" : `${domain} Law`}
                    selected={domainFilter.toLowerCase() === domain.toLowerCase()}
                    onClick={() => setDomainFilter(domain)}
                  />
                ))}
              </ChipSet>
            </div>
          </div>
        )}
      </div>

      {/* DATA TABLE */}
      <div className="rounded-2xl border border-border bg-surface p-3.5 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col gap-1 border-b border-border pb-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <span className="text-xs font-bold text-foreground">
            Reference Documents ({rows.length})
          </span>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Showing verified legal publications
          </span>
        </div>
        <DataTable
          columns={cols}
          rows={rows}
          empty="No knowledge base documents match your filter criteria."
        />
      </div>

      {/* PDF VIEWER POPUP MODAL */}
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
                    {activePdf.type} · {activePdf.category} Law · {activePdf.size}
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

            {/* Modal Body — Document Content Preview */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-5 bg-muted/30 space-y-3">
              <DocumentPreviewBody
                fileDataUrl={activePdf.fileDataUrl}
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
                        DOMAIN: {activePdf.category.toUpperCase()} LAW
                      </p>
                    </div>

                    <div className="space-y-3 text-xs leading-relaxed text-foreground/90">
                      <p className="font-semibold text-foreground">
                        STATUTORY PROVISIONS &amp; STATUTORY REFERENCES:
                      </p>
                      <p className="bg-muted/40 p-3 sm:p-4 rounded-xl border border-border/50 font-sans">
                        This document represents an indexed statutory text reference for{" "}
                        <strong>{activePdf.title}</strong>, maintained in the CloseUrCase legal
                        knowledge base. Lawyers can cite these sections directly in AI counter
                        generation.
                      </p>
                      <p>
                        1. Under the applicable provisions, all registered petitions and legal
                        notices must conform to statutory timelines and jurisdictional
                        prerequisites.
                      </p>
                      <p>
                        2. Certified copies of orders and evidentiary exhibits shall be produced
                        before the presiding tribunal during preliminary hearing proceedings.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border flex justify-between items-end text-[11px] text-muted-foreground">
                      <div>
                        <p className="font-bold text-foreground">INDEXED REFERENCE:</p>
                        <p>{activePdf.type}</p>
                      </div>
                      <div className="text-right font-mono">
                        <p>VERIFIED DOCUMENT</p>
                        <p>UPLOADED: {activePdf.uploadedAt}</p>
                      </div>
                    </div>
                  </div>
                }
              />
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col gap-2 border-t border-border px-4 sm:px-6 py-3 bg-surface sm:flex-row sm:items-center sm:justify-between">
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Viewing PDF in CloseUrCase Viewer
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
   MY DOCS — the lawyer's own personal reference documents
═══════════════════════════════════════════════════════════════════════ */
function useMyDocs(lawyerId: string) {
  const [docs, setDocs] = useState<LawyerDocument[]>(() => getLawyerDocuments(lawyerId));

  useEffect(() => {
    const sync = () => setDocs(getLawyerDocuments(lawyerId));
    sync();
    return subscribeToStore(sync);
  }, [lawyerId]);

  return { lawyerId, docs };
}

function MyDocsTab({ state }: { state: { lawyerId: string; docs: LawyerDocument[] } }) {
  const { lawyerId, docs } = state;
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeDoc, setActiveDoc] = useState<LawyerDocument | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteDoc = docs.find((d) => d.id === pendingDeleteId);

  const [fileSelected, setFileSelected] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [uploadError, setUploadError] = useState("");

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
      const fileDataUrl = await readFileAsDataUrl(fileSelected);
      addLawyerDocument({
        lawyerId,
        title,
        size: formatFileSize(fileSelected.size),
        fileDataUrl,
        fileName: fileSelected.name,
        fileMimeType: fileSelected.type,
      });

      setSuccessMsg(`"${title}" added to your documents.`);
      setFileSelected(null);
      setShowUploadModal(false);

      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      console.error("Failed to store personal document:", err);
      setUploadError("Failed to store the document. Try a smaller file.");
    } finally {
      setIsUploading(false);
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
            {/* Uploaded date folds in here when the table's narrow — its own column takes over above that. */}
            <span className="block text-[10px] text-muted-foreground @5xl:hidden">
              Uploaded {r.uploadedAt}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "date",
      header: "Uploaded Date",
      hideCompact: true,
      render: (r) => <span className="text-xs text-muted-foreground">{r.uploadedAt}</span>,
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
            Only visible to you
          </span>
        </div>
        <DataTable
          columns={cols}
          rows={filtered}
          empty="You haven't uploaded any documents yet — use Upload Document to add one."
        />
      </div>

      {/* UPLOAD MODAL */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal} maxWidth="600px">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3 w-full">
            <span className="flex items-center gap-2 text-sm sm:text-base font-bold text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Upload to My Docs
            </span>
            <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setShowUploadModal(false)}>
              <X className="h-4 w-4 text-muted-foreground" />
            </IconButton>
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form id="my-docs-upload-form" onSubmit={handleUploadSubmit} className="space-y-4">
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
                    {activeDoc.size} · Uploaded {activeDoc.uploadedAt}
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
                fileDataUrl={activeDoc.fileDataUrl}
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
        onConfirm={() => {
          if (pendingDeleteId) deleteLawyerDocument(pendingDeleteId);
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
