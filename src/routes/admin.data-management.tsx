import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import {
  Card,
  Divider,
  TextField,
  Select,
  Button,
  IconButton,
  InputChip,
  Tabs,
} from "@/components/m3";
import { Toggle } from "@/components/app/Toggle";
import {
  getCaseCategories,
  saveCaseCategory,
  deleteCaseCategory,
  getLanguages,
  saveLanguage,
  deleteLanguage,
  getCourts,
  saveCourt,
  deleteCourt,
  getStates,
  saveState,
  deleteState,
  getCourtLevels,
  saveCourtLevel,
  deleteCourtLevel,
  subscribeToStore,
  resetDataManagementToDefaults,
} from "@/data/appStore";
import type {
  CaseCategoryItem,
  LanguageItem,
  CourtItem,
  StateItem,
  CourtLevelItem,
} from "@/types";
import { Plus, Pencil, Trash2, Search, X, Check } from "lucide-react";
import { CardPagination } from "@/components/app/CardPagination";

export const Route = createFileRoute("/admin/data-management")({
  head: () => ({ meta: [{ title: "Data Management — CloseUrCase Admin" }] }),
  component: AdminDataManagementPage,
});

type TabType = "categories" | "languages" | "states" | "courts" | "courtLevels";

/* ────────────────────────────────────────────────────────────────────────────
 * A row of master data is edited in place, not in a modal. Each entity type
 * declares its fields, how a collapsed row reads, and which fields the search
 * box matches — everything else (list, row, inline editor) is generic.
 * ──────────────────────────────────────────────────────────────────────────── */

type FieldKind = "text" | "select" | "chips" | "tree" | "districts";

interface FieldDef {
  key: string;
  label: string;
  /** "chips" — a flat string[] editor. "tree" — a two-level editor of
   * `{ name, services: string[] }[]` (sub-category → legal services).
   * "districts" — district list manager under a state. */
  kind: FieldKind;
  required?: boolean;
  /** For kind === "select". */
  options?: { value: string; label: string }[];
  /** Uppercase + trim on save (codes). */
  upper?: boolean;
  placeholder?: string;
}

type SubCat = { name: string; services: string[] };
const subCats = (v: unknown): SubCat[] =>
  Array.isArray(v)
    ? v
        .map((e) =>
          typeof e === "string"
            ? { name: e, services: [] }
            : e && typeof e === "object"
              ? {
                  name: String((e as SubCat).name ?? ""),
                  services: Array.isArray((e as any).services)
                    ? (e as any).services.map((s: any) => typeof s === "string" ? s : String(s?.name || s?.id || ""))
                    : [],
                }
              : { name: "", services: [] },
        )
        .filter((e) => e.name)
    : [];

/** Every entity is handled through this loose shape — the config functions
 * below narrow each one back to its real type at the call site. */
type Row = { id: string; active: boolean; [key: string]: unknown };

interface EntityConfig {
  singular: string;
  plural: string;
  get: () => Row[];
  save: (item: Record<string, unknown> & { active: boolean }) => void;
  remove: (id: string) => void;
  fields: FieldDef[];
  /** Blank form values for a new row. */
  empty: Record<string, unknown>;
  /** Collapsed-row title. */
  primary: (item: Row) => string;
  /** Collapsed-row muted subtitle. */
  secondary: (item: Row) => string;
  /** Lowercased haystack for the search box. */
  haystack: (item: Row) => string;
}

const s = (v: unknown) => String(v ?? "");
const list = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

const CONFIG: Record<TabType, EntityConfig> = {
  categories: {
    singular: "Category",
    plural: "categories",
    get: getCaseCategories as unknown as () => Row[],
    save: (i) => saveCaseCategory(i as Omit<CaseCategoryItem, "id"> & { id?: string }),
    remove: deleteCaseCategory,
    fields: [
      {
        key: "name",
        label: "Name",
        kind: "text",
        required: true,
        placeholder: "e.g. Intellectual Property",
      },
      {
        key: "code",
        label: "Code",
        kind: "text",
        required: true,
        upper: true,
        placeholder: "e.g. IP",
      },
      { key: "description", label: "Description", kind: "text", placeholder: "Short summary" },
      { key: "subCategories", label: "Sub-categories & legal services", kind: "tree" },
    ],
    empty: { name: "", code: "", description: "", subCategories: [] },
    primary: (i) => s(i.name),
    secondary: (i) => {
      const sc = subCats(i.subCategories);
      const svc = sc.reduce((n, x) => n + x.services.length, 0);
      return `${s(i.code)} · ${sc.length} sub-categories · ${svc} services`;
    },
    haystack: (i) =>
      [
        s(i.name),
        s(i.code),
        s(i.description),
        ...subCats(i.subCategories).flatMap((x) => [x.name, ...x.services]),
      ]
        .join(" ")
        .toLowerCase(),
  },
  languages: {
    singular: "Language",
    plural: "languages",
    get: getLanguages as unknown as () => Row[],
    save: (i) => saveLanguage(i as Omit<LanguageItem, "id"> & { id?: string }),
    remove: deleteLanguage,
    fields: [
      {
        key: "name",
        label: "Name (English)",
        kind: "text",
        required: true,
        placeholder: "e.g. French",
      },
      { key: "nativeName", label: "Native script", kind: "text", placeholder: "e.g. Français" },
      {
        key: "code",
        label: "ISO code",
        kind: "text",
        required: true,
        upper: true,
        placeholder: "e.g. FR",
      },
    ],
    empty: { name: "", nativeName: "", code: "" },
    primary: (i) => s(i.name),
    secondary: (i) => `${s(i.nativeName) || "—"} · ${s(i.code)}`,
    haystack: (i) => [s(i.name), s(i.nativeName), s(i.code)].join(" ").toLowerCase(),
  },
  states: {
    singular: "State & Districts",
    plural: "states & districts",
    get: getStates as unknown as () => Row[],
    save: (i) => saveState(i as Omit<StateItem, "id"> & { id?: string }),
    remove: deleteState,
    fields: [
      {
        key: "name",
        label: "State / UT",
        kind: "text",
        required: true,
        placeholder: "e.g. Telangana",
      },
      {
        key: "code",
        label: "Code",
        kind: "text",
        required: true,
        upper: true,
        placeholder: "e.g. TS",
      },
      {
        key: "districts",
        label: "Districts in this State / UT",
        kind: "districts",
      },
    ],
    empty: { name: "", code: "", districts: [] },
    primary: (i) => s(i.name),
    secondary: (i) => {
      const d = Array.isArray(i.districts) ? i.districts : [];
      return `${s(i.code)} · ${d.length} district${d.length === 1 ? "" : "s"}`;
    },
    haystack: (i) =>
      [
        s(i.name),
        s(i.code),
        ...(Array.isArray(i.districts) ? (i.districts as string[]).map(String) : []),
      ]
        .join(" ")
        .toLowerCase(),
  },
  courts: {
    singular: "Court",
    plural: "courts",
    get: getCourts as unknown as () => Row[],
    save: (i) => saveCourt(i as Omit<CourtItem, "id"> & { id?: string }),
    remove: deleteCourt,
    fields: [
      {
        key: "name",
        label: "Court name",
        kind: "text",
        required: true,
        placeholder: "e.g. High Court of Judicature",
      },
      { key: "level", label: "Level", kind: "select", required: true, options: [] },
      { key: "state", label: "State / UT", kind: "select", required: true, options: [] },
      {
        key: "district",
        label: "District (optional)",
        kind: "text",
        placeholder: "e.g. Hyderabad",
      },
    ],
    empty: { name: "", level: "", state: "", district: "" },
    primary: (i) => s(i.name),
    secondary: (i) =>
      [s(i.level), s(i.district || i.city), s(i.state)].filter(Boolean).join(" · "),
    haystack: (i) =>
      [s(i.name), s(i.level), s(i.state), s(i.district || i.city)].join(" ").toLowerCase(),
  },
  courtLevels: {
    singular: "Court Level",
    plural: "court levels",
    get: getCourtLevels as unknown as () => Row[],
    save: (i) => saveCourtLevel(i as Omit<CourtLevelItem, "id"> & { id?: string }),
    remove: deleteCourtLevel,
    fields: [
      {
        key: "name",
        label: "Level name",
        kind: "text",
        required: true,
        placeholder: "e.g. High Court",
      },
      {
        key: "code",
        label: "Code",
        kind: "text",
        required: true,
        upper: true,
        placeholder: "e.g. HC",
      },
    ],
    empty: { name: "", code: "" },
    primary: (i) => s(i.name),
    secondary: (i) => s(i.code),
    haystack: (i) => [s(i.name), s(i.code)].join(" ").toLowerCase(),
  },
};

const NEW_ROW_ID = "__new__";

/* ── Tier-2/tier-3 editor: sub-categories, each with a legal-services list ──── */
function SubCategoryTree({
  value,
  onChange,
}: {
  value: SubCat[];
  onChange: (next: SubCat[]) => void;
}) {
  const [newSub, setNewSub] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [svcDraft, setSvcDraft] = useState("");

  const addSub = () => {
    const name = newSub.trim();
    if (!name) return;
    if (!value.some((sc) => sc.name.toLowerCase() === name.toLowerCase())) {
      onChange([...value, { name, services: [] }]);
      setOpenIdx(value.length);
    }
    setNewSub("");
  };

  const renameSub = (idx: number, name: string) =>
    onChange(value.map((sc, i) => (i === idx ? { ...sc, name } : sc)));

  const removeSub = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
    if (openIdx === idx) setOpenIdx(null);
  };

  const addSvc = (idx: number) => {
    const v = svcDraft.trim();
    if (!v) return;
    onChange(
      value.map((sc, i) =>
        i === idx && !sc.services.some((s2) => s2.toLowerCase() === v.toLowerCase())
          ? { ...sc, services: [...sc.services, v] }
          : sc,
      ),
    );
    setSvcDraft("");
  };

  const removeSvc = (idx: number, sIdx: number) =>
    onChange(
      value.map((sc, i) =>
        i === idx ? { ...sc, services: sc.services.filter((_, j) => j !== sIdx) } : sc,
      ),
    );

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="Add sub-category"
            value={newSub}
            onChange={setNewSub}
            placeholder="e.g. Anticipatory Bail — then press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSub();
              }
            }}
          />
        </div>
        <Button variant="tonal" onClick={addSub} disabled={!newSub.trim()}>
          Add
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="px-1 py-2 text-xs text-muted-foreground">
          No sub-categories yet. Add one above, then open it to list its legal services.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {value.map((sc, idx) => {
            const open = openIdx === idx;
            return (
              <div key={idx}>
                <div className="flex items-center gap-2 px-2.5 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenIdx(open ? null : idx);
                      setSvcDraft("");
                    }}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    aria-label={open ? "Collapse" : "Expand"}
                  >
                    {open ? "▾" : "▸"}
                  </button>
                  <input
                    value={sc.name}
                    onChange={(e) => renameSub(idx, e.target.value)}
                    className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium text-foreground hover:border-border focus:border-primary focus:outline-none"
                  />
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {sc.services.length} svc
                  </span>
                  <IconButton ariaLabel="Remove sub-category" onClick={() => removeSub(idx)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </IconButton>
                </div>

                {open && (
                  <div className="space-y-2 bg-muted/30 px-3 pb-3 pt-1">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <TextField
                          label="Add legal service"
                          value={svcDraft}
                          onChange={setSvcDraft}
                          placeholder="e.g. File Anticipatory Bail Application"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addSvc(idx);
                            }
                          }}
                        />
                      </div>
                      <Button
                        variant="tonal"
                        onClick={() => addSvc(idx)}
                        disabled={!svcDraft.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {sc.services.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {sc.services.map((svc, sIdx) => (
                          <InputChip
                            key={`${svc}-${sIdx}`}
                            label={svc}
                            onRemove={() => removeSvc(idx, sIdx)}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-muted-foreground italic">
                        No legal services under this sub-category yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── District list editor under a State ─────────────────────────────────────── */
function DistrictListEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [newDistrict, setNewDistrict] = useState("");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const addDistrict = () => {
    const name = newDistrict.trim();
    if (!name) return;
    if (!value.some((d) => d.toLowerCase() === name.toLowerCase())) {
      onChange([...value, name]);
    }
    setNewDistrict("");
  };

  const removeDistrict = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditName(value[idx]);
  };

  const saveEdit = (idx: number) => {
    const trimmed = editName.trim();
    if (trimmed && !value.some((d, i) => i !== idx && d.toLowerCase() === trimmed.toLowerCase())) {
      onChange(value.map((d, i) => (i === idx ? trimmed : d)));
    }
    setEditingIdx(null);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <TextField
            label="Add district"
            value={newDistrict}
            onChange={setNewDistrict}
            placeholder="e.g. Hyderabad — then press Enter"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addDistrict();
              }
            }}
          />
        </div>
        <Button variant="tonal" onClick={addDistrict} disabled={!newDistrict.trim()}>
          Add
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="px-1 py-2 text-xs text-muted-foreground italic">
          No districts added yet for this state. Type a district name above and click Add.
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground">
              {value.length} district{value.length === 1 ? "" : "s"} in this state / UT
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto pr-1">
            {value.map((dist, idx) => {
              const isEditing = editingIdx === idx;
              if (isEditing) {
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 rounded-full border border-primary/50 bg-background px-2.5 py-1 shadow-sm"
                  >
                    <input
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(idx);
                        if (e.key === "Escape") setEditingIdx(null);
                      }}
                      className="text-xs font-medium text-foreground bg-transparent focus:outline-none w-28"
                    />
                    <button
                      type="button"
                      onClick={() => saveEdit(idx)}
                      className="text-xs text-primary hover:underline font-semibold"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingIdx(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                );
              }
              return (
                <InputChip
                  key={`${dist}-${idx}`}
                  label={dist}
                  onClick={() => startEdit(idx)}
                  onRemove={() => removeDistrict(idx)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Inline editor for one row ──────────────────────────────────────────────── */
function RowEditor({
  fields,
  values,
  onChange,
  onSave,
  onCancel,
  error,
}: {
  fields: FieldDef[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  error: string;
}) {
  const [chipDraft, setChipDraft] = useState("");

  return (
    <div
      className="space-y-3 px-3 pb-4 pt-1 sm:px-4"
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
    >
      {error && (
        <p className="rounded-lg bg-destructive/10 px-2.5 py-2 text-xs font-medium text-destructive">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {fields.map((f) => {
          if (f.kind === "districts") {
            const distList = Array.isArray(values[f.key])
              ? (values[f.key] as string[])
              : typeof values[f.key] === "string"
                ? (values[f.key] as string).split(",")
                : [];
            return (
              <div key={f.key} className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{f.label}</label>
                <DistrictListEditor
                  value={distList}
                  onChange={(next) => onChange(f.key, next)}
                />
              </div>
            );
          }

          if (f.kind === "tree") {
            return (
              <div key={f.key} className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">{f.label}</label>
                <SubCategoryTree
                  value={subCats(values[f.key])}
                  onChange={(next) => onChange(f.key, next)}
                />
              </div>
            );
          }

          if (f.kind === "chips") {
            const chips = list(values[f.key]);
            const addChip = () => {
              const v = chipDraft.trim();
              if (!v) return;
              if (!chips.some((c) => c.toLowerCase() === v.toLowerCase())) {
                onChange(f.key, [...chips, v]);
              }
              setChipDraft("");
            };

            return (
              <div key={f.key} className="sm:col-span-2 space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <TextField
                      label={f.label}
                      value={chipDraft}
                      onChange={setChipDraft}
                      placeholder="Add one, then press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addChip();
                        }
                      }}
                    />
                  </div>
                  <Button variant="tonal" onClick={addChip} disabled={!chipDraft.trim()}>
                    Add
                  </Button>
                </div>
                {chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {chips.map((c, idx) => (
                      <InputChip
                        key={`${c}-${idx}`}
                        label={c}
                        onRemove={() =>
                          onChange(
                            f.key,
                            chips.filter((_, i) => i !== idx),
                          )
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          if (f.kind === "select") {
            const opts = f.options ?? [];
            return (
              <Select
                key={f.key}
                label={f.required ? `${f.label} *` : f.label}
                value={String(values[f.key] ?? "")}
                onChange={(v) => onChange(f.key, v)}
                options={
                  opts.length > 0
                    ? opts
                    : [{ value: "", label: `Select ${f.label.toLowerCase()}` }]
                }
              />
            );
          }

          return (
            <TextField
              key={f.key}
              label={f.required ? `${f.label} *` : f.label}
              value={String(values[f.key] ?? "")}
              onChange={(v) => onChange(f.key, f.upper ? v.toUpperCase() : v)}
              placeholder={f.placeholder}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="text" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="filled" onClick={onSave} icon={<Check className="h-4 w-4" />}>
          Save
        </Button>
      </div>
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export function AdminDataManagementPage() {
  const [tab, setTab] = useState<TabType>("categories");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [categories, setCategories] = useState<CaseCategoryItem[]>(getCaseCategories);
  const [languages, setLanguages] = useState<LanguageItem[]>(getLanguages);
  const [states, setStates] = useState<StateItem[]>(getStates);
  const [courts, setCourts] = useState<CourtItem[]>(getCourts);
  const [courtLevels, setCourtLevels] = useState<CourtLevelItem[]>(getCourtLevels);

  useEffect(
    () =>
      subscribeToStore(() => {
        setCategories(getCaseCategories());
        setLanguages(getLanguages());
        setStates(getStates());
        setCourts(getCourts());
        setCourtLevels(getCourtLevels());
      }),
    [],
  );

  // Which row is open for editing (id, or NEW_ROW_ID for the add form).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [confirmReset, setConfirmReset] = useState(false);

  // Reset transient state whenever the tab or filters change.
  useEffect(() => {
    setEditingId(null);
    setFormError("");
  }, [tab]);

  const baseCfg = CONFIG[tab];
  const rows = { categories, languages, states, courts, courtLevels }[
    tab
  ] as unknown as Row[];

  // Courts pull State and Level choices dynamically from the active States / Levels lists
  const cfg = useMemo<EntityConfig>(() => {
    if (tab !== "courts") return baseCfg;
    const stateOpts = [
      { value: "All India", label: "All India (National)" },
      ...states
        .filter((st) => st.active)
        .map((st) => ({ value: st.name, label: st.name })),
    ];
    const levelOpts = courtLevels
      .filter((lv) => lv.active)
      .map((lv) => ({ value: lv.name, label: lv.name }));
    return {
      ...baseCfg,
      fields: baseCfg.fields.map((f) => {
        if (f.key === "state") return { ...f, options: stateOpts };
        if (f.key === "level") return { ...f, options: levelOpts };
        return f;
      }),
    };
  }, [tab, baseCfg, states, courtLevels]);

  const counts = {
    categories: categories.length,
    languages: languages.length,
    states: states.length,
    courts: courts.length,
    courtLevels: courtLevels.length,
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === "active" && !r.active) return false;
      if (statusFilter === "inactive" && r.active) return false;
      if (!q) return true;
      return cfg.haystack(r).includes(q);
    });
  }, [rows, search, statusFilter, cfg]);

  // Standard CardPagination support — limit 25 for all tabs
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  const openEdit = (row: Row) => {
    const values: Record<string, unknown> = {};
    cfg.fields.forEach((f) => {
      if (f.kind === "districts") {
        values[f.key] = Array.isArray(row[f.key]) ? [...(row[f.key] as string[])] : [];
      } else if (f.kind === "chips") {
        values[f.key] = [...list(row[f.key])];
      } else if (f.kind === "tree") {
        values[f.key] = subCats(row[f.key]).map((sc) => ({ ...sc, services: [...sc.services] }));
      } else {
        values[f.key] = row[f.key] ?? "";
      }
    });
    setDraft(values);
    setFormError("");
    setEditingId(row.id);
  };

  const openAdd = () => {
    setDraft({ ...cfg.empty });
    setFormError("");
    setEditingId(NEW_ROW_ID);
  };

  const handleSave = () => {
    for (const f of cfg.fields) {
      if (f.required && !String(draft[f.key] ?? "").trim()) {
        setFormError(`${f.label} is required.`);
        return;
      }
    }
    const payload: Record<string, unknown> = { active: true };
    if (editingId && editingId !== NEW_ROW_ID) {
      payload.id = editingId;
      const existing = rows.find((r) => r.id === editingId);
      if (existing) payload.active = existing.active;
    }
    cfg.fields.forEach((f) => {
      if (f.kind === "districts" || f.kind === "chips") {
        payload[f.key] = Array.isArray(draft[f.key]) ? draft[f.key] : [];
      } else if (f.kind === "tree") {
        payload[f.key] = subCats(draft[f.key])
          .map((sc) => ({
            name: sc.name.trim(),
            services: sc.services.map((x) => x.trim()).filter(Boolean),
          }))
          .filter((sc) => sc.name);
      } else {
        let v = String(draft[f.key] ?? "").trim();
        if (f.upper) v = v.toUpperCase();
        payload[f.key] = v;
      }
    });
    cfg.save(payload as Record<string, unknown> & { active: boolean });
    setEditingId(null);
  };

  const setActive = (id: string, next: boolean) => {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const payload: Record<string, unknown> = { id, active: next };
    cfg.fields.forEach((f) => {
      payload[f.key] =
        row[f.key] ?? (f.kind === "chips" || f.kind === "districts" || f.kind === "tree" ? [] : "");
    });
    cfg.save(payload as Record<string, unknown> & { active: boolean });
  };

  const handleToggle = (row: Row) => {
    if (row.active === true) {
      setDeactivateTarget({ id: row.id, name: cfg.primary(row) });
    } else {
      setActive(row.id, true);
    }
  };

  const tabItems: { value: TabType; label: string }[] = [
    { value: "categories", label: `Categories (${counts.categories})` },
    { value: "languages", label: `Languages (${counts.languages})` },
    { value: "states", label: `States & Districts (${counts.states})` },
    { value: "courts", label: `Courts (${counts.courts})` },
    { value: "courtLevels", label: `Court Levels (${counts.courtLevels})` },
  ];

  return (
    <div className="w-full space-y-4">
      <PageHeader
        title="Data Management"
        description="Maintain the master categories, languages, states & districts, courts, and court levels used across CloseUrCase."
        actions={
          <Button variant="filled" icon={<Plus className="h-4 w-4" />} onClick={openAdd}>
            Add {cfg.singular}
          </Button>
        }
      />

      <Tabs value={tab} onChange={(v) => setTab(v as TabType)} tabs={tabItems} />

      {/* Toolbar — stacks on mobile, one row from sm up */}
      <div className="pt-2 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="sm:flex-1">
          <TextField
            type="search"
            value={search}
            onChange={setSearch}
            placeholder={`Search ${cfg.plural}`}
            leadingIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            ariaLabel="Filter by status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}
            options={[
              { value: "all", label: "All statuses" },
              { value: "active", label: "Active only" },
              { value: "inactive", label: "Inactive only" },
            ]}
            className="w-full"
          />
        </div>
      </div>

      <Card variant="outlined" className="overflow-hidden">
        {/* Add form (top of list) */}
        {editingId === NEW_ROW_ID && (
          <>
            <div className="bg-muted/30 px-3 pt-3 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:px-4">
              New {cfg.singular}
            </div>
            <RowEditor
              fields={cfg.fields}
              values={draft}
              onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
              error={formError}
            />
            <Divider />
          </>
        )}

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-foreground">No {cfg.plural} found</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {search || statusFilter !== "all"
                ? "Try clearing the search or status filter."
                : `Add your first ${cfg.singular.toLowerCase()} with the button above.`}
            </p>
          </div>
        ) : (
          paginatedRows.map((row, idx) => {
            const isEditing = editingId === row.id;
            const active = row.active === true;
            return (
              <div key={row.id}>
                {idx > 0 && <Divider />}

                {/* Collapsed row — text on its own line on mobile, controls below */}
                <div className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:gap-3 sm:px-4">
                  <button
                    type="button"
                    onClick={() => (isEditing ? setEditingId(null) : openEdit(row))}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm font-semibold text-foreground">
                      {cfg.primary(row)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{cfg.secondary(row)}</p>
                  </button>

                  <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                    <span
                      className="text-xs font-medium"
                      style={{
                        color: active
                          ? "var(--md-extended-color-success)"
                          : "var(--md-sys-color-on-surface-variant)",
                      }}
                    >
                      {active ? "Active" : "Inactive"}
                    </span>
                    <Toggle
                      checked={active}
                      onChange={() => handleToggle(row)}
                      ariaLabel={`Toggle status for ${cfg.primary(row)}`}
                    />
                    <IconButton
                      ariaLabel={isEditing ? "Close editor" : "Edit"}
                      onClick={() => (isEditing ? setEditingId(null) : openEdit(row))}
                    >
                      {isEditing ? (
                        <X className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      )}
                    </IconButton>
                    <IconButton
                      ariaLabel="Delete"
                      onClick={() => setDeleteTarget({ id: row.id, name: cfg.primary(row) })}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </IconButton>
                  </div>
                </div>

                {/* Inline editor */}
                {isEditing && (
                  <div className="bg-muted/20">
                    <RowEditor
                      fields={cfg.fields}
                      values={draft}
                      onChange={(k, v) => setDraft((d) => ({ ...d, [k]: v }))}
                      onSave={handleSave}
                      onCancel={() => setEditingId(null)}
                      error={formError}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Standard CardPagination for all tabs — limit 25 */}
        {filtered.length > 0 && (
          <div className="border-t border-border px-3 py-3 sm:px-4 bg-muted/10">
            <CardPagination
              page={safePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[10, 25, 50, 100]}
            />
          </div>
        )}
      </Card>

      <div className="flex justify-end pt-1">
        <Button variant="text" onClick={() => setConfirmReset(true)}>
          Reset all to defaults
        </Button>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name ?? ""}"?`}
        message="This master data record will be permanently removed."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) cfg.remove(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={deactivateTarget !== null}
        title={`Deactivate "${deactivateTarget?.name ?? ""}"?`}
        message={`This ${cfg.singular.toLowerCase()} will be hidden from citizens and lawyers until it is turned back on.`}
        confirmLabel="Deactivate"
        variant="warning"
        onConfirm={() => {
          if (deactivateTarget) setActive(deactivateTarget.id, false);
          setDeactivateTarget(null);
        }}
        onCancel={() => setDeactivateTarget(null)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Reset all master data to defaults?"
        message="All categories, languages, states & districts, courts, and court levels will be reset to their factory defaults. Any custom records you added will be lost."
        confirmLabel="Reset to defaults"
        variant="danger"
        onConfirm={() => {
          resetDataManagementToDefaults();
          setConfirmReset(false);
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
