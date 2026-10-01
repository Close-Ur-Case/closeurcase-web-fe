import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  UploadCloud,
  MessageSquare,
  MessageCircle,
  Eye,
  Download,
  Image as ImageIcon,
  Mic,
  CheckSquare,
  Square,
  AlertCircle,
  Check,
  Maximize2,
  Minimize2,
  FileCheck,
  AlignLeft,
  FolderOpen,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "@/components/m3";
import { DocxPreview } from "@/components/app/DocumentPreview";
import { chatService } from "@/services/chatService";
import { formatDateTime } from "@/lib/dateUtils";
import type { LegalCase, CaseDocument } from "@/types";

export type AttachmentTab =
  | "citizen_submitted"
  | "lawyer_uploaded"
  | "citizen_shared"
  | "lawyer_shared"
  | "affidavits";

interface LocalChatMessage {
  id: string;
  caseId: string;
  sender: "citizen" | "lawyer";
  senderName?: string;
  text?: string;
  timestamp?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: string;
}

export interface CaseAttachmentsSelectorModalProps {
  isOpen: boolean;
  caseItem: LegalCase | null;
  onConfirm: (selectedDocs: CaseDocument[]) => void;
  onCancel: () => void;
  initialSelectedIds?: string[];
}

export function CaseAttachmentsSelectorModal({
  isOpen,
  caseItem,
  onConfirm,
  onCancel,
  initialSelectedIds,
}: CaseAttachmentsSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<AttachmentTab>("citizen_submitted");
  const [citizenSubTab, setCitizenSubTab] = useState<"description" | "files">("files");
  const [copiedDesc, setCopiedDesc] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [caseChatMessages, setCaseChatMessages] = useState<LocalChatMessage[]>([]);
  const [previewDoc, setPreviewDoc] = useState<CaseDocument | null>(null);
  const [previewFullScreen, setPreviewFullScreen] = useState(false);
  const initializedCaseIdRef = useRef<string | null>(null);

  // Sync consultation chat messages when caseItem changes
  useEffect(() => {
    if (!caseItem?.id || !isOpen) {
      setCaseChatMessages([]);
      return;
    }

    const loadLocalChat = () => {
      try {
        const raw = localStorage.getItem("cuc_case_chats_v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setCaseChatMessages(parsed.filter((m: any) => m.caseId === caseItem.id));
          }
        }
      } catch (err) {
        console.warn("[CaseAttachmentsSelectorModal] Local chat read error:", err);
      }
    };

    loadLocalChat();

    let active = true;
    chatService
      .getMessages(caseItem.id)
      .then((remoteMsgs) => {
        if (!active || !Array.isArray(remoteMsgs)) return;
        const formatted: LocalChatMessage[] = remoteMsgs.map((rm: any) => ({
          id: rm.id,
          caseId: rm.caseId,
          sender: (rm.sender || rm.senderRole || "citizen") as "citizen" | "lawyer",
          senderName: rm.senderName || (rm.sender === "lawyer" ? "Lawyer" : "Citizen"),
          text: rm.text || rm.messageText || rm.message || undefined,
          timestamp: rm.timestamp || rm.createdAt || rm.at || new Date().toISOString(),
          attachmentUrl: rm.attachmentUrl || undefined,
          attachmentName: rm.attachmentName || undefined,
          attachmentSize: rm.attachmentSize || undefined,
        }));
        setCaseChatMessages((prev) => {
          const combined = [...prev, ...formatted];
          const map = new Map<string, LocalChatMessage>();
          combined.forEach((m) => {
            if (m.id) map.set(m.id, m);
          });
          return Array.from(map.values());
        });
      })
      .catch((err) => {
        console.warn("[CaseAttachmentsSelectorModal] Chat fetch notice:", err);
      });

    return () => {
      active = false;
    };
  }, [caseItem?.id, isOpen]);

  // Convert ChatMessage to CaseDocument
  const chatMessageToDocument = (m: LocalChatMessage): CaseDocument => {
    const url = m.attachmentUrl || "";
    const name = m.attachmentName || url.split("/").pop() || "Chat_Attachment";
    const ext = name.split(".").pop()?.toLowerCase() || "";
    let fileMimeType = "application/octet-stream";
    if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
      fileMimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;
    } else if (ext === "pdf") {
      fileMimeType = "application/pdf";
    } else if (["doc", "docx"].includes(ext)) {
      fileMimeType = "application/msword";
    } else if (["mp3", "wav", "ogg", "m4a", "webm"].includes(ext)) {
      fileMimeType = `audio/${ext}`;
    }

    return {
      id: `chat-${m.id}`,
      name,
      size: m.attachmentSize || "Shared in chat",
      fileMimeType,
      uploadedAt: m.timestamp
        ? formatDateTime(m.timestamp)
        : "Chat",
      fileDataUrl: url,
      uploadedBy: m.sender === "lawyer" ? "lawyer" : "citizen",
    };
  };

  // Extract docs for each tab
  const {
    citizenSubmittedDocs,
    lawyerUploadedDocs,
    citizenSharedDocs,
    lawyerSharedDocs,
    affidavitDocs,
    allDocs,
  } = useMemo(() => {
    if (!caseItem) {
      return {
        citizenSubmittedDocs: [],
        lawyerUploadedDocs: [],
        citizenSharedDocs: [],
        lawyerSharedDocs: [],
        affidavitDocs: [],
        allDocs: [],
      };
    }

      const allAttachedDocs: CaseDocument[] = Array.isArray(caseItem.files)
        ? caseItem.files
        : Array.isArray(caseItem.files?.files)
          ? caseItem.files.files
          : [];

      const isAffidavitDoc = (d: CaseDocument) =>
        Boolean(d.isAffidavit || (d as any).is_affidavit);
      const isLawyerDoc = (d: CaseDocument) =>
        !isAffidavitDoc(d) &&
        (d.uploadedBy || (d as any).uploaderRole || (d as any).uploaded_by || "")
          ?.toString()
          .trim()
          .toLowerCase() === "lawyer";
      const isCitizenDoc = (d: CaseDocument) => !isAffidavitDoc(d) && !isLawyerDoc(d);

      // Tab 1: Citizen Submitted ('the files which are shared by user during case registration')
      let tab1Docs: CaseDocument[] = allAttachedDocs.filter(isCitizenDoc);

      // If the case was registered without uploaded attachments, provide a synthesized registration document
      // so Tab 1 always contains the client's case registration submission.
      if (tab1Docs.length === 0) {
        tab1Docs = [
          {
            id: `reg-summary-${caseItem.id}`,
            name: `Case_Registration_Brief_${caseItem.id}.pdf`,
            size: "24 KB",
            uploadedAt: caseItem.createdAt
              ? formatDateTime(caseItem.createdAt)
              : "Registration",
            fileMimeType: "application/pdf",
            uploadedBy: "citizen",
          },
        ];
      }

      // Tab 2: Lawyer Uploaded ('the files uploaded by lawyer when case is in progress')
      const tab2Docs: CaseDocument[] = allAttachedDocs.filter(isLawyerDoc);

      // Tab 3: Citizen Shared ('the files which are shared during case chat with lawyer')
      const tab3Docs: CaseDocument[] = caseChatMessages
        .filter((m) => Boolean(m.attachmentUrl) && m.sender === "citizen")
        .map(chatMessageToDocument);

      // Tab 4: Lawyer Shared ('the files which are shared during case chat with citizen')
      const tab4Docs: CaseDocument[] = caseChatMessages
        .filter((m) => Boolean(m.attachmentUrl) && m.sender === "lawyer")
        .map(chatMessageToDocument);

      // Tab 5: Affidavits ('sworn legal affidavits attached to this case')
      const tab5Docs: CaseDocument[] = allAttachedDocs.filter(isAffidavitDoc);

      const allMerged = [...tab1Docs, ...tab2Docs, ...tab3Docs, ...tab4Docs, ...tab5Docs];

      return {
        citizenSubmittedDocs: tab1Docs,
        lawyerUploadedDocs: tab2Docs,
        citizenSharedDocs: tab3Docs,
        lawyerSharedDocs: tab4Docs,
        affidavitDocs: tab5Docs,
        allDocs: allMerged,
      };
    }, [caseItem, caseChatMessages]);

  const descDocId = `case_desc_${caseItem?.id || "default"}`;
  const isDescSelected = selectedIds.has(descDocId);

  const toggleDescSelection = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(descDocId)) {
        next.delete(descDocId);
      } else {
        next.add(descDocId);
      }
      return next;
    });
  };

  const caseDescriptionDoc: CaseDocument | null = useMemo(() => {
    if (!caseItem?.description) return null;
    return {
      id: descDocId,
      name: `Case_Description_${caseItem.id}.txt`,
      fileDataUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(caseItem.description)}`,
      fileMimeType: "text/plain",
      size: `${Math.max(1, Math.round(new Blob([caseItem.description]).size / 1024))} KB`,
      uploadedAt: formatDateTime(
        caseItem.createdAt || caseItem.caseDetails?.filingDate || new Date().toISOString(),
      ),
      uploadedBy: "citizen",
    };
  }, [
    caseItem?.id,
    caseItem?.description,
    caseItem?.createdAt,
    caseItem?.caseDetails?.filingDate,
    descDocId,
  ]);

  // Requirement: Default select all files in tab 1 + Case Description
  useEffect(() => {
    if (!isOpen || !caseItem) {
      initializedCaseIdRef.current = null;
      return;
    }

    if (initializedCaseIdRef.current !== caseItem.id) {
      initializedCaseIdRef.current = caseItem.id;
      setActiveTab("citizen_submitted");

      if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelectedIds(new Set(initialSelectedIds));
      } else {
        // Requirement: Initially deselect all checkboxes
        setSelectedIds(new Set());
      }
    }
  }, [isOpen, caseItem, initialSelectedIds]);

  if (!isOpen || !caseItem) return null;

  const toggleDoc = (docId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
      } else {
        next.add(docId);
      }
      return next;
    });
  };

  const getDocsForCurrentTab = (): CaseDocument[] => {
    switch (activeTab) {
      case "citizen_submitted":
        return citizenSubmittedDocs;
      case "lawyer_uploaded":
        return lawyerUploadedDocs;
      case "citizen_shared":
        return citizenSharedDocs;
      case "lawyer_shared":
        return lawyerSharedDocs;
      case "affidavits":
        return affidavitDocs;
    }
  };

  const currentTabDocs = getDocsForCurrentTab();
  const currentTabSelectedCount = currentTabDocs.filter((d) => selectedIds.has(d.id)).length;
  const isCurrentTabAllSelected =
    currentTabDocs.length > 0 && currentTabSelectedCount === currentTabDocs.length;

  const handleToggleSelectAllInTab = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentTabAllSelected) {
        // Deselect all in current tab
        currentTabDocs.forEach((d) => next.delete(d.id));
      } else {
        // Select all in current tab
        currentTabDocs.forEach((d) => next.add(d.id));
      }
      return next;
    });
  };

  const selectedTextCount = isDescSelected ? 1 : 0;
  const selectedAttachmentsCount = selectedIds.has(descDocId)
    ? selectedIds.size - 1
    : selectedIds.size;

  // Requirement: Validation [Other than Text At least 1 file (Maximun 5) must be selected to proceed]
  const canConfirm = selectedAttachmentsCount >= 1 && selectedAttachmentsCount <= 5;

  const handleOk = () => {
    if (!canConfirm) return;
    const chosenDocs = allDocs.filter((d) => selectedIds.has(d.id));
    if (isDescSelected && caseDescriptionDoc && !chosenDocs.some((d) => d.id === descDocId)) {
      chosenDocs.unshift(caseDescriptionDoc);
    }
    onConfirm(chosenDocs);
  };

  // 5 Tabs definition
  const TABS: {
    id: AttachmentTab;
    label: string;
    totalCount: number;
    selectedCount: number;
    icon: React.ReactNode;
    hint: string;
  }[] = [
    {
      id: "citizen_submitted",
      label: "Citizen Submitted",
      totalCount: citizenSubmittedDocs.length + (caseDescriptionDoc ? 1 : 0),
      selectedCount:
        citizenSubmittedDocs.filter((d) => selectedIds.has(d.id)).length +
        (isDescSelected && caseDescriptionDoc ? 1 : 0),
      icon: <FileText className="h-3.5 w-3.5 shrink-0" />,
      hint: "Files & description shared by user during case registration (default selected)",
    },
    {
      id: "lawyer_uploaded",
      label: "Lawyer Uploaded",
      totalCount: lawyerUploadedDocs.length,
      selectedCount: lawyerUploadedDocs.filter((d) => selectedIds.has(d.id)).length,
      icon: <UploadCloud className="h-3.5 w-3.5 shrink-0" />,
      hint: "Files uploaded by lawyer when case is in progress",
    },
    {
      id: "citizen_shared",
      label: "Citizen Shared",
      totalCount: citizenSharedDocs.length,
      selectedCount: citizenSharedDocs.filter((d) => selectedIds.has(d.id)).length,
      icon: <MessageSquare className="h-3.5 w-3.5 shrink-0" />,
      hint: "Files shared during case chat with lawyer",
    },
    {
      id: "lawyer_shared",
      label: "Lawyer Shared",
      totalCount: lawyerSharedDocs.length,
      selectedCount: lawyerSharedDocs.filter((d) => selectedIds.has(d.id)).length,
      icon: <MessageCircle className="h-3.5 w-3.5 shrink-0" />,
      hint: "Files shared during case chat with citizen",
    },
    {
      id: "affidavits",
      label: "Affidavits",
      totalCount: affidavitDocs.length,
      selectedCount: affidavitDocs.filter((d) => selectedIds.has(d.id)).length,
      icon: <FileCheck className="h-3.5 w-3.5 shrink-0" />,
      hint: "Sworn legal affidavits attached to this case",
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[120] flex h-screen w-screen min-h-[100dvh] items-center justify-center bg-black/65 p-3 sm:p-6 overflow-y-auto backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        // Requirement 4: Click backdrop cancels and resets dropdown
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="my-auto flex max-h-[92vh] w-full max-w-[880px] flex-col rounded-[28px] bg-[var(--md-sys-color-surface-container-low,#f5f3f7)] shadow-2xl border border-border/80 overflow-hidden text-foreground">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 pb-3 shrink-0 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground leading-snug tracking-tight">
                Case Attachments
              </h2>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Select Files to Analyze
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-1.5">
              <span className="font-semibold text-foreground/90">
                {caseItem.title || "Untitled Matter"}
              </span>
              <span>•</span>
              <span className="font-mono text-[11px] text-primary">{caseItem.id}</span>
              {caseItem.citizenName && (
                <>
                  <span>•</span>
                  <span>Client: {caseItem.citizenName}</span>
                </>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors cursor-pointer"
            title="Cancel & Reset"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 5 Tabs Bar — Responsive layout: icon + count on top, full-width label below */}
        <div className="px-5 sm:px-6 pt-3 pb-2 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-surface rounded-2xl border border-border/80 shadow-2xs items-stretch">
            {TABS.map((t, idx) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex flex-col justify-between gap-1.5 p-2.5 sm:px-3 sm:py-2.5 rounded-xl transition-all cursor-pointer text-left h-full min-h-[58px]",
                    idx === 4 ? "col-span-2 sm:col-span-1" : "col-span-1",
                    isActive
                      ? "bg-primary text-white shadow-sm ring-1 ring-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                  title={t.hint}
                >
                  {/* Top row: Icon on left, selected/total count on right */}
                  <div className="flex items-center justify-between w-full gap-1.5">
                    <span
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors",
                        isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary",
                      )}
                    >
                      {t.icon}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 min-w-[24px] transition-colors",
                        isActive
                          ? "bg-white/25 text-white"
                          : t.selectedCount > 0
                            ? "bg-primary/15 text-primary font-bold"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {t.selectedCount}/{t.totalCount}
                    </span>
                  </div>

                  {/* Bottom row: Tab name with full available width */}
                  <span className="text-xs font-semibold leading-snug line-clamp-2 break-words w-full text-left">
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub-tabs for Citizen Submitted: [case description(give checkbox to select for ai analysis ) , case files] */}
        {activeTab === "citizen_submitted" && (
          <div className="px-5 sm:px-6 pt-1 pb-2 shrink-0 flex items-center gap-2 border-b border-border/40">
            <button
              type="button"
              onClick={() => setCitizenSubTab("description")}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                citizenSubTab === "description"
                  ? "bg-primary text-white shadow-2xs"
                  : "bg-surface border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDescSelection();
                }}
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer",
                  isDescSelected
                    ? citizenSubTab === "description"
                      ? "bg-white text-primary border-white"
                      : "bg-primary text-primary-foreground border-primary"
                    : citizenSubTab === "description"
                      ? "border-white/60 bg-white/10"
                      : "border-muted-foreground/50 bg-background",
                )}
                title={isDescSelected ? "Unselect for AI Analysis" : "Select for AI Analysis"}
              >
                {isDescSelected && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <AlignLeft className="h-3.5 w-3.5" />
              <span>Case Description</span>
            </button>

            <button
              type="button"
              onClick={() => setCitizenSubTab("files")}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                citizenSubTab === "files"
                  ? "bg-primary text-white shadow-2xs"
                  : "bg-surface border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/40",
              )}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span>Case Files</span>
              <span
                className={cn(
                  "inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  citizenSubTab === "files"
                    ? "bg-white/25 text-white"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {citizenSubmittedDocs.length}
              </span>
            </button>
          </div>
        )}

        {/* Tab Body: Case Description view OR File Selection List */}
        {activeTab === "citizen_submitted" && citizenSubTab === "description" ? (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-3 min-h-[260px] max-h-[48vh] flex-1">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={toggleDescSelection}
                className="inline-flex items-center gap-2.5 group cursor-pointer select-none"
                title={isDescSelected ? "Unselect for AI Analysis" : "Select for AI Analysis"}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    isDescSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/50 bg-background group-hover:border-primary/70",
                  )}
                >
                  {isDescSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <span
                  className={cn(
                    "text-xs font-semibold transition-colors",
                    isDescSelected
                      ? "text-primary dark:text-primary-foreground font-bold"
                      : "text-foreground group-hover:text-primary",
                  )}
                >
                  Select/Unselect for Ai Analysis
                </span>
              </button>

              {caseItem.description && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(caseItem.description || "");
                    setCopiedDesc(true);
                    setTimeout(() => setCopiedDesc(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors px-2.5 py-1 rounded-lg hover:bg-muted/40 shrink-0"
                  title="Copy Case Description"
                >
                  {copiedDesc ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Description</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div
              onClick={toggleDescSelection}
              className={cn(
                "rounded-2xl border p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap select-text shadow-2xs min-h-[140px] cursor-pointer transition-all",
                isDescSelected
                  ? "border-primary/50 bg-primary/[0.03] ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-border/80",
              )}
            >
              {caseItem.description ? (
                caseItem.description
              ) : (
                <span className="text-muted-foreground italic">
                  No case description provided for this case during registration.
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Tab Subheader & Action Bar */}
            <div className="px-5 sm:px-6 py-2 shrink-0 flex items-center justify-between gap-2 border-b border-border/40 text-xs">
          <span className="text-muted-foreground">
            Check or uncheck files to include for AI processing:
          </span>
          {currentTabDocs.length > 0 && (
            <button
              type="button"
              onClick={handleToggleSelectAllInTab}
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline cursor-pointer"
            >
              {isCurrentTabAllSelected ? (
                <>
                  <Square className="h-3.5 w-3.5" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>Select All ({currentTabDocs.length})</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Modal Body with File List */}
        <div className="p-5 sm:p-6 pt-3 overflow-y-auto space-y-3 min-h-[260px] max-h-[48vh] flex-1">
          {currentTabDocs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center space-y-2">
              <p className="text-xs text-muted-foreground italic">
                {activeTab === "affidavits"
                  ? `No sworn affidavits attached to case ${caseItem.id}.`
                  : `No attachments found in this tab for ${caseItem.id}.`}
              </p>
              <p className="text-[11px] text-muted-foreground">
                You can select attachments from other tabs.
              </p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {currentTabDocs.map((d) => {
                const isSelected = selectedIds.has(d.id);
                const isImage =
                  d.fileMimeType?.startsWith("image/") ||
                  /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(d.name);
                const isAudio =
                  d.fileMimeType?.startsWith("audio/") ||
                  /\.(webm|mp3|wav|ogg|m4a|aac)$/i.test(d.name);

                return (
                  <li
                    key={d.id}
                    onClick={() => toggleDoc(d.id)}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border p-3 shadow-2xs transition-all cursor-pointer",
                      isSelected
                        ? "border-primary/50 bg-primary/[0.04] ring-1 ring-primary/20"
                        : "border-border bg-card hover:border-border/80 hover:bg-muted/30",
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Checkbox */}
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/50 bg-background",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleDoc(d.id);
                        }}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>

                      {/* Icon */}
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {isImage ? (
                          <ImageIcon className="h-4.5 w-4.5" />
                        ) : isAudio ? (
                          <Mic className="h-4.5 w-4.5" />
                        ) : (
                          <FileText className="h-4.5 w-4.5" />
                        )}
                      </span>

                      {/* File Details */}
                      <div className="min-w-0">
                        <div
                          className="truncate text-xs font-semibold text-foreground"
                          title={d.name}
                        >
                          {d.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>
                            {d.size} · {formatDateTime(d.uploadedAt)}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-medium",
                              activeTab === "affidavits"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : activeTab === "citizen_submitted"
                                  ? "bg-teal-500/10 text-teal-600 dark:text-teal-400"
                                  : activeTab === "lawyer_uploaded"
                                    ? "bg-primary/10 text-primary"
                                    : activeTab === "citizen_shared"
                                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                      : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
                            )}
                          >
                            {activeTab === "affidavits"
                              ? "Affidavit"
                              : activeTab === "citizen_submitted"
                                ? "Registration File"
                                : activeTab === "lawyer_uploaded"
                                  ? "Lawyer Upload"
                                  : activeTab === "citizen_shared"
                                    ? "Citizen Shared"
                                    : "Lawyer Shared"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preview & Download */}
                    <div
                      className="flex shrink-0 items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewDoc(d);
                          setPreviewFullScreen(false);
                        }}
                        title="Preview Document"
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
                        title="Download Document"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-black/5 hover:text-foreground transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </>
    )}

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-5 sm:p-6 pt-3 border-t border-border/80 shrink-0 bg-surface/50">
          <div className="flex items-center gap-2">
            {!canConfirm ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Other than Text At least 1 file (Maximun 5) must be selected to proceed
                {selectedAttachmentsCount > 5 && (
                  <span className="font-normal opacity-90">
                    ({selectedAttachmentsCount} files selected)
                  </span>
                )}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                <strong className="text-foreground">{selectedTextCount}</strong> text +{" "}
                <strong className="text-foreground">{selectedAttachmentsCount}</strong> attachment
                {selectedAttachmentsCount === 1 ? "" : "s"} selected
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            {/* Requirement 4: Cancel button automatically resets dropdown to Please Select Case */}
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
            {/* Requirement 3: closes only when at least 1 file selected and click OK */}
            <Button variant="filled" onClick={handleOk} disabled={!canConfirm}>
              OK
            </Button>
          </div>
        </div>
      </div>

      {/* Document Preview Portal if preview opened */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className={cn(
              "relative flex flex-col rounded-2xl bg-card border border-border shadow-2xl overflow-hidden transition-all",
              previewFullScreen
                ? "h-[96vh] w-[96vw]"
                : "h-[85vh] w-full max-w-[850px]",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <span className="font-bold text-sm truncate">{previewDoc.name}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <IconButton
                  variant="standard"
                  title={previewFullScreen ? "Exit Fullscreen" : "Fullscreen"}
                  onClick={() => setPreviewFullScreen(!previewFullScreen)}
                >
                  {previewFullScreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </IconButton>
                <IconButton
                  variant="standard"
                  title="Close preview"
                  onClick={() => setPreviewDoc(null)}
                >
                  <X className="h-5 w-5" />
                </IconButton>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-muted/20">
              {previewDoc.fileMimeType?.startsWith("image/") ? (
                <div className="flex h-full items-center justify-center">
                  <img
                    src={previewDoc.fileDataUrl || ""}
                    alt={previewDoc.name}
                    className="max-h-full max-w-full rounded-lg object-contain shadow-sm"
                  />
                </div>
              ) : previewDoc.name.endsWith(".docx") || previewDoc.name.endsWith(".doc") ? (
                <DocxPreview
                  fileDataUrl={previewDoc.fileDataUrl || ""}
                  fileName={previewDoc.name}
                />
              ) : previewDoc.fileMimeType === "application/pdf" ||
                previewDoc.name.endsWith(".pdf") ? (
                <iframe
                  src={previewDoc.fileDataUrl || ""}
                  title={previewDoc.name}
                  className="h-full w-full rounded-lg border border-border bg-white"
                />
              ) : (
                <div className="p-6 text-sm text-muted-foreground whitespace-pre-wrap font-mono">
                  {previewDoc.name} (File preview not available directly for this mime type. Use Download to view).
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
