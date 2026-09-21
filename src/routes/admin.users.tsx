import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable } from "@/components/app/DataTable";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { UserAvatar } from "@/components/app/UserAvatar";
import { FilterPanelButton, type FilterSection } from "@/components/app/FilterPanelButton";
import { getCitizens, updateCitizenStatus, subscribeToStore } from "@/data/appStore";
import { citizenService } from "@/services/citizenService";
import type { Citizen } from "@/types";
import { Search } from "lucide-react";
import { TextField } from "@/components/m3";
import { Toggle } from "@/components/app/Toggle";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Manage Users — CloseUrCase" }] }),
  component: UsersPage,
});

function formatLastLogin(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function countBy<T extends string>(rows: Citizen[], pick: (c: Citizen) => T) {
  const counts = new Map<T, number>();
  rows.forEach((r) => {
    const v = pick(r);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  return counts;
}

function UsersPage() {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [rows, setRows] = useState<Citizen[]>(getCitizens);
  // Confirm state for activate/deactivate — both directions require confirmation
  const [pendingToggle, setPendingToggle] = useState<{
    c: Citizen;
    next: Citizen["status"];
  } | null>(null);

  useEffect(() => {
    const sync = () => setRows(getCitizens());
    citizenService
      .getCitizens()
      .then((backendCitizens) => {
        if (Array.isArray(backendCitizens) && backendCitizens.length > 0) {
          console.info("[Admin Users] Live backend citizens count:", backendCitizens.length);
        }
      })
      .catch((err: unknown) => {
        console.warn("[Admin Users] Backend fetch notice:", err);
      });
    return subscribeToStore(sync);
  }, []);

  const locationCounts = countBy(rows, (r) => r.city);
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
      key: "status",
      label: "Account Status",
      options: Array.from(statusCounts.entries()).map(([value, count]) => ({
        value,
        label: value,
        count,
      })),
    },
  ];

  const filtered = rows
    .filter((r) =>
      Object.entries(filters).every(
        ([key, values]) => values.length === 0 || values.includes(String(r[key as keyof Citizen])),
      ),
    )
    .filter((r) =>
      !q.trim()
        ? true
        : `${r.name} ${r.email} ${r.phone} ${r.city} ${r.joinedAt} ${r.lastLoginAt}`
            .toLowerCase()
            .includes(q.toLowerCase()),
    );

  const handleToggleStatus = (c: Citizen) => {
    setPendingToggle({ c, next: c.status === "Active" ? "Inactive" : "Active" });
  };

  function renderCitizenCard(r: Citizen) {
    const statusColor =
      r.status === "Active"
        ? "var(--md-extended-color-success)"
        : "var(--md-sys-color-on-surface-variant)";
    return (
      <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-3.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm sm:p-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <UserAvatar name={r.name} size="sm" role="citizen" />
            <div className="min-w-0 space-y-1">
              <div className="line-clamp-2 text-sm font-bold text-foreground sm:text-[15px]">
                {r.name}
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <span>{r.email}</span>
                <span aria-hidden>•</span>
                <span>{r.phone}</span>
                <span aria-hidden>•</span>
                <span>{r.city}</span>
              </div>
              <div className="text-[11px] text-muted-foreground">
                Registered {r.joinedAt} · Last login {formatLastLogin(r.lastLoginAt)}
              </div>
            </div>
          </div>

          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{
              color: statusColor,
              backgroundColor: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
            }}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: statusColor }}
            />
            {r.status}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-border/60 pt-2">
          <span className="text-xs font-medium" style={{ color: statusColor }}>
            {r.status === "Active" ? "Active" : "Inactive"}
          </span>
          <Toggle
            checked={r.status === "Active"}
            onChange={() => handleToggleStatus(r)}
            ariaLabel={`Toggle account status for ${r.name}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Citizen Account Management"
        description="View registered citizen users, inspect contact details, and toggle account access."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-border/80 bg-surface p-2.5 sm:p-3 shadow-2xs">
        <TextField
          value={q}
          onChange={setQ}
          placeholder="Search by name, email, phone, city..."
          leadingIcon={<Search className="h-4 w-4 text-muted-foreground" />}
          className="w-full sm:w-80 md:w-96 min-w-0 flex-1"
        />
        <FilterPanelButton sections={filterSections} selected={filters} onChange={setFilters} />
      </div>

      <DataTable
        renderCard={renderCitizenCard}
        rows={filtered}
        empty="No citizens matching your search."
      />

      {/* CONFIRM ACTIVATE / DEACTIVATE DIALOG */}
      <ConfirmDialog
        open={pendingToggle !== null}
        title={
          pendingToggle?.next === "Active"
            ? "Activate Citizen Account"
            : "Deactivate Citizen Account"
        }
        message={
          pendingToggle?.next === "Active"
            ? `Are you sure you want to activate ${pendingToggle?.c.name ?? "this citizen"}'s account? They will regain full access to the platform.`
            : `Are you sure you want to deactivate ${pendingToggle?.c.name ?? "this citizen"}'s account? They will immediately lose access to the platform, but their case history will be preserved.`
        }
        confirmLabel={
          pendingToggle?.next === "Active" ? "Yes, Activate Account" : "Yes, Deactivate Account"
        }
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={() => {
          if (pendingToggle) {
            updateCitizenStatus(pendingToggle.c.id, pendingToggle.next);
            citizenService
              .updateCitizen(pendingToggle.c.id, { status: pendingToggle.next })
              .catch((err: unknown) => {
                console.warn("[Admin Users] Status update server notice:", err);
              });
          }
          setPendingToggle(null);
        }}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}
