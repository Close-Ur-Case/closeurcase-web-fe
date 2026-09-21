import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import { StatusDot } from "@/components/app/StatusDot";
import { StatusBadge } from "@/components/app/caseDocketShared";
import { UserAvatar } from "@/components/app/UserAvatar";
import { WhatsAppInlineIcon } from "@/components/app/WhatsAppButton";
import { FilterPanelButton, type FilterSection } from "@/components/app/FilterPanelButton";
import {
  getCases,
  getLawyers,
  assignLawyerToCase,
  updateCaseFields,
  subscribeToStore,
  getActiveCaseCategories,
} from "@/data/appStore";
import { caseService } from "@/services/caseService";
import type { CaseStatus, LegalCase, LegalCategory } from "@/types";
import { Search, UserCheck, X, Siren, AlertTriangle, Eye, Hash, MapPin } from "lucide-react";
import {
  TextField,
  Select,
  Button,
  IconButton,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/m3";

type CaseTab = "Assigned" | "Unassigned";

export const Route = createFileRoute("/admin/cases")({
  head: () => ({ meta: [{ title: "Manage Platform Cases — CloseUrCase" }] }),
  component: CasesPage,
});

function countBy<T extends string>(rows: LegalCase[], pick: (c: LegalCase) => T) {
  const counts = new Map<T, number>();
  rows.forEach((r) => {
    const v = pick(r);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  return counts;
}

function CasesPage() {
  const [rows, setRows] = useState<LegalCase[]>(getCases);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [tab, setTab] = useState<CaseTab>("Assigned");
  // Pagination — set to 8 rows per page
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  useEffect(() => {
    const sync = () => setRows(getCases());
    return subscribeToStore(sync);
  }, []);

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
      label: "Legal Category",
      options: Array.from(categoryCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, label: `${value} Law`, count })),
    },
    {
      key: "status",
      label: "Case Status",
      options: Array.from(statusCounts.entries()).map(([value, count]) => ({
        value,
        label: value,
        count,
      })),
    },
  ];

  const assignedCases = rows.filter((r) => r.lawyerId);
  const unassignedCases = rows.filter((r) => !r.lawyerId);
  const tabCases = tab === "Assigned" ? assignedCases : unassignedCases;

  const filtered = tabCases
    .filter((r) =>
      Object.entries(filters).every(
        ([key, values]) =>
          values.length === 0 || values.includes(String(r[key as keyof LegalCase])),
      ),
    )
    .filter((r) => {
      if (!search.trim()) return true;
      const haystack = `${r.id} ${r.title} ${r.citizenName} ${r.lawyerName || ""} ${r.city} ${r.createdAt} ${r.status} ${r.emergencyReason || ""}`;
      return haystack.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      // Pin unassigned emergency cases to the top, then assigned emergency cases, then normal cases
      const aScore = a.isEmergency && !a.lawyerId ? 2 : a.isEmergency ? 1 : 0;
      const bScore = b.isEmergency && !b.lawyerId ? 2 : b.isEmergency ? 1 : 0;
      return bScore - aScore;
    });

  const selectedCase = selectedId ? rows.find((r) => r.id === selectedId) : undefined;

  // Reset page when search/filters/tab change
  useEffect(() => {
    setPage(1);
  }, [search, filters, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-5 w-full">
      <PageHeader
        title="Case Management & Lawyer Assignment"
        description="Review case records, assign or reassign Lawyers to citizen cases, and override case statuses."
        actions={
          <SegmentedControl
            value={tab}
            onChange={setTab}
            options={[
              { value: "Assigned", label: `Assigned (${assignedCases.length})` },
              { value: "Unassigned", label: `Unassigned (${unassignedCases.length})` },
            ]}
          />
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-surface p-2.5 sm:p-3 shadow-2xs">
        <TextField
          value={search}
          onChange={setSearch}
          placeholder="Search by case ID, title, client, lawyer..."
          leadingIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          className="w-full sm:w-80 md:w-96 min-w-0 flex-1"
        />
        <FilterPanelButton sections={filterSections} selected={filters} onChange={setFilters} />
      </div>

      {/* Cases Cards */}
      {pageRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-xs text-muted-foreground">
          No platform cases found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {pageRows.map((r) => {
            const isOpen = selectedId === r.id;
            return (
              <div
                key={r.id}
                className={`relative flex h-full min-h-64 flex-col justify-between overflow-hidden rounded-2xl border p-4.5 shadow-2xs sm:p-5 ${
                  isOpen
                    ? "border-primary bg-primary/5 shadow-primary/10"
                    : r.isEmergency
                      ? "border-red-500/40 bg-gradient-to-b from-red-500/[0.06] via-surface to-surface"
                      : "border-border/70 bg-gradient-to-b from-surface via-surface/98 to-surface/90"
                }`}
              >
                {r.isEmergency && (
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-90 animate-pulse" />
                )}

                <div className="space-y-3.5">
                  {/* Header: ID, Badges & Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setSelectedId(r.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary hover:underline cursor-pointer shadow-2xs"
                      >
                        <Hash className="h-3 w-3" />
                        {r.id}
                      </button>
                      {r.isEmergency && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[9px] font-extrabold text-white uppercase tracking-wider shadow-2xs">
                          <AlertTriangle className="h-3 w-3 animate-pulse" />
                          Emergency
                        </span>
                      )}
                      {r.viaWhatsApp && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#25D366] px-2.5 py-0.5 text-[9px] font-extrabold text-white uppercase tracking-wider shadow-2xs">
                          <WhatsAppInlineIcon className="h-3 w-3" />
                          WhatsApp
                        </span>
                      )}
                    </div>
                    <div className="shrink-0">
                      <StatusBadge status={r.status} />
                    </div>
                  </div>

                  {/* Title & Emergency Reason */}
                  <div>
                    <h3
                      className="line-clamp-2 text-base font-bold text-foreground leading-snug tracking-tight cursor-pointer"
                      title={r.title}
                      onClick={() => setSelectedId(r.id)}
                    >
                      {r.title}
                    </h3>
                    {r.isEmergency && r.emergencyReason && (
                      <div className="mt-2 flex items-start gap-1.5 rounded-xl border border-red-500/25 bg-red-500/10 p-2.5 text-xs font-medium text-red-700 dark:text-red-300 shadow-2xs">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-600 mt-0.5" />
                        <span className="line-clamp-2">{r.emergencyReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Parties / Assigned People Grid */}
                  <div className="grid grid-cols-1 gap-2.5 rounded-xl border border-border/50 bg-background/70 p-3 sm:grid-cols-2 text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar name={r.citizenName} size="sm" role="citizen" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
                          Citizen / Petitioner
                        </div>
                        <div className="truncate font-semibold text-foreground">
                          {r.citizenName}
                        </div>
                        {r.city && (
                          <div className="flex items-center gap-0.5 text-[10px] text-muted-foreground truncate">
                            <MapPin className="h-2.5 w-2.5 shrink-0 text-primary/70" />
                            <span>{r.city}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 min-w-0 border-t border-border/40 sm:border-t-0 sm:border-l sm:border-border/40 sm:pl-3 pt-2 sm:pt-0">
                      {r.lawyerName ? (
                        <>
                          <UserAvatar name={r.lawyerName} size="sm" role="lawyer" />
                          <div className="min-w-0 flex-1">
                            <div className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
                              Assigned Advocate
                            </div>
                            <div className="truncate font-semibold text-foreground">
                              {r.lawyerName}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="min-w-0 flex-1 py-0.5">
                          <div className="text-[10px] uppercase font-extrabold text-muted-foreground tracking-wider">
                            Assigned Advocate
                          </div>
                          <span
                            className="inline-flex items-center gap-1 font-semibold text-xs italic"
                            style={{ color: "var(--md-extended-color-warning)" }}
                          >
                            Unassigned
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
                  <span className="text-[11px] font-medium text-muted-foreground font-mono">
                    Created: {r.createdAt}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-all duration-150 cursor-pointer shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Manage Case</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manage Case Modal */}
      <Dialog
        open={selectedCase != null}
        onOpenChange={(o) => !o && setSelectedId(null)}
        maxWidth="640px"
      >
        {selectedCase && (
          <>
            <DialogHeader>
              <DialogTitle className="flex w-full items-center justify-between gap-3">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className={`inline-block shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      selectedCase.isEmergency
                        ? "bg-red-600 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {selectedCase.id}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
                    {selectedCase.title}
                  </span>
                </span>
                {/* Focus sink — absorbs md-dialog's auto-focus on open */}
                <span tabIndex={0} aria-hidden="true" className="sr-only" />
                <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setSelectedId(null)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </IconButton>
              </DialogTitle>
            </DialogHeader>
            <DialogContent>
              <div className="space-y-4">
                {selectedCase.isEmergency && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900 text-xs font-semibold">
                    <Siren className="h-4 w-4 shrink-0 text-red-600 mt-0.5 animate-pulse" />
                    <div>
                      <div className="font-extrabold uppercase tracking-wide text-red-700 text-[10px]">
                        Emergency Action Required
                      </div>
                      <p className="mt-0.5 text-red-900">
                        {selectedCase.emergencyReason || "Immediate Lawyer assignment required."}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Client: <strong className="text-foreground">{selectedCase.citizenName}</strong> ·{" "}
                  {selectedCase.category} Law · {selectedCase.city}
                </p>

                <CitizenRequirementsView c={selectedCase} />

                <CaseManageControls key={selectedCase.id} c={selectedCase} />
              </div>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
          <span className="text-[11px] text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} cases
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-7 min-w-[28px] cursor-pointer rounded-lg border px-2 text-xs font-semibold transition-all ${
                  safePage === p
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CitizenRequirementsView({ c }: { c: LegalCase }) {
  const practiceArea = c.practiceArea || `${c.category} Law`;
  const specialization = c.specialization || "General Practice";
  const legalService = c.legalService || "Consultation & Representation";

  return (
    <div className="space-y-1">
      <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/80">
        Citizen Category Details (Read-Only)
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {/* Practice Area */}
        <div className="relative rounded-xl border border-primary/30 bg-background/80 px-3 py-2 shadow-2xs">
          <span className="absolute -top-2 left-2.5 bg-background px-1 text-[9.5px] font-bold text-primary">
            Practice Area*
          </span>
          <div className="text-xs font-bold text-foreground truncate pt-0.5" title={practiceArea}>
            {practiceArea}
          </div>
        </div>

        {/* Specialization */}
        <div className="relative rounded-xl border border-border/80 bg-background/80 px-3 py-2 shadow-2xs">
          <span className="absolute -top-2 left-2.5 bg-background px-1 text-[9.5px] font-bold text-muted-foreground">
            Specialization*
          </span>
          <div className="text-xs font-bold text-foreground truncate pt-0.5" title={specialization}>
            {specialization}
          </div>
        </div>

        {/* Legal Service */}
        <div className="relative rounded-xl border border-border/80 bg-background/80 px-3 py-2 shadow-2xs">
          <span className="absolute -top-2 left-2.5 bg-background px-1 text-[9.5px] font-bold text-muted-foreground">
            Legal Service
          </span>
          <div className="text-xs font-bold text-foreground truncate pt-0.5" title={legalService}>
            {legalService}
          </div>
        </div>
      </div>
    </div>
  );
}

function CaseManageControls({ c }: { c: LegalCase }) {
  const isUnassigned = !c.lawyerId;

  const [approvedLawyers, setApprovedLawyers] = useState(() =>
    getLawyers().filter((l) => l.status === "Approved"),
  );
  const [managedCategories, setManagedCategories] = useState(() => getActiveCaseCategories());

  useEffect(() => {
    return subscribeToStore(() => {
      setApprovedLawyers(getLawyers().filter((l) => l.status === "Approved"));
      setManagedCategories(getActiveCaseCategories());
    });
  }, []);

  const [category, setCategory] = useState<LegalCategory>(c.category);
  const [lawyerId, setLawyerId] = useState(c.lawyerId ?? "");

  const sortedLawyers = useMemo(
    () =>
      [...approvedLawyers].sort((a, b) => {
        const aMatch = a.category === category ? 0 : 1;
        const bMatch = b.category === category ? 0 : 1;
        return aMatch - bMatch || a.name.localeCompare(b.name);
      }),
    [approvedLawyers, category],
  );

  function handleSave() {
    if (!isUnassigned || !lawyerId) return;
    const lawyer = approvedLawyers.find((l) => l.id === lawyerId);
    if (!lawyer) return;
    if (category !== c.category) {
      updateCaseFields(c.id, { category });
    }
    assignLawyerToCase(c.id, lawyer.id, lawyer.name);
    caseService
      .assignLawyer(c.id, lawyer.id)
      .catch((err: unknown) => console.warn("[Assign Lawyer] Server notice:", err));
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
        <UserCheck className="h-4 w-4 text-emerald-600" />
        <span>Assigned Lawyer</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {isUnassigned
          ? "Set the case type and assign a Lawyer. Both are locked once this case is assigned."
          : "Lawyer assignment is locked from this panel."}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Case Type"
          value={category}
          onChange={(v) => setCategory(v as LegalCategory)}
          disabled={!isUnassigned}
          options={managedCategories.map((cat) => ({ value: cat.name, label: `${cat.name} Law` }))}
        />
        <Select
          label="Assign Lawyer"
          value={lawyerId}
          onChange={setLawyerId}
          disabled={!isUnassigned}
          options={[
            { value: "", label: "-- Unassigned --" },
            ...sortedLawyers.map((l) => ({
              value: l.id,
              label: `${l.name} — ${l.category}`,
            })),
          ]}
        />
      </div>

      <div className="flex justify-end">
        <Button disabled={!isUnassigned || !lawyerId} onClick={handleSave}>
          Save Lawyer
        </Button>
      </div>
    </div>
  );
}
