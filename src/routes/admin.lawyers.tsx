import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/app/DataTable";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { UserAvatar } from "@/components/app/UserAvatar";
import { LawyerProfileCard } from "@/components/app/LawyerProfileCard";
import { DocumentPreviewBody } from "@/components/app/DocumentPreview";
import { openDocumentInNewTab } from "@/lib/files";
import { FilterPanelButton, type FilterSection } from "@/components/app/FilterPanelButton";
import {
  getLawyers,
  mergeRemoteLawyers,
  updateLawyerStatus,
  subscribeToStore,
} from "@/data/appStore";
import { lawyerService } from "@/services/lawyerService";
import { lawyerStatusColor } from "@/lib/statusColors";
import type { Lawyer } from "@/types";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  X,
  Eye,
  Paperclip,
  Check,
  Bell,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Download,
  Mail,
  Send,
} from "lucide-react";
import {
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/m3";

export const Route = createFileRoute("/admin/lawyers")({
  component: LawyersPage,
});

function countBy<T extends string>(rows: Lawyer[], pick: (l: Lawyer) => T) {
  const counts = new Map<T, number>();
  rows.forEach((r) => {
    const v = pick(r);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  return counts;
}

export function LawyersPage() {
  const [rows, setRows] = useState<Lawyer[]>(getLawyers);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // md-dialog measures its own size once when it opens; content that only
  // mounts in the very same instant as the open flip (rather than already
  // sitting in the DOM) gets measured before it's actually laid out, so the
  // dialog can clip it. Keeping the last-picked lawyer around after close
  // (instead of resetting to null) keeps the dialog's content permanently
  // mounted, matching how ConfirmDialog stays correctly sized.
  const displayLawyer = selectedLawyer ?? rows[0] ?? null;
  // Confirm state for status-changing actions
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    name: string;
    action: "Rejected" | "Suspended" | "Reinstated";
  } | null>(null);

  // Attachments (ID proof) viewer — separate from the profile detail dialog
  const [attachmentsLawyer, setAttachmentsLawyer] = useState<Lawyer | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFullScreen, setPreviewFullScreen] = useState(false);

  // Compose-email popup
  const [emailLawyer, setEmailLawyer] = useState<Lawyer | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const openEmail = (r: Lawyer) => {
    setEmailLawyer(r);
    setEmailOpen(true);
  };

  useEffect(() => {
    const sync = () => setRows(getLawyers());
    lawyerService
      .getLawyers<Partial<Lawyer>>()
      .then((backendLawyers) => {
        // Merging notifies store subscribers, so `sync` above picks this up.
        mergeRemoteLawyers(backendLawyers);
      })
      .catch((err: unknown) => {
        // Non-fatal: the table keeps rendering whatever the store already holds.
        console.warn("[Admin Lawyers] Backend fetch notice:", err);
      });
    return subscribeToStore(sync);
  }, []);

  const pendingLawyers = useMemo(() => rows.filter((r) => r.status === "Pending"), [rows]);

  const locationCounts = countBy(rows, (r) => r.city);
  const categoryCounts = countBy(rows, (r) => r.category);
  const statusCounts = countBy(rows, (r) => r.status);

  const filterSections: FilterSection[] = [
    {
      key: "city",
      label: "Location",
      options: Array.from(locationCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, label: value, count })),
    },
    {
      key: "category",
      label: "Legal Domain",
      options: Array.from(categoryCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, label: `${value} Law`, count })),
    },
    {
      key: "status",
      label: "Verification Status",
      options: Array.from(statusCounts.entries()).map(([value, count]) => ({
        value,
        label: value,
        count,
      })),
    },
  ];

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = !search.trim()
        ? true
        : `${r.name} ${r.email} ${r.phone} ${r.city} ${r.category} ${r.barId}`
            .toLowerCase()
            .includes(search.toLowerCase());
      const matchesFilters = Object.entries(filters).every(
        ([key, values]) => values.length === 0 || values.includes(String(r[key as keyof Lawyer])),
      );
      return matchesSearch && matchesFilters;
    });
  }, [rows, search, filters]);

  const handleUpdateStatus = (id: string, status: Lawyer["status"]) => {
    updateLawyerStatus(id, status);
    lawyerService
      .moderateLawyer(id, {
        status,
        moderationNotes: `Verification status updated to ${status} by Platform Administrator`,
      })
      .catch((err: unknown) => {
        console.warn("[Lawyer Moderation] Server update notice:", err);
      });
  };

  function openProfile(r: Lawyer) {
    setSelectedLawyer(r);
    setDetailOpen(true);
  }

  function openAttachments(r: Lawyer) {
    setAttachmentsLawyer(r);
  }

  function renderLawyerCard(r: Lawyer) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-3.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm sm:p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <UserAvatar name={r.name} size="sm" role="lawyer" />
            <div className="min-w-0 space-y-1">
              <div className="line-clamp-2 text-sm font-bold text-foreground sm:text-[15px]">
                {r.name}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <span>{r.category} Law</span>
                <span aria-hidden>•</span>
                <span>{r.city}</span>
                <span aria-hidden>•</span>
                <span>{r.experienceYears} yrs exp.</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Bar Reg. ID:{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-bold text-primary font-mono">
                  {r.barId}
                </code>
              </div>
            </div>
          </div>

          <div className="shrink-0">
            <StatusBadge v={r.status} />
          </div>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-end gap-1.5 border-t border-border/60 pt-2">
          <IconButton
            variant="tonal"
            title="View profile"
            ariaLabel={`View profile for ${r.name}`}
            onClick={() => openProfile(r)}
          >
            <Eye className="h-4 w-4" />
          </IconButton>
          <IconButton
            variant="tonal"
            title="View attachments"
            ariaLabel={`View attachments for ${r.name}`}
            onClick={() => openAttachments(r)}
          >
            <Paperclip className="h-4 w-4" />
          </IconButton>

          {r.status === "Pending" && (
            <>
              <IconButton
                variant="tonal"
                title="Approve application"
                ariaLabel={`Approve ${r.name}'s application`}
                onClick={() => handleUpdateStatus(r.id, "Approved")}
              >
                <Check className="h-4 w-4 text-[var(--md-extended-color-success)]" />
              </IconButton>
              <IconButton
                variant="tonal"
                title="Reject application"
                ariaLabel={`Reject ${r.name}'s application`}
                onClick={() => setConfirmAction({ id: r.id, name: r.name, action: "Rejected" })}
              >
                <X className="h-4 w-4 text-[var(--md-sys-color-error)]" />
              </IconButton>
            </>
          )}

          {r.status === "Approved" && (
            <IconButton
              variant="tonal"
              title="Suspend account"
              ariaLabel={`Suspend ${r.name}'s account`}
              onClick={() => setConfirmAction({ id: r.id, name: r.name, action: "Suspended" })}
            >
              <AlertTriangle className="h-4 w-4 text-[var(--md-extended-color-warning)]" />
            </IconButton>
          )}

          {(r.status === "Suspended" || r.status === "Rejected") && (
            <IconButton
              variant="tonal"
              title="Reinstate account"
              ariaLabel={`Reinstate ${r.name}'s account`}
              onClick={() => setConfirmAction({ id: r.id, name: r.name, action: "Reinstated" })}
            >
              <Check className="h-4 w-4 text-[var(--md-extended-color-success)]" />
            </IconButton>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lawyers"
        description="Review Lawyer registration applications, bar credentials, and account verification statuses."
      />

      {/* SEARCH BAR & FILTER CONTROL CARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-surface p-2.5 sm:p-3 shadow-2xs">
        <TextField
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone, email, city, Bar ID..."
          leadingIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          className="w-full sm:w-80 md:w-96 min-w-0 flex-1"
        />
        <FilterPanelButton sections={filterSections} selected={filters} onChange={setFilters} />
      </div>

      {/* PENDING REGISTRATION REQUESTS INBOX */}
      {pendingLawyers.length > 0 && (
        <PendingLawyerRequestsInbox
          lawyers={pendingLawyers}
          onApprove={(r) => handleUpdateStatus(r.id, "Approved")}
          onReject={(r) => setConfirmAction({ id: r.id, name: r.name, action: "Rejected" })}
          onViewProfile={openProfile}
          onViewAttachments={openAttachments}
          onEmail={openEmail}
        />
      )}

      {/* Lawyers DATA TABLE */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between border-b border-border pb-3">
          <span className="text-xs font-bold text-foreground">
            Registered Lawyers ({filtered.length})
          </span>
          <span className="text-xs text-muted-foreground">Showing verified legal counsel list</span>
        </div>
        <DataTable
          renderCard={renderLawyerCard}
          rows={filtered}
          empty="No Lawyers match your search query or filter."
        />
      </div>

      {/* Lawyer Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen} maxWidth="680px">
        {displayLawyer && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3 w-full">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lawyer Profile
                </span>
                {/* Focus sink — absorbs md-dialog's auto-focus on open */}
                <span tabIndex={0} aria-hidden="true" className="sr-only" />
                <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setDetailOpen(false)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </IconButton>
              </DialogTitle>
            </DialogHeader>
            <DialogContent>
              <LawyerProfileCard lawyer={displayLawyer} />
              <div className="mt-6 space-y-2 border-t border-border pt-4">
                <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <Paperclip className="h-3.5 w-3.5" />
                  ID Proof Document
                </h3>
                <LawyerIdProofRow lawyer={displayLawyer} onPreview={() => setPreviewOpen(true)} />
              </div>
            </DialogContent>
            {displayLawyer.status === "Pending" && (
              <DialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  className="w-full sm:flex-1"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => {
                    handleUpdateStatus(displayLawyer.id, "Approved");
                    setDetailOpen(false);
                  }}
                  style={
                    {
                      "--md-filled-button-container-color": "var(--md-extended-color-success)",
                      "--md-filled-button-label-text-color": "#fff",
                    } as React.CSSProperties
                  }
                >
                  Approve Application
                </Button>
                <Button
                  className="w-full sm:flex-1"
                  icon={<XCircle className="h-4 w-4" />}
                  onClick={() => {
                    setConfirmAction({
                      id: displayLawyer.id,
                      name: displayLawyer.name,
                      action: "Rejected",
                    });
                    setDetailOpen(false);
                  }}
                  style={
                    {
                      "--md-filled-button-container-color": "var(--md-sys-color-error)",
                      "--md-filled-button-label-text-color": "#fff",
                    } as React.CSSProperties
                  }
                >
                  Reject Application
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </Dialog>

      {/* CONFIRM ACTION DIALOG — Reject / Suspend / Reinstate */}
      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction?.action === "Rejected"
            ? "Reject Lawyer Application"
            : confirmAction?.action === "Suspended"
              ? "Suspend Lawyer Account"
              : "Reinstate Lawyer Account"
        }
        message={
          confirmAction?.action === "Rejected"
            ? `Are you sure you want to reject ${confirmAction?.name ?? "this Lawyer"}'s registration application? They will be notified and their account will not be activated.`
            : confirmAction?.action === "Suspended"
              ? `Are you sure you want to suspend ${confirmAction?.name ?? "this Lawyer"}'s account? They will lose access to the platform immediately and cannot accept new cases.`
              : `Are you sure you want to reinstate ${confirmAction?.name ?? "this Lawyer"}'s account? They will regain full access to the platform and can accept new cases again.`
        }
        confirmLabel={
          confirmAction?.action === "Rejected"
            ? "Yes, Reject Application"
            : confirmAction?.action === "Suspended"
              ? "Yes, Suspend Account"
              : "Yes, Reinstate Account"
        }
        cancelLabel="Cancel"
        variant={confirmAction?.action === "Rejected" ? "danger" : "warning"}
        onConfirm={() => {
          if (confirmAction) {
            handleUpdateStatus(
              confirmAction.id,
              confirmAction.action === "Reinstated" ? "Approved" : confirmAction.action,
            );
          }
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* ATTACHMENTS (ID PROOF) VIEWER */}
      <Dialog
        open={attachmentsLawyer !== null}
        onOpenChange={(o) => !o && setAttachmentsLawyer(null)}
        maxWidth="520px"
      >
        {attachmentsLawyer && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3 w-full">
                <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Attachments — {attachmentsLawyer.name}
                </span>
                <span tabIndex={0} aria-hidden="true" className="sr-only" />
                <IconButton
                  ariaLabel="Close"
                  tabIndex={-1}
                  onClick={() => setAttachmentsLawyer(null)}
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </IconButton>
              </DialogTitle>
            </DialogHeader>
            <DialogContent>
              <LawyerIdProofRow lawyer={attachmentsLawyer} onPreview={() => setPreviewOpen(true)} />
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* ID PROOF FULLSCREEN-CAPABLE PREVIEW */}
      {previewOpen && attachmentsLawyer?.idProofUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewOpen(false);
          }}
        >
          <div
            className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl transition-all ${
              previewFullScreen ? "h-full w-full" : "max-h-[85vh] w-full max-w-2xl"
            }`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-3.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {attachmentsLawyer.idProofUrl.startsWith("data:image") ? (
                    <ImageIcon className="h-4 w-4" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                </span>
                <span className="truncate text-xs font-bold text-foreground">
                  {attachmentsLawyer.idProofFileName || "ID Proof Document"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openDocumentInNewTab({
                      title: attachmentsLawyer.idProofFileName || "ID Proof Document",
                      fileName: attachmentsLawyer.idProofFileName || "ID Proof Document",
                      fileDataUrl: attachmentsLawyer.idProofUrl,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary transition-all cursor-pointer shadow-2xs"
                  title="Full Screen (Open document in new tab)"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Full Screen</span>
                </button>
                <IconButton ariaLabel="Close preview" onClick={() => setPreviewOpen(false)}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
              <DocumentPreviewBody
                fileDataUrl={attachmentsLawyer.idProofUrl}
                fileName={attachmentsLawyer.idProofFileName || "ID Proof"}
                showFullScreenButton={false}
                fallback={
                  <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-background p-6 shadow-sm">
                    <FileText className="h-12 w-12 text-muted-foreground/60" />
                    <p className="text-xs font-semibold text-foreground">
                      {attachmentsLawyer.idProofFileName || "ID Proof Document"}
                    </p>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* COMPOSE EMAIL POPUP */}
      <ComposeEmailDialog
        open={emailOpen}
        lawyer={emailLawyer}
        onClose={() => setEmailOpen(false)}
      />
    </div>
  );
}

/**
 * Gmail-style "New Message" compose popup. Frontend-only — there is no mail
 * server, so Send records the attempt and shows a confirmation. Styled to read
 * as a real email composition window: dark title bar, borderless To / Subject /
 * body fields, an attach-files button, and a Send button.
 */
function ComposeEmailDialog({
  open,
  lawyer,
  onClose,
}: {
  open: boolean;
  lawyer: Lawyer | null;
  onClose: () => void;
}) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);
  const [sent, setSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setSubject("Regarding your CloseUrCase lawyer registration");
    setBody("");
    setAttachments([]);
    setPendingRemove(null);
    setSent(false);
  }, [open, lawyer?.id]);

  const to = lawyer?.email ?? "";
  const canSend = to.length > 0 && body.trim().length > 0 && !sent;

  // Capture the picked files synchronously — the input is reset right after, so
  // the live FileList would be empty by the time a deferred state updater reads it.
  const addFiles = (picked: File[]) => {
    if (picked.length === 0) return;
    setAttachments((prev) => [...prev, ...picked]);
  };
  const removeFile = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = () => {
    if (!canSend) return;
    // No backend in this app — log the outbound mail and confirm to the admin.
    console.info("[admin/lawyers] email sent", {
      to,
      subject,
      body,
      attachments: attachments.map((f) => f.name),
    });
    setSent(true);
    window.setTimeout(onClose, 1500);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()} maxWidth="560px">
        <DialogContent className="overflow-hidden rounded-2xl border border-border p-0!">
          {/* Focus sink — absorbs md-dialog's auto-focus on open */}
          <span tabIndex={0} aria-hidden="true" className="sr-only" />

          {/* Title bar */}
          <div className="flex items-center justify-between gap-2 bg-primary px-4 py-2.5 text-primary-foreground">
            <span className="text-[13px] font-semibold">New Message</span>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="rounded p-1 text-primary-foreground/80 transition-colors hover:bg-primary-foreground/15 hover:text-primary-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--md-extended-color-success) 12%, transparent)",
                }}
              >
                <Send className="h-5 w-5 text-[var(--md-extended-color-success)]" />
              </span>
              <p className="text-sm font-semibold text-foreground">Email sent</p>
              <p className="text-xs text-muted-foreground">Delivered to {to}</p>
            </div>
          ) : (
            <>
              <div className="px-4">
                {/* To */}
                <div className="flex items-center gap-2 border-b border-border py-2.5 text-[13px]">
                  <span className="shrink-0 text-muted-foreground">To</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {to || "—"}
                  </span>
                </div>
                {/* Subject */}
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full border-b border-border bg-transparent py-2.5 text-[13px] font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted-foreground"
                />
                {/* Body */}
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={7}
                  placeholder="Write your message…"
                  className="w-full resize-none bg-transparent py-3 text-[13px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground"
                />

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="max-h-28 space-y-1.5 overflow-y-auto pb-2.5">
                    {attachments.map((f, i) => (
                      <div
                        key={`${f.name}-${i}`}
                        className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1.5 text-[11px]"
                      >
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                          {f.name}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          aria-label={`Delete ${f.name}`}
                          title="Delete attachment"
                          onClick={() => setPendingRemove(i)}
                          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action bar — attachment then send, bottom-right */}
              <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-2.5">
                <IconButton
                  variant="tonal"
                  ariaLabel="Attach files"
                  title="Attach files"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </IconButton>
                <IconButton
                  variant="tonal"
                  ariaLabel="Send email"
                  title="Send email"
                  disabled={!canSend}
                  onClick={handleSend}
                >
                  <Send className="h-4 w-4" />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const picked = e.target.files ? Array.from(e.target.files) : [];
                    e.target.value = "";
                    addFiles(picked);
                  }}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Delete attachment?"
        message={
          pendingRemove !== null && attachments[pendingRemove]
            ? `Remove “${attachments[pendingRemove].name}” from this email? This can't be undone.`
            : "Remove this attachment from the email?"
        }
        confirmLabel="Delete"
        cancelLabel="Keep"
        variant="danger"
        onConfirm={() => {
          if (pendingRemove !== null) removeFile(pendingRemove);
          setPendingRemove(null);
        }}
        onCancel={() => setPendingRemove(null)}
      />
    </>
  );
}

function StatusBadge({ v }: { v: Lawyer["status"] }) {
  const color = lawyerStatusColor[v];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      {v === "Approved" && <CheckCircle2 className="h-3.5 w-3.5" />}
      {v === "Pending" && <AlertTriangle className="h-3.5 w-3.5" />}
      {v}
    </span>
  );
}

/** A single ID-proof document row — reused by the attachments dialog and the
 * profile dialog's "ID Proof Document" section, styled like the attachment
 * rows in CasesTable's attachments modal. */
function LawyerIdProofRow({ lawyer, onPreview }: { lawyer: Lawyer; onPreview: () => void }) {
  if (!lawyer.idProofUrl) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-background p-4 text-center text-xs text-muted-foreground">
        No documents submitted.
      </p>
    );
  }

  const isImage = lawyer.idProofUrl.startsWith("data:image");
  const fileName = lawyer.idProofFileName || "ID Proof Document";

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background p-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-foreground" title={fileName}>
            {fileName}
          </div>
          <div className="text-[10px] text-muted-foreground">Submitted at registration</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <IconButton ariaLabel="Preview" title="Preview" onClick={onPreview}>
          <Eye className="h-4 w-4" />
        </IconButton>
        <a
          href={lawyer.idProofUrl}
          download={fileName}
          title="Download"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
        >
          <Download className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

/** Collapsible "Pending Requests" style inbox for new lawyer registration
 * applications — mirrors PendingRequestsInbox/PendingRequestCard from
 * CaseDocketRegister.tsx (the lawyer "Assigned Cases" request queue) so the
 * accept/decline interaction pattern stays consistent across the app. */
function PendingLawyerRequestsInbox({
  lawyers,
  onApprove,
  onReject,
  onViewProfile,
  onViewAttachments,
  onEmail,
}: {
  lawyers: Lawyer[];
  onApprove: (r: Lawyer) => void;
  onReject: (r: Lawyer) => void;
  onViewProfile: (r: Lawyer) => void;
  onViewAttachments: (r: Lawyer) => void;
  onEmail: (r: Lawyer) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="overflow-hidden rounded-2xl shadow-sm"
      style={{
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: "color-mix(in srgb, var(--md-extended-color-warning) 45%, transparent)",
        backgroundColor:
          "color-mix(in srgb, var(--md-extended-color-warning) 5%, var(--md-sys-color-surface))",
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((p) => !p)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 transition-colors hover:bg-black/5"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--md-extended-color-warning) 18%, transparent)",
            }}
          >
            <Bell className="h-3.5 w-3.5" style={{ color: "var(--md-extended-color-warning)" }} />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold text-foreground">Registration Requests</span>
            <span
              className="ml-2 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: "var(--md-extended-color-warning)" }}
            >
              {lawyers.length}
            </span>
          </div>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            — Awaiting your Accept or Decline
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {!collapsed && (
        <div
          className="border-t border-dashed px-3 pt-3 pb-4 sm:px-5 sm:pb-5"
          style={{
            borderColor: "color-mix(in srgb, var(--md-extended-color-warning) 35%, transparent)",
          }}
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {lawyers.map((r) => (
              <PendingLawyerRequestCard
                key={r.id}
                r={r}
                onApprove={onApprove}
                onReject={onReject}
                onViewProfile={onViewProfile}
                onViewAttachments={onViewAttachments}
                onEmail={onEmail}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PendingLawyerRequestCard({
  r,
  onApprove,
  onReject,
  onViewProfile,
  onViewAttachments,
  onEmail,
}: {
  r: Lawyer;
  onApprove: (r: Lawyer) => void;
  onReject: (r: Lawyer) => void;
  onViewProfile: (r: Lawyer) => void;
  onViewAttachments: (r: Lawyer) => void;
  onEmail: (r: Lawyer) => void;
}) {
  return (
    <div
      className="flex h-full flex-col rounded-xl border bg-white p-3.5 shadow-xs sm:p-4"
      style={{
        borderColor: "color-mix(in srgb, var(--md-extended-color-warning) 30%, transparent)",
      }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <UserAvatar name={r.name} size="sm" role="lawyer" />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="line-clamp-2 text-sm font-bold text-foreground leading-snug">
              {r.name}
            </h3>
            <span
              className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--md-extended-color-warning) 15%, transparent)",
                color: "var(--md-extended-color-warning)",
              }}
            >
              New Application
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span>{r.category} Law</span>
            <span aria-hidden>•</span>
            <span>{r.city}</span>
            <span aria-hidden>•</span>
            <span>{r.experienceYears} yrs exp.</span>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Bar Reg. ID:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-bold text-primary font-mono">
              {r.barId}
            </code>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-end gap-1.5 border-t border-border/60 pt-2">
        <IconButton
          variant="tonal"
          ariaLabel={`View profile for ${r.name}`}
          title="View profile"
          onClick={() => onViewProfile(r)}
        >
          <Eye className="h-4 w-4" />
        </IconButton>
        <IconButton
          variant="tonal"
          ariaLabel={`View attachments for ${r.name}`}
          title="View attachments"
          onClick={() => onViewAttachments(r)}
        >
          <Paperclip className="h-4 w-4" />
        </IconButton>
        <IconButton
          variant="tonal"
          ariaLabel={`Email ${r.name}`}
          title="Email lawyer"
          onClick={() => onEmail(r)}
        >
          <Mail className="h-4 w-4" />
        </IconButton>
        <IconButton
          variant="tonal"
          ariaLabel={`Decline ${r.name}'s application`}
          title="Decline application"
          onClick={() => onReject(r)}
        >
          <X className="h-4 w-4 text-[var(--md-sys-color-error)]" />
        </IconButton>
        <IconButton
          variant="tonal"
          ariaLabel={`Accept ${r.name}'s application`}
          title="Accept application"
          onClick={() => onApprove(r)}
        >
          <Check className="h-4 w-4 text-[var(--md-extended-color-success)]" />
        </IconButton>
      </div>
    </div>
  );
}
