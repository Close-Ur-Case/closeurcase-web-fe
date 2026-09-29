import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "@tanstack/react-router";
import {
  Pencil,
  Eye,
  X,
  Check,
  Paperclip,
  Download,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  ChevronRight,
  CalendarClock,
  Landmark,
  User,
  Hash,
  Star,
  Upload,
  MessageSquare,
  MessageCircle,
  UploadCloud,
  Mic,
  ExternalLink,
  Loader2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Button,
  IconButton,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  TextField,
} from "@/components/m3";
import {
  getCases,
  saveCases,
  addCaseAttachments,
  updateCaseStatus,
  subscribeToStore,
  getLawyers,
  submitLawyerRating,
  getLawyerRatingForCase,
} from "@/data/appStore";
import { caseService } from "@/services/caseService";
import { chatService } from "@/services/chatService";
import type { ChatMessage } from "@/components/app/CaseChat";
import { storageService } from "@/services/storageService";
import { UserAvatar } from "@/components/app/UserAvatar";
import {
  MAX_ATTACHMENT_BYTES,
  formatFileSize,
  readFileAsDataUrl,
  openDocumentInNewTab,
} from "@/lib/files";
import { sanitizeName, sanitizeCNR, validateName, validateCNR } from "@/lib/validations";
import { searchCourtCases } from "@/data/courtCasesFixture";
import { CardPagination } from "@/components/app/CardPagination";
import { DocumentPreviewBody } from "@/components/app/DocumentPreview";
import type { LegalCase, CaseStatus, CaseDocument } from "@/types";
import { ChatButton } from "@/components/app/CaseChat";
import {
  STATUS_LIST,
  STATUS_META,
  STORED_STATUS_TO_FILTER,
  COURTS_FLAT,
  PRE_CNR_STAGES,
  StatusBadge,
  fmtDate,
  todayISO,
  getCourtHistory,
  getNextEntry,
  getStageHistory,
  formatCaseVsTitle,
  type CourtHistoryRow,
} from "@/components/app/caseDocketShared";

type CnrImportResult =
  | { status: "found"; source: "database" | "ecourts"; title: string }
  | { status: "not-found" }
  | null;

function docLooksLikeImage(doc: CaseDocument): boolean {
  if (doc.fileMimeType) return doc.fileMimeType.startsWith("image/");
  return /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(doc.name);
}

function docDisplayTitle(doc: CaseDocument): string {
  const withoutExt = doc.name.replace(/\.[^./\\]+$/, "");
  const spaced = withoutExt.replace(/[_-]+/g, " ").trim();
  return spaced || doc.name;
}

/** A case is "Existing" if it was linked via a real court CNR number (either
 * through the wizard's Existing Case path, or imported from eCourts) —
 * everything else was freshly filed through CloseUrCase itself. */
export function caseTypeOf(c: LegalCase): "New" | "Existing" {
  return c?.caseDetails?.cnr ? "Existing" : "New";
}

function CaseTypeBadge({ caseItem }: { caseItem: LegalCase }) {
  const type = caseTypeOf(caseItem);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        type === "Existing"
          ? "bg-primary/10 text-primary"
          : "bg-[var(--md-extended-color-success)]/10 text-[var(--md-extended-color-success)]"
      }`}
    >
      {type}
    </span>
  );
}

export type AttachmentTab =
  | "citizen_submitted"
  | "lawyer_uploaded"
  | "citizen_shared"
  | "lawyer_shared";

function chatMessageToDocument(msg: ChatMessage): CaseDocument {
  const isImage =
    msg.attachmentType === "image" ||
    /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(msg.attachmentName || "") ||
    Boolean(msg.attachmentUrl?.startsWith("data:image/"));
  const isAudio =
    msg.attachmentType === "audio" ||
    /\.(webm|mp3|wav|ogg|m4a|aac)$/i.test(msg.attachmentName || "");
  const mimeType = isImage
    ? "image/jpeg"
    : isAudio
      ? "audio/webm"
      : (msg as any).attachmentMimeType ||
        (/\.pdf$/i.test(msg.attachmentName || "")
          ? "application/pdf"
          : /\.docx?$/i.test(msg.attachmentName || "")
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/octet-stream");

  return {
    id: msg.id,
    name: msg.attachmentName || (isImage ? "Chat Image" : isAudio ? "Voice Note" : "Chat Document"),
    size: msg.attachmentSize || (isAudio && msg.audioDuration ? `${msg.audioDuration}s` : "Chat Media"),
    uploadedAt: msg.at ? msg.at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    fileDataUrl: msg.attachmentUrl || "",
    fileMimeType: mimeType,
    uploadedBy: msg.sender,
  };
}

/**
 * The cases table shared by citizen "My Cases", lawyer "Assigned Cases", and
 * both dashboards' "Upcoming Hearings" widget — one component, one set of
 * columns/behavior everywhere. `cases` controls which rows are shown (the
 * caller owns search/filter/sort), but save/delete always read and write the
 * full store list so editing a filtered-down view never drops other cases.
 */
export function CasesTable({
  cases,
  role,
  onCaseUpdate,
}: {
  cases: LegalCase[];
  role: "lawyer" | "citizen";
  onCaseUpdate?: (updatedCase: LegalCase) => void;
}) {
  const navigate = useNavigate();
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<LegalCase | null>(null);

  const [attachmentsCaseId, setAttachmentsCaseId] = useState<string | null>(null);
  const [attachmentTab, setAttachmentTab] = useState<AttachmentTab>("citizen_submitted");
  const [caseChatMessages, setCaseChatMessages] = useState<ChatMessage[]>([]);
  const [isLoadingChatMessages, setIsLoadingChatMessages] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState("");
  const addAttachmentInputRef = useRef<HTMLInputElement>(null);
  const lawyerUploadInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<CaseDocument | null>(null);
  const [previewFullScreen, setPreviewFullScreen] = useState(false);

  const [partyNames, setPartyNames] = useState("");
  const [partyNameError, setPartyNameError] = useState("");
  const [caseNo, setCaseNo] = useState("");
  const [cnr, setCnr] = useState("");
  const [cnrError, setCnrError] = useState("");
  const [caseStatus, setCaseStatus] = useState("Submitted");
  const [journey, setJourney] = useState<CourtHistoryRow[]>([]);
  const [cnrImportResult, setCnrImportResult] = useState<CnrImportResult>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const isLawyer = role === "lawyer";

  const [ratingCase, setRatingCase] = useState<LegalCase | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [hoveredScore, setHoveredScore] = useState<number | null>(null);
  const [ratingFeedback, setRatingFeedback] = useState<string>("");
  const [lawyers, setLawyers] = useState(getLawyers);

  useEffect(() => {
    const sync = () => {
      setAllCases(getCases());
      setLawyers(getLawyers());
    };
    sync();
    return subscribeToStore(sync);
  }, []);

  // Sync consultation chat messages when opening attachments popup
  useEffect(() => {
    if (!attachmentsCaseId) {
      setCaseChatMessages([]);
      return;
    }

    const loadCaseChat = () => {
      try {
        const raw = localStorage.getItem("cuc_case_chats_v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setCaseChatMessages(parsed.filter((m: any) => m.caseId === attachmentsCaseId));
          }
        }
      } catch (err) {
        console.warn("[CasesTable] Local chat messages read notice:", err);
      }
    };

    loadCaseChat();
    window.addEventListener("cuc_chat_updated", loadCaseChat);

    let active = true;
    setIsLoadingChatMessages(true);
    chatService
      .getMessages(attachmentsCaseId)
      .then((remoteMsgs) => {
        if (!active || !Array.isArray(remoteMsgs)) return;
        const formatted: ChatMessage[] = remoteMsgs.map((rm) => ({
          id: rm.id,
          caseId: rm.caseId,
          text: rm.text || (rm as any).message || undefined,
          sender: rm.sender as "citizen" | "lawyer",
          senderName: rm.senderName || (rm.sender === "lawyer" ? "Lawyer" : "Client"),
          at: rm.at || (rm as any).createdAt || new Date().toISOString(),
          read: rm.read ?? false,
          attachmentType: rm.attachmentType as any,
          attachmentName: rm.attachmentName || undefined,
          attachmentUrl: rm.attachmentUrl || undefined,
          attachmentSize: rm.attachmentSize || undefined,
          audioDuration: rm.audioDuration || undefined,
        }));

        setCaseChatMessages((prev) => {
          const merged = [...prev, ...formatted];
          const seen = new Set<string>();
          const deduped: ChatMessage[] = [];
          for (const m of merged) {
            if (!m.id || seen.has(m.id)) continue;
            seen.add(m.id);
            deduped.push(m);
          }
          return deduped;
        });
      })
      .catch((err) => {
        console.warn("[CasesTable] Remote chat messages fetch notice:", err);
      })
      .finally(() => {
        if (active) setIsLoadingChatMessages(false);
      });

    return () => {
      active = false;
      window.removeEventListener("cuc_chat_updated", loadCaseChat);
    };
  }, [attachmentsCaseId]);

  function handleOpenRatingModal(c: LegalCase) {
    const matchedLawyer = lawyers.find(
      (l) =>
        (c.lawyerId && l.id === c.lawyerId) ||
        (c.lawyerName && l.name.toLowerCase() === c.lawyerName.toLowerCase()),
    );
    const lawyerId = matchedLawyer?.id || c.lawyerId;

    if (lawyerId) {
      const existing = getLawyerRatingForCase(c.id, lawyerId);
      if (existing) {
        setRatingScore(existing.rating);
        setRatingFeedback(existing.feedback || "");
      } else {
        setRatingScore(5);
        setRatingFeedback("");
      }
    } else {
      setRatingScore(5);
      setRatingFeedback("");
    }
    setHoveredScore(null);
    setRatingCase(c);
  }

  function handleSubmitRating() {
    if (!ratingCase) return;
    const matchedLawyer = lawyers.find(
      (l) =>
        (ratingCase.lawyerId && l.id === ratingCase.lawyerId) ||
        (ratingCase.lawyerName && l.name.toLowerCase() === ratingCase.lawyerName.toLowerCase()),
    );
    const lawyerId = matchedLawyer?.id || ratingCase.lawyerId;
    if (!lawyerId) {
      alert("No registered lawyer found for this case to rate.");
      setRatingCase(null);
      return;
    }

    submitLawyerRating({
      lawyerId,
      caseId: ratingCase.id,
      rating: ratingScore,
      feedback: ratingFeedback.trim(),
      citizenName: ratingCase.citizenName,
    });

    setRatingCase(null);
  }

  // Reset to page 1 whenever the caller's filtered/sorted case list changes shape.
  useEffect(() => {
    setPage(1);
  }, [cases.length]);

  function handleOpenModal(c: LegalCase) {
    setEditingCase(c);
    setPartyNames(c.title || "");
    setPartyNameError("");
    setCaseNo(c.caseDetails?.caseNumber || "");
    setCnr(c.caseDetails?.cnr || "");
    setCnrError("");
    setCaseStatus(c.status || "Submitted");
    setJourney(getCourtHistory(c));
    setCnrImportResult(null);

    setDialogOpen(true);
  }

  function handleCnrChange(value: string) {
    setCnr(value);
    setCnrError("");
    setCnrImportResult(null);
  }

  // Checks our own database first (a case already on file), then falls back to eCourts —
  // and on an eCourts hit, saves it into our database immediately so the next lookup for
  // this CNR is served from our own records instead of hitting eCourts again.
  function handleImportCnr() {
    const query = cnr.trim();
    if (!query) return;

    const dbMatch = allCases.find((c) => {
      if (c.id === editingCase?.id) return false;
      return (c.caseDetails?.cnr || "").toLowerCase() === query.toLowerCase();
    });
    if (dbMatch) {
      setPartyNames(dbMatch.title);
      setCaseNo(dbMatch.caseDetails?.caseNumber || "");
      setJourney(getCourtHistory(dbMatch));
      setCnrImportResult({ status: "found", source: "database", title: dbMatch.title });
      return;
    }

    const ecourtMatch =
      searchCourtCases({ method: "CNR Number", query }).find(
        (m) => m.cnrNumber.toLowerCase() === query.toLowerCase(),
      ) ?? null;

    if (!ecourtMatch) {
      setCnrImportResult({ status: "not-found" });
      return;
    }

    const hearings = ecourtMatch.historyOfCaseHearings || [];
    setPartyNames(ecourtMatch.title);
    setCaseNo(ecourtMatch.caseNumber);
    setJourney(hearings.map((h, i) => ({ ...h, id: `h_${i}` })));

    if (editingCase) {
      const today = todayISO();
      const updatedCases = allCases.map((c) =>
        c.id === editingCase.id
          ? {
              ...c,
              title: ecourtMatch.title,
              source: "ecourt" as const,
              caseDetails: {
                ...(c.caseDetails || {}),
                caseNumber: ecourtMatch.caseNumber,
                cnr: query,
                historyOfCaseHearings: hearings,
                hearingCount: hearings.length,
              },
              updatedAt: today,
            }
          : c,
      );
      saveCases(updatedCases);
    }

    setCnrImportResult({ status: "found", source: "ecourts", title: ecourtMatch.title });
  }

  function handleApprove(c: LegalCase) {
    caseService
      .updateCaseStage(c.id, { stage: "accepted" })
      .catch((err: unknown) => console.warn("[Stage Update] Server notice:", err));
    updateCaseStatus(c.id, "Assigned", "Lawyer approved and accepted the case");
  }

  function handleReject(c: LegalCase) {
    if (confirm(`Reject case ${c.id} (${c.title})? The citizen will be notified.`)) {
      caseService
        .updateCaseStage(c.id, {
          stage: "rejected",
          rejectionReason: "Lawyer declined to take up the case",
        })
        .catch((err: unknown) => console.warn("[Stage Update] Server notice:", err));
      updateCaseStatus(c.id, "Rejected", "Lawyer declined to take up the case");
    }
  }

  function handleSaveCase() {
    const nameCheck = validateName(partyNames);
    if (!nameCheck.isValid) {
      setPartyNameError(nameCheck.error || "Party name is required.");
      return;
    }
    setPartyNameError("");

    if (caseStatus === "CNR Generated") {
      const cnrCheck = validateCNR(cnr);
      if (!cnrCheck.isValid) {
        setCnrError(cnrCheck.error || "CNR number is required.");
        return;
      }
    }
    setCnrError("");

    const today = todayISO();
    const historyOfCaseHearings = journey.map(({ id: _id, ...h }) => h);

    if (editingCase) {
      const targetCaseId = editingCase.id;
      const statusChanged = editingCase.status !== caseStatus;
      const trimmedTitle = partyNames.trim();
      const trimmedCaseNo = caseNo.trim();
      const trimmedCnr = cnr.trim();
      const updatedCases = allCases.map((c) => {
        if (c.id !== targetCaseId) return c;
        const timeline = statusChanged
          ? [
              ...(c.timeline || []),
              {
                id: `t_${Date.now()}`,
                status: caseStatus as CaseStatus,
                at: today,
                time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
                note: `Status updated to ${STATUS_META[caseStatus]?.label ?? caseStatus}`,
              },
            ]
          : c.timeline;
        return {
          ...c,
          title: trimmedTitle,
          caseDetails: {
            ...(c.caseDetails || {}),
            caseNumber: trimmedCaseNo,
            cnr: trimmedCnr,
            historyOfCaseHearings,
            hearingCount: historyOfCaseHearings.length,
          },
          status: caseStatus as CaseStatus,
          timeline,
          updatedAt: today,
        };
      });
      saveCases(updatedCases);

      // Persist changes to backend server
      caseService
        .updateCase(targetCaseId, {
          title: trimmedTitle,
          cnr: trimmedCnr || undefined,
          status: caseStatus,
        })
        .catch((err: unknown) => console.warn("[Case Edit] Server notice:", err));
    }

    setDialogOpen(false);
  }

  function handleDeleteCase() {
    if (!editingCase) return;
    if (confirm("Delete this case permanently? This cannot be undone.")) {
      const targetCaseId = editingCase.id;
      const updated = allCases.filter((x) => x.id !== targetCaseId);
      saveCases(updated);
      setDialogOpen(false);

      // Persist deletion to backend server
      caseService
        .deleteCase(targetCaseId)
        .catch((err: unknown) => console.warn("[Case Delete] Server notice:", err));
    }
  }

  function closeAttachmentsModal() {
    setAttachmentsCaseId(null);
    setPreviewDoc(null);
    setPreviewFullScreen(false);
    setAttachmentTab("citizen_submitted");
    setAttachmentError("");
    setIsDragging(false);
  }

  const attachmentsCase = attachmentsCaseId
    ? allCases.find((c) => c.id === attachmentsCaseId) ||
      cases.find((c) => c.id === attachmentsCaseId) ||
      null
    : null;

  const attachmentsFilterStatus = attachmentsCase
    ? (STORED_STATUS_TO_FILTER[attachmentsCase.status] ?? attachmentsCase.status)
    : "";

  const isCaseAccepted = Boolean(
    attachmentsCase &&
      (attachmentsFilterStatus === "Accepted by Lawyer" ||
        attachmentsCase.status === "Assigned" ||
        attachmentsCase.status === "Under Review" ||
        attachmentsCase.status === "Awaiting Documents" ||
        (attachmentsCase.status as string)?.toLowerCase() === "accepted" ||
        (attachmentsCase.status !== "Submitted" &&
          attachmentsCase.status !== "Rejected" &&
          attachmentsCase.status !== "Pending" &&
          Boolean(attachmentsCase.lawyerId || attachmentsCase.lawyerName))),
  );

  async function handleAddAttachments(
    input: React.ChangeEvent<HTMLInputElement> | FileList | File[],
  ) {
    if (!isLawyer && isCaseAccepted) return;
    const files = Array.isArray(input)
      ? input
      : "target" in input
        ? Array.from(input.target.files ?? [])
        : Array.from(input);

    if ("target" in input && input.target) {
      input.target.value = "";
    }
    if (files.length === 0 || !attachmentsCaseId) return;

    const oversized = files.find((f) => f.size > MAX_ATTACHMENT_BYTES);
    if (oversized) {
      setAttachmentError(`"${oversized.name}" is too large — please pick files under 4MB.`);
      return;
    }

    setAttachmentError("");
    setIsUploadingAttachment(true);
    try {
      const uploadDate = todayISO();
      const uploaderRole: "citizen" | "lawyer" = isLawyer ? "lawyer" : "citizen";
      const docs: CaseDocument[] = await Promise.all(
        files.map(async (f, i) => {
          let cloudUrl = "";
          try {
            const uploadRes = await storageService.uploadFile(f, {
              bucket: "case-documents",
              folder: `cases/${attachmentsCaseId}`,
            });
            if (uploadRes?.fileUrl) {
              cloudUrl = uploadRes.fileUrl;
            }
          } catch (uploadErr) {
            console.warn("[CasesTable] Cloud upload fallback to local:", uploadErr);
          }

          const fileDataUrl = cloudUrl || (await readFileAsDataUrl(f));

          return {
            id: `d_${Date.now()}_${i}`,
            name: f.name,
            size: formatFileSize(f.size),
            uploadedAt: uploadDate,
            fileDataUrl,
            fileMimeType: f.type || undefined,
            uploadedBy: uploaderRole,
          };
        }),
      );
      addCaseAttachments(attachmentsCaseId, docs);
      const freshCases = getCases();
      setAllCases(freshCases);
      const updatedTarget = freshCases.find((c) => c.id === attachmentsCaseId);
      if (updatedTarget && onCaseUpdate) {
        onCaseUpdate(updatedTarget);
      }

      // Persist attachments to backend cases_user.documents
      const allDocs = Array.isArray(updatedTarget?.files)
        ? updatedTarget.files
        : Array.isArray(updatedTarget?.files?.files)
          ? updatedTarget.files.files
          : docs;
      const userDocs = allDocs.filter((d) => !d.id?.startsWith("imp_doc_"));
      const docMap = new Map<string, any>();
      userDocs.forEach((d) => {
        const key = d.id || `${d.name}_${d.fileDataUrl || (d as any).fileUrl}`;
        docMap.set(key, d);
      });
      const backendPayloadDocs = Array.from(docMap.values()).map((d) => ({
        id: d.id,
        name: d.name,
        fileUrl: d.fileDataUrl || (d as any).fileUrl || "",
        size: d.size,
        fileMimeType: d.fileMimeType,
        uploadedAt: d.uploadedAt,
        uploadedBy:
          d.uploadedBy === "lawyer" || (d as any).uploaderRole === "lawyer"
            ? ("lawyer" as const)
            : ("citizen" as const),
      }));

      try {
        await caseService.updateCase(attachmentsCaseId, {
          documents: backendPayloadDocs,
        });
      } catch (backendErr) {
        console.warn("[CasesTable] Backend documents update notice:", backendErr);
        try {
          const newBackendDocs = docs.map((d) => ({
            id: d.id,
            name: d.name,
            fileUrl: d.fileDataUrl || (d as any).fileUrl || "",
            size: d.size,
            fileMimeType: d.fileMimeType,
            uploadedAt: d.uploadedAt,
            uploadedBy: d.uploadedBy || uploaderRole,
          }));
          await caseService.addAttachments(attachmentsCaseId, newBackendDocs);
        } catch (fallbackErr) {
          console.warn("[CasesTable] Backend addAttachments fallback notice:", fallbackErr);
        }
      }
    } catch (err) {
      console.error("Failed to add attachment:", err);
      setAttachmentError("Failed to add attachment. Please try again.");
    } finally {
      setIsUploadingAttachment(false);
    }
  }

  const today = todayISO();
  const sortedModalJourney = [...journey].sort((a, b) =>
    (a.hearingDate ?? a.businessOnDate ?? "9999").localeCompare(
      b.hearingDate ?? b.businessOnDate ?? "9999",
    ),
  );
  // Part 2 of the case journey (Lawyer to Court) shaped like eCourts' own
  // "Case History" table — Judge / Business on Date / Hearing Date / Purpose
  // of Listing — per case_structure.json's historyOfCaseHearings. Each entry
  // already carries its own `businessOnDate`, stored or set on CNR import.
  const courtHistoryRows = sortedModalJourney;

  const totalPages = Math.max(1, Math.ceil(cases.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageCases = cases.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <>
      {/* Case Cards */}
      {cases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-xs text-muted-foreground">
          <h3 className="text-sm font-semibold text-foreground">No matching cases</h3>
          <p className="mt-1">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pageCases.map((c) => {
            const liveCase = allCases.find((ac) => ac.id === c.id) || c;
            const entry = getNextEntry(liveCase);
            const isPendingDecision = isLawyer && liveCase.status === "Submitted";
            const attachmentCount = Array.isArray(liveCase.files)
              ? liveCase.files.length
              : (liveCase.files?.files?.length ?? 0);
            const formattedTitle = formatCaseVsTitle(liveCase);
            const titleVsParts = formattedTitle.split(/\s+vs\s+/i);

            return (
              <div
                key={c.id}
                className={`relative flex h-full min-h-64 flex-col justify-between overflow-hidden rounded-2xl border p-4.5 shadow-2xs sm:p-5 ${
                  isPendingDecision
                    ? "border-amber-500/40 bg-gradient-to-b from-amber-500/[0.06] via-surface to-surface"
                    : "border-border/70 bg-gradient-to-b from-surface via-surface/98 to-surface/90"
                }`}
              >
                {isPendingDecision && (
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-90" />
                )}

                <div className="space-y-3.5">
                  {/* Title & Badges Header */}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-base font-bold text-foreground leading-snug tracking-tight">
                        {titleVsParts.length === 2 ? (
                          <>
                            <span>{titleVsParts[0]}</span>
                            <span className="mx-1.5 inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-primary align-middle">
                              VS
                            </span>
                            <span className="text-foreground/90">{titleVsParts[1]}</span>
                          </>
                        ) : (
                          formattedTitle
                        )}
                      </h3>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5 self-start sm:self-auto">
                      <CaseTypeBadge caseItem={c} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>

                  {/* Metadata Chips Grid */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-bold text-primary shadow-2xs">
                      <Hash className="h-3 w-3" />
                      {c.caseDetails?.caseNumber && c.caseDetails.caseNumber !== c.id
                        ? c.caseDetails.caseNumber
                        : c.id}
                    </span>
                    {c.caseDetails?.courtName && (
                      <span
                        className="inline-flex max-w-[220px] items-center gap-1 truncate rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground shadow-2xs sm:max-w-xs"
                        title={c.caseDetails.courtName}
                      >
                        <Landmark className="h-3 w-3 shrink-0 text-primary/70" />
                        <span className="truncate">{c.caseDetails.courtName}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 font-mono text-[11px] text-muted-foreground shadow-2xs">
                      CNR:{" "}
                      <span
                        className={
                          c.caseDetails?.cnr
                            ? "font-bold text-foreground"
                            : "font-normal text-muted-foreground/60"
                        }
                      >
                        {c.caseDetails?.cnr || "N/A"}
                      </span>
                    </span>
                    {c.citizenName && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background/80 px-2.5 py-1 text-[11px] text-muted-foreground shadow-2xs">
                        <User className="h-3 w-3 text-primary/70" />
                        Client:{" "}
                        <span className="font-semibold text-foreground">{c.citizenName}</span>
                      </span>
                    )}
                  </div>

                  {/* Next Hearing Strip */}
                  {entry && (
                    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/[0.04] to-transparent p-3 text-xs text-foreground shadow-2xs">
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-primary" />
                      <div className="flex items-start gap-2.5 pl-1">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                          <CalendarClock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="font-bold text-foreground text-[12px]">
                              Next Hearing: {fmtDate(entry.hearingDate ?? entry.businessOnDate)}
                            </span>
                          </div>
                          {entry.purposeOfListing && (
                            <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-muted-foreground">
                              {entry.purposeOfListing}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Action Bar */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                  <div className="text-[11px] text-muted-foreground">
                    {attachmentCount > 0 ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        <Paperclip className="h-3 w-3" /> {attachmentCount} attachment
                        {attachmentCount > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/50 font-medium">No attachments</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isPendingDecision ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApprove(c)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--md-extended-color-success)]/15 px-3 py-1.5 text-xs font-bold text-[var(--md-extended-color-success)] hover:bg-[var(--md-extended-color-success)]/25 transition-all duration-150 cursor-pointer shadow-2xs"
                          title="Approve case"
                        >
                          <Check className="h-3.5 w-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(c)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--md-sys-color-error)]/15 px-3 py-1.5 text-xs font-bold text-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error)]/25 transition-all duration-150 cursor-pointer shadow-2xs"
                          title="Reject case"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Decline</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {!isLawyer && (
                          <IconButton
                            variant="tonal"
                            title={c.lawyerName ? `Rate Lawyer (${c.lawyerName})` : "Rate Lawyer"}
                            ariaLabel={`Rate lawyer for case ${c.id}`}
                            onClick={() => handleOpenRatingModal(c)}
                          >
                            <Star className="h-4 w-4 text-[var(--md-extended-color-warning)] fill-[var(--md-extended-color-warning)]" />
                          </IconButton>
                        )}
                        <IconButton
                          variant="tonal"
                          title={isLawyer ? "Edit case" : "View case details"}
                          ariaLabel={
                            isLawyer ? `Edit case ${c.id}` : `View details for case ${c.id}`
                          }
                          onClick={() => handleOpenModal(c)}
                        >
                          {isLawyer ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      variant="tonal"
                      title={`Attachments${attachmentCount > 0 ? ` (${attachmentCount})` : ""}`}
                      ariaLabel={`Manage attachments for case ${liveCase.id}`}
                      onClick={() => setAttachmentsCaseId(liveCase.id)}
                    >
                      <Paperclip className="h-4 w-4" />
                    </IconButton>
                    {(isLawyer || c.lawyerName) && <ChatButton caseItem={c} role={role} />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cases.length > 0 && (
        <div className="mt-4">
          <CardPagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        </div>
      )}

      {/* Courts Datalist */}
      <datalist id="courtsList">
        {COURTS_FLAT.map((c, i) => (
          <option key={i} value={c.name} label={`${c.type} · ${c.location}`} />
        ))}
      </datalist>

      {/* Custom Scrim + Modal Dialog (Bypasses shadow-DOM width capping, exact HTML match) */}
      {dialogOpen &&
        createPortal(
          <div
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex h-screen w-screen min-h-[100dvh] items-start justify-center bg-black/60 p-4 sm:p-6 overflow-y-auto backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDialogOpen(false);
            }}
          >
            <div className="my-6 w-full max-w-[720px] rounded-[28px] bg-[var(--md-sys-color-surface-container-low,#f5f3f7)] shadow-2xl border border-border/80 overflow-hidden text-foreground">
              {/* Dialog Head */}
              <div className="flex items-start justify-between gap-4 p-6 pb-2">
                <div>
                  <h2 className="text-2xl font-normal text-foreground leading-snug">
                    {formatCaseVsTitle(partyNames || editingCase)}
                  </h2>
                  <div className="font-mono text-xs text-primary mt-1 font-medium">
                    {cnr ? `CNR ${cnr}` : caseNo || "—"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Dialog Body */}
              <div className="p-6 pt-2 max-h-[66vh] overflow-y-auto space-y-4">
                {/* Section: Case Identity */}
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
                    CASE IDENTITY
                  </div>

                  {isLawyer ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Party Names (Letters Only) <span className="text-destructive">*</span>
                        </label>
                        <input
                          value={partyNames}
                          onChange={(e) => {
                            setPartyNames(sanitizeName(e.target.value));
                            setPartyNameError("");
                          }}
                          placeholder="e.g. Y L N R Vs. NSF"
                          className={`h-11 rounded-lg border px-3.5 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary ${
                            partyNameError
                              ? "border-destructive bg-destructive/5"
                              : "border-border bg-card"
                          }`}
                        />
                        {partyNameError && (
                          <p className="text-[10.5px] font-medium text-destructive">
                            {partyNameError}
                          </p>
                        )}
                      </div>

                      <div className="sm:col-span-2 flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-muted-foreground">
                          Case Status
                        </label>
                        <select
                          value={caseStatus}
                          onChange={(e) => setCaseStatus(e.target.value)}
                          className="h-11 rounded-lg border border-border bg-card px-3.5 text-sm text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                          {STATUS_LIST.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_META[s].label}
                            </option>
                          ))}
                        </select>
                        <div className="text-xs text-muted-foreground mt-1">
                          {STATUS_META[caseStatus]?.meaning}
                        </div>
                      </div>

                      {caseStatus === "CNR Generated" && (
                        <div className="sm:col-span-2 flex flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-muted-foreground">
                              CNR No. (16 Alphanumeric Characters){" "}
                              <span className="text-destructive">*</span>
                            </label>
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {cnr.length} / 16
                            </span>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <input
                              value={cnr}
                              onChange={(e) => handleCnrChange(sanitizeCNR(e.target.value))}
                              placeholder="e.g. TSHC010011342025"
                              maxLength={16}
                              className={`h-11 flex-1 rounded-lg border px-3.5 text-sm text-foreground font-mono outline-hidden focus:border-primary focus:ring-1 focus:ring-primary uppercase ${
                                cnrError
                                  ? "border-destructive bg-destructive/5"
                                  : "border-border bg-card"
                              }`}
                            />
                            <div className="flex shrink-0 gap-2">
                              <Button
                                variant="tonal"
                                icon={<Download className="h-4 w-4" />}
                                onClick={handleImportCnr}
                                disabled={cnr.length !== 16}
                              >
                                Import
                              </Button>
                            </div>
                          </div>
                          {cnrError ? (
                            <p className="text-[10.5px] font-medium text-destructive">{cnrError}</p>
                          ) : cnr && cnr.length !== 16 ? (
                            <p className="text-[10.5px] font-medium text-amber-600 dark:text-amber-400">
                              CNR number must be exactly 16 characters (e.g., TSHC010011342025).
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="sm:col-span-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Party Names
                          </span>
                          <div className="text-base font-semibold text-foreground mt-0.5">
                            {formatCaseVsTitle(partyNames || editingCase)}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Case No.
                          </span>
                          <div className="text-sm font-mono font-medium text-foreground mt-0.5">
                            {caseNo || "—"}
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            CNR No.
                          </span>
                          <div className="text-sm font-mono font-medium text-foreground mt-0.5">
                            {cnr || "—"}
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            Case Status
                          </span>
                          <div className="mt-1">
                            <StatusBadge status={caseStatus} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section: Stage History — shown to both roles while the case is still in the pre-CNR pipeline */}
                {editingCase &&
                  PRE_CNR_STAGES.includes(STORED_STATUS_TO_FILTER[caseStatus] ?? caseStatus) && (
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
                        STAGE HISTORY
                      </div>
                      <div className="relative border-l-2 border-border ml-3 space-y-3.5 pl-6 py-1">
                        {getStageHistory(editingCase).map((stage) => (
                          <div key={stage.key} className="relative">
                            <span
                              className={`absolute -left-[29px] top-0.5 h-[14px] w-[14px] rounded-full border-2 ${
                                stage.at
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/50 bg-card"
                              }`}
                            />
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={`text-xs font-semibold ${
                                  stage.isCurrent
                                    ? "text-primary"
                                    : stage.at
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                }`}
                              >
                                {stage.label}
                                {stage.isCurrent && (
                                  <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-primary">
                                    Current
                                  </span>
                                )}
                              </span>
                              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                                {stage.at
                                  ? `${fmtDate(stage.at)}${stage.time ? ", " + stage.time : ""}`
                                  : "—"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {(STORED_STATUS_TO_FILTER[caseStatus] ?? caseStatus) === "CNR Generated" && (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              isLawyer
                                ? { to: "/lawyer/cases/$id", params: { id: editingCase.id } }
                                : { to: "/citizen/cases/$id", params: { id: editingCase.id } },
                            )
                          }
                          className="mt-3.5 inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          View Details <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                {/* Section: Case Roadmap — Part 2 of the case journey (Lawyer to
                  Court), shaped like eCourts' own case-history table.
                  Citizen view only. */}
                {!isLawyer && (
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">
                      CASE ROADMAP
                    </div>

                    {courtHistoryRows.length === 0 ? (
                      <div className="text-xs text-muted-foreground italic py-2">
                        No hearings logged yet.
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-border ml-3 space-y-4 pl-6 py-1">
                        {[...courtHistoryRows].reverse().map((e) => {
                          const idx = courtHistoryRows.findIndex((x) => x.id === e.id);
                          const filterKey = STORED_STATUS_TO_FILTER[caseStatus] ?? caseStatus;
                          const ACTIVE_STATUSES = [
                            "Pending by Lawyer",
                            "Accepted by Lawyer",
                            "Registered",
                            "Pending",
                          ];
                          const caseClosed = !ACTIVE_STATUSES.includes(filterKey);
                          const isLast = idx === courtHistoryRows.length - 1;
                          const isClosedEntry = caseClosed && isLast;
                          const effectiveDate = e.hearingDate ?? e.businessOnDate;
                          const isPast = effectiveDate < today && !isClosedEntry;

                          const closedLabel =
                            STATUS_META[filterKey]?.label ??
                            STATUS_META[caseStatus]?.label ??
                            "CLOSED";

                          const badgeLabel = isClosedEntry ? closedLabel : isPast ? "Past" : "Next";

                          let cardStyle = "border-border bg-card text-foreground";
                          let dotStyle = "border-muted-foreground bg-card";
                          let badgeStyle = "bg-[#e6e0e9] text-[#49454f]";

                          if (isClosedEntry) {
                            cardStyle = "border-[#2e6e3e] bg-[#D9F2DD] text-[#0B3818]";
                            dotStyle = "border-[#2e6e3e] bg-[#D9F2DD]";
                            badgeStyle = "bg-[#2e6e3e] text-white";
                          } else if (!isPast) {
                            cardStyle = "border-primary bg-[#EADDFF] text-[#21005D]";
                            dotStyle = "border-primary bg-[#EADDFF]";
                            badgeStyle = "bg-primary text-white";
                          }

                          return (
                            <div key={e.id} className="relative">
                              <span
                                className={`absolute -left-[35px] top-3.5 h-[18px] w-[18px] rounded-full border-2 ${dotStyle}`}
                              />

                              <div
                                className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 ${cardStyle}`}
                              >
                                <div className="space-y-1 text-xs">
                                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11.5px]">
                                    <div>
                                      <span className="opacity-70">Business on Date:</span>{" "}
                                      <span className="font-mono font-semibold">
                                        {fmtDate(e.businessOnDate)}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="opacity-70">Hearing Date:</span>{" "}
                                      <span className="font-mono font-semibold">
                                        {e.hearingDate ? fmtDate(e.hearingDate) : "—"}
                                      </span>
                                    </div>
                                  </div>
                                  {e.judge && (
                                    <div className="text-[12px]">
                                      <span className="opacity-70">Judge:</span> {e.judge}
                                    </div>
                                  )}
                                  {e.purposeOfListing && (
                                    <div className="leading-relaxed text-[12.5px]">
                                      <span className="opacity-70">Purpose of Listing:</span>{" "}
                                      {e.purposeOfListing}
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col items-end gap-2 shrink-0">
                                  <span
                                    className={`rounded-md px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider ${badgeStyle}`}
                                  >
                                    {badgeLabel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dialog Actions */}
              <div className="flex items-center justify-between p-6 pt-3 border-t border-border/80">
                <div>
                  {isLawyer && (
                    <Button variant="text" onClick={handleDeleteCase} className="text-destructive">
                      Delete Case
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="text" onClick={() => setDialogOpen(false)}>
                    {isLawyer ? "Cancel" : "Close"}
                  </Button>
                  {isLawyer && <Button onClick={handleSaveCase}>Save Case</Button>}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* CNR Import Result Popup — nested above the edit dialog */}
      {cnrImportResult &&
        createPortal(
          <div
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[110] flex h-screen w-screen min-h-[100dvh] items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setCnrImportResult(null);
            }}
          >
            <div className="w-full max-w-sm rounded-2xl bg-[var(--md-sys-color-surface-container-low,#f5f3f7)] shadow-2xl border border-border/80 p-6 text-foreground">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    cnrImportResult.status === "found"
                      ? "bg-[var(--md-extended-color-success)]/10 text-[var(--md-extended-color-success)]"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {cnrImportResult.status === "found" ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <X className="h-5 w-5" />
                  )}
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {cnrImportResult.status === "found" ? "Case Imported" : "No Match Found"}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {cnrImportResult.status === "found" && cnrImportResult.source === "database" ? (
                  <>
                    Already in our database — matched <strong>"{cnrImportResult.title}"</strong>. No
                    need to fetch from eCourts.
                  </>
                ) : cnrImportResult.status === "found" ? (
                  <>
                    Fetched from eCourts and saved to our database — matched{" "}
                    <strong>"{cnrImportResult.title}"</strong>. The next import for this CNR will be
                    served from our records instead of eCourts.
                  </>
                ) : (
                  "No matching case found in our database or eCourts for this CNR."
                )}
              </p>
              <div className="mt-5 flex justify-end">
                <Button onClick={() => setCnrImportResult(null)}>OK</Button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Attachments Modal with 4 Tabs */}
      {attachmentsCase &&
        createPortal(
          (() => {
            const allAttachedDocs: CaseDocument[] = Array.isArray(attachmentsCase.files)
              ? attachmentsCase.files
              : Array.isArray(attachmentsCase.files?.files)
                ? attachmentsCase.files.files
                : [];
            const isLawyerDoc = (d: CaseDocument) =>
              (d.uploadedBy || (d as any).uploaderRole || (d as any).uploaded_by || "")
                ?.toString()
                .trim()
                .toLowerCase() === "lawyer";
            const isCitizenDoc = (d: CaseDocument) => !isLawyerDoc(d);

            // Tab 1: Citizen Submitted ('the files which are shared by user during case registration')
            const citizenSubmittedDocs: CaseDocument[] = allAttachedDocs.filter(isCitizenDoc);

            // Tab 2: Lawyer Uploaded ('the files uploaded by lawyer when case is in progress')
            const lawyerUploadedDocs: CaseDocument[] = allAttachedDocs.filter(isLawyerDoc);

            // Tab 3: Citizen Shared ('the files which are shared during case chat with lawyer')
            const citizenSharedDocs: CaseDocument[] = caseChatMessages
              .filter((m) => Boolean(m.attachmentUrl) && m.sender === "citizen")
              .map(chatMessageToDocument);

            // Tab 4: Lawyer Shared ('the files which are shared during case chat with citizen')
            const lawyerSharedDocs: CaseDocument[] = caseChatMessages
              .filter((m) => Boolean(m.attachmentUrl) && m.sender === "lawyer")
              .map(chatMessageToDocument);

            const isCitizenViewer = !isLawyer;
            const caseStatusLower = (attachmentsCase.status || "").toString().trim().toLowerCase();
            const currentStageKey = (
              attachmentsFilterStatus ||
              STORED_STATUS_TO_FILTER[attachmentsCase.status] ||
              attachmentsCase.status ||
              ""
            ).toString().trim();
            const isCasePendingByLawyer =
              currentStageKey === "Pending by Lawyer" ||
              currentStageKey.toLowerCase() === "pending by lawyer" ||
              caseStatusLower === "submitted" ||
              caseStatusLower === "pending" ||
              (attachmentsCase as any).stage === "Pending by Lawyer" ||
              (attachmentsCase as any).currentStage === "Pending by Lawyer";
            const isPendingRestricted = isCitizenViewer && isCasePendingByLawyer;

            const renderPendingByLawyerMessage = () => (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-10 text-center space-y-3.5 animate-in fade-in duration-200">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto ring-1 ring-amber-500/20">
                  <Lock className="h-6 w-6" />
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                    files visible only after case accepted
                  </p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                    This case is currently under stage{" "}
                    <span className="font-semibold text-foreground">[Pending by Lawyer]</span>. Files
                    will become visible once the case is accepted.
                  </p>
                </div>
                <div className="pt-1 flex items-center justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/25">
                    <Lock className="h-3 w-3" />
                    Stage: Pending by Lawyer
                  </span>
                </div>
              </div>
            );

            const chatTargetRoute =
              role === "citizen"
                ? `/citizen/chat/${attachmentsCase.id}`
                : `/lawyer/chat/${attachmentsCase.id}`;

            const renderDocItem = (d: CaseDocument, badgeLabel: string, badgeStyle: string) => {
              const isImage =
                d.fileMimeType?.startsWith("image/") ||
                /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(d.name);
              const isAudio =
                d.fileMimeType?.startsWith("audio/") ||
                /\.(webm|mp3|wav|ogg|m4a|aac)$/i.test(d.name);

              return (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {isImage ? (
                        <ImageIcon className="h-4.5 w-4.5" />
                      ) : isAudio ? (
                        <Mic className="h-4.5 w-4.5" />
                      ) : (
                        <FileText className="h-4.5 w-4.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div
                        className="truncate text-xs font-semibold text-foreground"
                        title={d.name}
                      >
                        {d.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                        <span>
                          {d.size} · {d.uploadedAt}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-medium",
                            badgeStyle,
                          )}
                        >
                          {badgeLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewDoc(d);
                        setPreviewFullScreen(false);
                      }}
                      title="Preview"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <a
                      href={
                        d.fileDataUrl ??
                        `data:text/plain;charset=utf-8,${encodeURIComponent(d.name)}`
                      }
                      download={d.fileDataUrl ? d.name : `${d.name}.txt`}
                      title="Download"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </div>
                </li>
              );
            };

            const TABS: {
              id: AttachmentTab;
              label: string;
              count: number;
              icon: React.ReactNode;
              hint: string;
            }[] = [
              {
                id: "citizen_submitted",
                label: "Citizen Submitted",
                count: citizenSubmittedDocs.length,
                icon: <FileText className="h-3.5 w-3.5 shrink-0" />,
                hint: "Files shared by user during case registration",
              },
              {
                id: "lawyer_uploaded",
                label: "Lawyer Uploaded",
                count: isPendingRestricted ? 0 : lawyerUploadedDocs.length,
                icon: isPendingRestricted ? (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <UploadCloud className="h-3.5 w-3.5 shrink-0" />
                ),
                hint: isPendingRestricted
                  ? "files visible only after case accepted"
                  : "Files uploaded by lawyer when case is in progress",
              },
              {
                id: "citizen_shared",
                label: "Citizen Shared",
                count: isPendingRestricted ? 0 : citizenSharedDocs.length,
                icon: isPendingRestricted ? (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                ),
                hint: isPendingRestricted
                  ? "files visible only after case accepted"
                  : "Files shared during case chat with lawyer",
              },
              {
                id: "lawyer_shared",
                label: "Lawyer Shared",
                count: isPendingRestricted ? 0 : lawyerSharedDocs.length,
                icon: isPendingRestricted ? (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                ) : (
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                ),
                hint: isPendingRestricted
                  ? "files visible only after case accepted"
                  : "Files shared during case chat with citizen",
              },
            ];

            return (
              <div
                className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] flex h-screen w-screen min-h-[100dvh] items-center justify-center bg-black/60 p-3 sm:p-6 overflow-y-auto backdrop-blur-sm animate-in fade-in duration-150"
                onClick={(e) => {
                  if (e.target === e.currentTarget) closeAttachmentsModal();
                }}
              >
                <div className="my-auto flex max-h-[92vh] w-full max-w-[760px] flex-col rounded-[28px] bg-[var(--md-sys-color-surface-container-low,#f5f3f7)] shadow-2xl border border-border/80 overflow-hidden text-foreground">
                  {/* Modal Header */}
                  <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-3 shrink-0 border-b border-border/60">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug tracking-tight">
                        Case Attachments
                      </h2>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-foreground/90">
                          {attachmentsCase.title || "Untitled Matter"}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-primary">
                          {attachmentsCase.id}
                        </span>
                        {attachmentsCase.caseDetails?.cnr && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[11px] text-muted-foreground">
                              CNR: {attachmentsCase.caseDetails.cnr}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={closeAttachmentsModal}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* 4 Tabs Bar — Full length names auto-adjusting to next line */}
                  <div className="px-5 sm:px-6 pt-3 pb-2 shrink-0">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-surface rounded-2xl border border-border/80 shadow-2xs items-stretch">
                      {TABS.map((t) => {
                        const isActive = attachmentTab === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setAttachmentTab(t.id)}
                            className={cn(
                              "flex h-full min-h-[50px] items-center justify-between gap-2 p-2.5 sm:px-3 sm:py-2.5 rounded-xl transition-all cursor-pointer text-left",
                              isActive
                                ? "bg-primary text-white shadow-sm ring-1 ring-primary/30"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                            )}
                            title={t.hint}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span
                                className={cn(
                                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors",
                                  isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-primary/10 text-primary",
                                )}
                              >
                                {t.icon}
                              </span>
                              <span className="text-xs font-bold leading-tight whitespace-normal break-words">
                                {t.label}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ml-1 self-center",
                                isActive
                                  ? "bg-white/25 text-white"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {t.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Modal Body with 4 Tab Panels */}
                  <div className="p-5 sm:p-6 pt-2 overflow-y-auto space-y-4 min-h-0 flex-1">
                    {/* ── TAB 1: Citizen Submitted ─────────────────────── */}
                    {attachmentTab === "citizen_submitted" && (
                      <div className="space-y-4">
                        {/* Info Banner */}
                        <div className="rounded-xl bg-teal-500/10 border border-teal-500/20 p-3 text-xs flex items-start gap-2.5">
                          <FileText className="h-4 w-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">
                              Citizen Submitted Registration Files
                            </p>
                            <p className="text-muted-foreground text-[11px] mt-0.5">
                              The files and initial documents shared by the user during case
                              registration &amp; booking.
                            </p>
                          </div>
                        </div>

                        {/* Case Description */}
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1.5">
                            Case Description
                          </div>
                          <div className="rounded-2xl border border-border bg-card p-3.5 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                            {attachmentsCase.description || "No description provided."}
                          </div>
                        </div>

                        {/* Document List */}
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
                            Submitted Documents ({citizenSubmittedDocs.length})
                          </div>
                          {citizenSubmittedDocs.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                              <p className="text-xs text-muted-foreground italic">
                                No registration documents were submitted by citizen.
                              </p>
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {citizenSubmittedDocs.map((d) =>
                                renderDocItem(
                                  d,
                                  "Citizen Submitted",
                                  "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20",
                                ),
                              )}
                            </ul>
                          )}
                        </div>

                        {/* Add Attachment — citizen only before case acceptance */}
                        {!isLawyer && (
                          <div className="rounded-2xl bg-[var(--md-sys-color-surface-container,#efedf1)] p-4 space-y-2.5">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                              Add Registration Attachment
                            </div>
                            <input
                              ref={addAttachmentInputRef}
                              type="file"
                              multiple
                              accept="application/pdf,image/*,.doc,.docx,.txt"
                              className="hidden"
                              onChange={handleAddAttachments}
                              disabled={isCaseAccepted}
                            />
                            <Button
                              variant="tonal"
                              icon={<Paperclip className="h-4 w-4" />}
                              onClick={() => {
                                if (isCaseAccepted) return;
                                addAttachmentInputRef.current?.click();
                              }}
                              disabled={isUploadingAttachment || isCaseAccepted}
                            >
                              {isUploadingAttachment ? "Uploading…" : "Add Attachment"}
                            </Button>
                            {isCaseAccepted && (
                              <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                                <MessageSquare className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                                <div className="flex-1 space-y-1.5">
                                  <p className="font-medium text-foreground leading-relaxed">
                                    Your case is accepted by lawyer so you can share messages and
                                    documents from chat.
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      closeAttachmentsModal();
                                      navigate({ to: chatTargetRoute });
                                    }}
                                    className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline cursor-pointer text-xs"
                                  >
                                    <MessageSquare className="h-3.5 w-3.5" />
                                    <span>Open Case Chat</span>
                                  </button>
                                </div>
                              </div>
                            )}
                            {attachmentError && (
                              <p className="text-[11px] font-semibold text-destructive">
                                {attachmentError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── TAB 2: Lawyer Uploaded ───────────────────────── */}
                    {attachmentTab === "lawyer_uploaded" && (
                      <div className="space-y-4">
                        {isPendingRestricted ? (
                          renderPendingByLawyerMessage()
                        ) : (
                          <>
                            {/* Info Banner */}
                            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs flex items-start gap-2.5">
                              <UploadCloud className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                              <div className="flex-1">
                                <p className="font-semibold text-foreground">
                                  Lawyer Uploaded Documents
                                </p>
                                <p className="text-muted-foreground text-[11px] mt-0.5">
                                  The files uploaded by lawyer when case is in progress (e.g. draft
                                  petitions, vakalatnama, filing receipts, evidence photos).
                                </p>
                              </div>
                            </div>

                            {/* Lawyer Upload Feature */}
                            {isLawyer && (
                              <div className="rounded-2xl bg-[var(--md-sys-color-surface-container,#efedf1)] p-4 space-y-2.5 border border-border/70">
                                <div className="flex items-center justify-between">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                    Upload Document or Image
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    PDF, Images, DOCX (Max 4MB)
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Attach your filings, draft petitions, vakalatnama, evidence photos, or
                                  case notes for this matter.
                                </p>
                                <input
                                  ref={lawyerUploadInputRef}
                                  type="file"
                                  multiple
                                  accept="application/pdf,image/*,.doc,.docx,.txt"
                                  className="hidden"
                                  onChange={handleAddAttachments}
                                />
                                <div
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                  }}
                                  onDragLeave={() => setIsDragging(false)}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files) {
                                      handleAddAttachments(e.dataTransfer.files);
                                    }
                                  }}
                                  onClick={() => lawyerUploadInputRef.current?.click()}
                                  className={cn(
                                    "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors bg-card",
                                    isDragging
                                      ? "border-primary bg-primary/5"
                                      : "border-border hover:border-primary/50 hover:bg-muted/30",
                                  )}
                                >
                                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                                    <Upload className="h-6 w-6" />
                                  </div>
                                  <p className="text-sm font-semibold text-foreground">
                                    Click to upload or drag &amp; drop
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    PDF, DOC, DOCX, TXT or Images (PNG, JPG, WEBP)
                                  </p>
                                </div>
                                {attachmentError && (
                                  <p className="text-[11px] font-semibold text-destructive">
                                    {attachmentError}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Lawyer Documents List */}
                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
                                Case Progress Documents ({lawyerUploadedDocs.length})
                              </div>
                              {lawyerUploadedDocs.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                                  <p className="text-xs text-muted-foreground italic">
                                    No documents uploaded by lawyer yet.
                                    {isLawyer &&
                                      " Use the upload area above to attach filings or draft petitions."}
                                  </p>
                                </div>
                              ) : (
                                <ul className="space-y-2">
                                  {lawyerUploadedDocs.map((d) =>
                                    renderDocItem(
                                      d,
                                      "Lawyer Uploaded",
                                      "bg-primary/10 text-primary border border-primary/20",
                                    ),
                                  )}
                                </ul>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* ── TAB 3: Citizen Shared (Chat) ─────────────────── */}
                    {attachmentTab === "citizen_shared" && (
                      <div className="space-y-4">
                        {isPendingRestricted ? (
                          renderPendingByLawyerMessage()
                        ) : (
                          <>
                            {/* Info Banner */}
                            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs flex items-start justify-between gap-2.5">
                              <div className="flex items-start gap-2.5">
                                <MessageSquare className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-semibold text-foreground">
                                    Citizen Shared in Case Chat
                                  </p>
                                  <p className="text-muted-foreground text-[11px] mt-0.5">
                                    The files which are shared during case chat with lawyer.
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  closeAttachmentsModal();
                                  navigate({ to: chatTargetRoute });
                                }}
                                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs shrink-0 cursor-pointer"
                              >
                                <span>Open Chat</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Loading or Document List */}
                            {isLoadingChatMessages ? (
                              <div className="flex items-center justify-center py-10 gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span>Loading consultation files…</span>
                              </div>
                            ) : citizenSharedDocs.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto">
                                  <MessageSquare className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-foreground">
                                    No files shared by citizen in chat yet
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                                    Any documents, pictures, or voice notes shared by the citizen in
                                    case chat will automatically appear here.
                                  </p>
                                </div>
                                <Button
                                  variant="tonal"
                                  icon={<MessageSquare className="h-4 w-4" />}
                                  onClick={() => {
                                    closeAttachmentsModal();
                                    navigate({ to: chatTargetRoute });
                                  }}
                                >
                                  Go to Case Chat
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
                                  Chat Files from Citizen ({citizenSharedDocs.length})
                                </div>
                                <ul className="space-y-2">
                                  {citizenSharedDocs.map((d) =>
                                    renderDocItem(
                                      d,
                                      "Citizen Shared",
                                      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* ── TAB 4: Lawyer Shared (Chat) ──────────────────── */}
                    {attachmentTab === "lawyer_shared" && (
                      <div className="space-y-4">
                        {isPendingRestricted ? (
                          renderPendingByLawyerMessage()
                        ) : (
                          <>
                            {/* Info Banner */}
                            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-3 text-xs flex items-start justify-between gap-2.5">
                              <div className="flex items-start gap-2.5">
                                <MessageCircle className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-semibold text-foreground">
                                    Lawyer Shared in Case Chat
                                  </p>
                                  <p className="text-muted-foreground text-[11px] mt-0.5">
                                    The files which are shared during case chat with citizen.
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  closeAttachmentsModal();
                                  navigate({ to: chatTargetRoute });
                                }}
                                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline text-xs shrink-0 cursor-pointer"
                              >
                                <span>Open Chat</span>
                                <ExternalLink className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Loading or Document List */}
                            {isLoadingChatMessages ? (
                              <div className="flex items-center justify-center py-10 gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                <span>Loading consultation files…</span>
                              </div>
                            ) : lawyerSharedDocs.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center space-y-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mx-auto">
                                  <MessageCircle className="h-6 w-6" />
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-foreground">
                                    No files shared by lawyer in chat yet
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-1 max-w-sm mx-auto">
                                    Any documents, pictures, or voice notes shared by the lawyer in case
                                    chat will automatically appear here.
                                  </p>
                                </div>
                                <Button
                                  variant="tonal"
                                  icon={<MessageCircle className="h-4 w-4" />}
                                  onClick={() => {
                                    closeAttachmentsModal();
                                    navigate({ to: chatTargetRoute });
                                  }}
                                >
                                  Go to Case Chat
                                </Button>
                              </div>
                            ) : (
                              <div>
                                <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
                                  Chat Files from Lawyer ({lawyerSharedDocs.length})
                                </div>
                                <ul className="space-y-2">
                                  {lawyerSharedDocs.map((d) =>
                                    renderDocItem(
                                      d,
                                      "Lawyer Shared",
                                      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
                                    ),
                                  )}
                                </ul>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end p-5 sm:p-6 pt-3 border-t border-border/80 shrink-0">
                    <Button variant="text" onClick={closeAttachmentsModal}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            );
          })(),
          document.body,
        )}

      {/* Attachment Preview Modal — nested above the Attachments modal */}
      {previewDoc &&
        createPortal(
          <div
            className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[110] flex h-screen w-screen min-h-[100dvh] items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setPreviewDoc(null);
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
                    {previewDoc.fileMimeType?.startsWith("image/") ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </span>
                  <span
                    className="truncate text-xs font-bold text-foreground"
                    title={previewDoc.name}
                  >
                    {previewDoc.name}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openDocumentInNewTab({
                        title: previewDoc.name,
                        fileName: previewDoc.name,
                        fileDataUrl: previewDoc.fileDataUrl,
                        fileMimeType: previewDoc.fileMimeType,
                      })
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 hover:bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary transition-all cursor-pointer shadow-2xs"
                    title="Full Screen (Open document in new tab)"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span>Full Screen</span>
                  </button>
                  <IconButton ariaLabel="Close preview" onClick={() => setPreviewDoc(null)}>
                    <X className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-muted/30 p-4 sm:p-6">
                <DocumentPreviewBody
                  fileDataUrl={previewDoc.fileDataUrl}
                  fileMimeType={previewDoc.fileMimeType}
                  fileName={previewDoc.name}
                  showFullScreenButton={false}
                  fallback={
                    docLooksLikeImage(previewDoc) ? (
                      <div className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-xl border border-border bg-background p-6 shadow-sm">
                        <div className="flex h-56 w-full items-center justify-center rounded-lg border border-dashed border-border bg-linear-to-br from-muted to-muted/50">
                          <ImageIcon className="h-12 w-12 text-muted-foreground/60" />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-foreground">{previewDoc.name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {previewDoc.size} · Uploaded {previewDoc.uploadedAt}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="mx-auto max-w-2xl space-y-6 rounded-xl border border-border bg-background p-8 text-foreground shadow-sm">
                        <div className="flex items-center justify-between border-b border-border pb-4">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Case Attachment
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {previewDoc.size}
                          </span>
                        </div>

                        <div className="space-y-1 py-2 text-center">
                          <h4 className="text-sm font-bold uppercase tracking-wide text-foreground">
                            {docDisplayTitle(previewDoc)}
                          </h4>
                          <p className="font-mono text-xs text-muted-foreground">
                            Uploaded {previewDoc.uploadedAt}
                            {previewDoc.uploadedBy ? ` · by ${previewDoc.uploadedBy}` : ""}
                          </p>
                        </div>

                        <div className="space-y-4 text-xs leading-relaxed text-foreground/90">
                          <p className="rounded-xl border border-border/50 bg-muted/40 p-4 font-sans">
                            This document was submitted as part of the case record for{" "}
                            <strong>{previewDoc.name}</strong>. It forms supporting evidence
                            relevant to the matter and has been indexed for reference by both the
                            citizen and the assigned Lawyer.
                          </p>
                          <p>
                            1. All statements and enclosures contained herein are submitted in good
                            faith and are subject to verification by the concerned authority.
                          </p>
                          <p>
                            2. Parties are advised to review the complete original file — available
                            via Download — before relying on this document at any hearing.
                          </p>
                        </div>

                        <div className="flex items-end justify-between border-t border-border pt-6 text-[11px] text-muted-foreground">
                          <div>
                            <p className="font-bold text-foreground">ATTACHMENT RECORD</p>
                            <p>{previewDoc.name}</p>
                          </div>
                          <div className="text-right font-mono">
                            <p>CloseUrCase FILE</p>
                            <p>ADDED {previewDoc.uploadedAt}</p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* ── Lawyer Rating Popup Dialog ─────────────────────────────────── */}
      <Dialog
        open={ratingCase !== null}
        onOpenChange={(open) => !open && setRatingCase(null)}
        maxWidth="480px"
      >
        {ratingCase &&
          (() => {
            const activeRatingLawyer = lawyers.find(
              (l) =>
                (ratingCase.lawyerId && l.id === ratingCase.lawyerId) ||
                (ratingCase.lawyerName &&
                  l.name.toLowerCase() === ratingCase.lawyerName.toLowerCase()),
            );

            return (
              <>
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-base font-bold text-foreground">
                      Rate Lawyer
                    </DialogTitle>
                    <IconButton ariaLabel="Close" onClick={() => setRatingCase(null)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </IconButton>
                  </div>
                </DialogHeader>

                <DialogContent className="space-y-4 pt-1">
                  {/* Lawyer summary */}
                  <div className="flex items-center gap-3 rounded-2xl border border-border/80 bg-muted/30 p-3">
                    <UserAvatar
                      name={activeRatingLawyer?.name || ratingCase.lawyerName || "Lawyer"}
                      photoUrl={activeRatingLawyer?.photoUrl}
                      size="md"
                      role="lawyer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="truncate text-sm font-bold text-foreground">
                          {activeRatingLawyer?.name || ratingCase.lawyerName || "Unassigned"}
                        </h4>
                        {activeRatingLawyer && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            {activeRatingLawyer.rating.toFixed(1)} (
                            {activeRatingLawyer.ratingCount ?? 0})
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {activeRatingLawyer?.category || ratingCase.category} Law
                        {activeRatingLawyer?.city ? ` · ${activeRatingLawyer.city}` : ""}
                      </p>
                      <p className="truncate font-mono text-[10.5px] text-primary/80 mt-0.5">
                        Case: {ratingCase.id}
                      </p>
                    </div>
                  </div>

                  {!activeRatingLawyer && !ratingCase.lawyerName ? (
                    <p className="text-xs text-muted-foreground py-2">
                      No lawyer has been assigned to this case yet. You can rate the lawyer once
                      assigned.
                    </p>
                  ) : (
                    <>
                      {/* Rating selector (0 - 5 Stars) */}
                      <div className="space-y-2 rounded-2xl border border-border/80 bg-card p-3.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Your Rating (0 - 5)
                          </label>
                          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                            {ratingScore} / 5
                          </span>
                        </div>

                        {/* Interactive Stars 1 to 5 */}
                        <div className="flex items-center justify-center gap-1.5 py-1">
                          {[1, 2, 3, 4, 5].map((starVal) => {
                            const isFilled =
                              (hoveredScore !== null ? hoveredScore : ratingScore) >= starVal;
                            return (
                              <button
                                key={starVal}
                                type="button"
                                onClick={() => setRatingScore(starVal)}
                                onMouseEnter={() => setHoveredScore(starVal)}
                                onMouseLeave={() => setHoveredScore(null)}
                                className="p-1 rounded-lg hover:bg-amber-500/10 hover:scale-115 transition-all cursor-pointer"
                                title={`${starVal} Star${starVal > 1 ? "s" : ""}`}
                              >
                                <Star
                                  className={`h-8 w-8 transition-colors ${
                                    isFilled
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/30 fill-transparent"
                                  }`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Review comments text field */}
                      <div className="space-y-1">
                        <TextField
                          label="Review / Feedback Comments"
                          type="textarea"
                          rows={3}
                          value={ratingFeedback}
                          onChange={setRatingFeedback}
                          placeholder="Write your feedback or review about this lawyer..."
                          supportingText="Optional comments to help improve legal services"
                          className="w-full"
                        />
                      </div>
                    </>
                  )}
                </DialogContent>

                <DialogFooter className="flex items-center justify-end gap-2 px-6 pb-5 pt-2">
                  <Button variant="text" onClick={() => setRatingCase(null)}>
                    Cancel
                  </Button>
                  {activeRatingLawyer || ratingCase.lawyerName ? (
                    <Button variant="filled" onClick={handleSubmitRating}>
                      Submit Rating
                    </Button>
                  ) : null}
                </DialogFooter>
              </>
            );
          })()}
      </Dialog>
    </>
  );
}
