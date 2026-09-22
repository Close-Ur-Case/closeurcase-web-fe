import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { CaseListCard } from "@/components/app/CaseListCard";
import { CardPagination } from "@/components/app/CardPagination";
import { ImportCaseModal } from "@/components/app/ImportCaseModal";
import { CaseDocketRegister } from "@/components/app/CaseDocketRegister";
import { ExpandableFilterChips } from "@/components/app/ExpandableFilterChips";
import { FilterPanelButton, type FilterSection } from "@/components/app/FilterPanelButton";
import { SegmentedControl } from "@/components/app/SegmentedControl";
import { getCases, getLawyers, subscribeToStore } from "@/data/appStore";
import type { LegalCase } from "@/types";
import { Search, Download } from "lucide-react";
import { Button, TextField } from "@/components/m3";

type CaseTab = "Assigned" | "Imported";

export function CasesListView() {
  const [rows, setRows] = useState<LegalCase[]>(getCases);
  const [lawyersList, setLawyersList] = useState(getLawyers);
  const [tab, setTab] = useState<CaseTab>("Assigned");
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("All");
  // Universal filter panel for Respondent — matches the admin Users page's
  // multi-select-with-counts filter pattern. Petitioner Name stays untouched.
  const [respondentFilters, setRespondentFilters] = useState<string[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    const sync = () => {
      setRows(getCases());
      setLawyersList(getLawyers());
    };
    return subscribeToStore(sync);
  }, []);

  function selectTab(next: CaseTab) {
    setTab(next);
    setClientFilter("All");
    setRespondentFilters([]);
    setPage(1);
  }

  const currentLawyer = lawyersList.find((l) => l.id === "l_001") || lawyersList[0];
  const myCases = rows.filter(
    (c) => c.lawyerId === "l_001" || c.lawyerName === currentLawyer?.name,
  );

  const assignedCases = myCases.filter((c) => c.source !== "ecourt");
  const importedCases = myCases.filter((c) => c.source === "ecourt");
  const bySource = tab === "Imported" ? importedCases : assignedCases;

  const clients = Array.from(new Set(bySource.map((c) => c.citizenName))).sort();
  const respondents = Array.from(
    new Set(bySource.flatMap((c) => c.caseDetails.respondents)),
  ).sort();

  const respondentCounts = new Map<string, number>();
  bySource.forEach((c) =>
    c.caseDetails.respondents.forEach((resp) =>
      respondentCounts.set(resp, (respondentCounts.get(resp) ?? 0) + 1),
    ),
  );
  const respondentSections: FilterSection[] = [
    {
      key: "respondent",
      label: "Respondent",
      options: respondents.map((r) => ({
        value: r,
        label: r,
        count: respondentCounts.get(r) ?? 0,
      })),
    },
  ];

  const filtered = bySource.filter((r) => {
    const matchesSearch =
      `${r.id} ${r.title} ${r.citizenName} ${r.city} ${r.caseDetails.caseNumber ?? ""} ${r.caseDetails.courtName ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase());
    const matchesClient = clientFilter === "All" || r.citizenName === clientFilter;
    const matchesRespondent =
      respondentFilters.length === 0 ||
      r.caseDetails.respondents.some((resp) => respondentFilters.includes(resp));
    return matchesSearch && matchesClient && matchesRespondent;
  });

  // Reset to page 1 whenever the filtered set changes shape (search/filter/tab).
  useEffect(() => {
    setPage(1);
  }, [filtered.length, tab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageCases = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Cases"
        description="Track cases assigned to you and cases imported from eCourts."
        actions={
          <SegmentedControl
            value={tab}
            onChange={selectTab}
            options={[
              { value: "Assigned", label: `Assigned (${assignedCases.length})` },
              { value: "Imported", label: `Imported (${importedCases.length})` },
            ]}
          />
        }
      />

      {tab === "Assigned" ? (
        <CaseDocketRegister role="lawyer" />
      ) : (
        <div className="space-y-6">
          {/* Mobile: Import/Search Case stays on top, chips come next, search + filter
              share the bottom row, just above the list. Desktop: search + filter share
              one row up top (left), the button sits at the far right of that same row,
              chips underneath. All pieces live in one flex-wrap row so `order` can
              rearrange them per breakpoint without rendering the search field twice. */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-surface p-2.5 sm:p-3 shadow-2xs">
            <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-1 sm:max-w-lg min-w-0">
              <TextField
                value={search}
                onChange={setSearch}
                placeholder="Search party name, court, case no..."
                leadingIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                className="w-full sm:w-80 md:w-96 min-w-0 flex-1"
              />
              {respondents.length > 0 && (
                <FilterPanelButton
                  sections={respondentSections}
                  selected={{ respondent: respondentFilters }}
                  onChange={(next) => setRespondentFilters(next.respondent ?? [])}
                />
              )}
            </div>

            <Button
              icon={<Download className="h-4 w-4" />}
              onClick={() => setImportOpen(true)}
              className="w-full sm:w-auto shrink-0"
            >
              Import from eCourts
            </Button>
          </div>

          {/* Petitioner Name filter */}
          {clients.length > 0 && (
            <ExpandableFilterChips
              label="Petitioner Name"
              options={["All", ...clients]}
              selected={clientFilter}
              onSelect={setClientFilter}
            />
          )}

          {/* Cases List */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-xs text-muted-foreground">
              No imported cases yet — use Import/Search Case to pull one in from eCourts.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {pageCases.map((c) => (
                <CaseListCard key={c.id} caseItem={c} />
              ))}
            </div>
          )}

          {filtered.length > 0 && (
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
          )}
        </div>
      )}

      {currentLawyer && (
        <ImportCaseModal
          open={importOpen}
          onOpenChange={setImportOpen}
          lawyerId={currentLawyer.id}
          lawyerName={currentLawyer.name}
        />
      )}
    </div>
  );
}
