import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Clock,
  CheckCircle2,
  AlertCircle,
  Archive,
  Eye,
  ArrowUpRight,
  User,
  Tag,
  Check,
  Phone,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import {
  Card,
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
import { supportService } from "@/services/supportService";
import type { ContactInquiry } from "@/types/api";

export const Route = createFileRoute("/admin/support")({
  head: () => ({ meta: [{ title: "Support & Inquiries — CloseUrCase Admin" }] }),
  component: AdminSupportPage,
});

function AdminSupportPage() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const items = await supportService.listInquiries();
      setInquiries(items);
    } catch (err) {
      console.error("Failed to load inquiries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusChange = async (
    id: string,
    newStatus: "New" | "In Review" | "Resolved" | "Archived",
  ) => {
    setIsUpdating(true);
    try {
      const updated = await supportService.updateInquiryStatus(id, newStatus);
      setInquiries((prev) => prev.map((item) => (item.id === id ? updated : item)));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(updated);
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Metrics
  const totalCount = inquiries.length;
  const newCount = inquiries.filter((i) => i.status === "New").length;
  const inReviewCount = inquiries.filter((i) => i.status === "In Review").length;
  const resolvedCount = inquiries.filter((i) => i.status === "Resolved").length;

  // Filtered List
  const filtered = useMemo(() => {
    return inquiries.filter((inq) => {
      if (statusFilter !== "all" && inq.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (categoryFilter !== "all" && inq.category.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = inq.name.toLowerCase().includes(q);
        const matchEmail = inq.email.toLowerCase().includes(q);
        const matchSubject = inq.subject.toLowerCase().includes(q);
        const matchMsg = inq.message.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchSubject && !matchMsg) return false;
      }
      return true;
    });
  }, [inquiries, statusFilter, categoryFilter, search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            New
          </span>
        );
      case "In Review":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 border border-indigo-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            In Review
          </span>
        );
      case "Resolved":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Resolved
          </span>
        );
      case "Archived":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground border border-border">
            <Archive className="h-3 w-3 text-muted-foreground" />
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support & User Inquiries"
        description="Review inbound support questions, partnership requests, and public platform feedback."
        action={
          <Button
            variant="tonal"
            icon={<RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />}
            onClick={fetchInquiries}
          >
            Refresh
          </Button>
        }
      />

      {/* KPI METRICS OVERVIEW */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider">Total Received</span>
            <LifeBuoy className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground font-mono">{totalCount}</p>
          <span className="text-[11px] text-muted-foreground">All logged tickets</span>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400">
            <span className="font-semibold uppercase tracking-wider">Action Needed</span>
            <AlertCircle className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400 font-mono">
            {newCount}
          </p>
          <span className="text-[11px] text-amber-600/80">Pending initial review</span>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-indigo-700 dark:text-indigo-400">
            <span className="font-semibold uppercase tracking-wider">In Review</span>
            <Clock className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-indigo-700 dark:text-indigo-400 font-mono">
            {inReviewCount}
          </p>
          <span className="text-[11px] text-indigo-600/80">Being handled</span>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
            <span className="font-semibold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
            {resolvedCount}
          </p>
          <span className="text-[11px] text-emerald-600/80">Closed inquiries</span>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-6">
            <TextField
              label="Search inquiries"
              placeholder="Search by sender, email, subject, or message..."
              value={search}
              onChange={(v) => setSearch(v)}
              className="w-full"
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              label="Category"
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              className="w-full"
              options={[
                { value: "all", label: "All Categories" },
                { value: "general", label: "General Inquiry" },
                { value: "citizen", label: "Citizen Support" },
                { value: "lawyer", label: "Advocate Verification" },
                { value: "technical", label: "Technical Bug" },
                { value: "partnership", label: "Partnership / Enterprise" },
                { value: "feedback", label: "Public Feedback" },
              ]}
            />
          </div>

          <div className="sm:col-span-3">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              className="w-full"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "new", label: "New / Pending" },
                { value: "in review", label: "In Review" },
                { value: "resolved", label: "Resolved" },
                { value: "archived", label: "Archived" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* INQUIRIES LIST / TABLE */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Loading customer support inquiries...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <LifeBuoy className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h4 className="text-sm font-bold text-foreground">No Inquiries Found</h4>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              {search || categoryFilter !== "all" || statusFilter !== "all"
                ? "No support messages match your current filters. Try resetting the filters."
                : "No customer inquiries have been submitted yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((inq) => (
              <div
                key={inq.id}
                className="p-5 hover:bg-muted/30 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{inq.subject}</span>
                    {getStatusBadge(inq.status)}
                    <span className="rounded-md bg-secondary/15 px-2 py-0.5 text-[11px] font-semibold text-secondary uppercase tracking-wider">
                      {inq.category}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {inq.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <User className="h-3 w-3 text-muted-foreground" />
                      {inq.name}
                    </span>
                    <a
                      href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject)}`}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <Mail className="h-3 w-3" />
                      {inq.email}
                    </a>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(inq.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <Button
                    variant="outlined"
                    icon={<Eye className="h-3.5 w-3.5" />}
                    onClick={() => setSelectedInquiry(inq)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAIL & ACTION DIALOG */}
      {selectedInquiry && (
        <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DialogTitle>{selectedInquiry.subject}</DialogTitle>
                </div>
                {getStatusBadge(selectedInquiry.status)}
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border bg-muted/20 p-4 text-xs">
                <div>
                  <span className="text-muted-foreground uppercase font-semibold text-[10px]">
                    Sender Name
                  </span>
                  <p className="font-bold text-foreground mt-0.5">{selectedInquiry.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase font-semibold text-[10px]">
                    Email Address
                  </span>
                  <p className="font-bold text-foreground mt-0.5">
                    <a
                      href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                      className="text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {selectedInquiry.email}
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase font-semibold text-[10px]">
                    Category
                  </span>
                  <p className="font-semibold text-foreground mt-0.5 capitalize">
                    {selectedInquiry.category}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground uppercase font-semibold text-[10px]">
                    Submitted At
                  </span>
                  <p className="font-medium text-foreground mt-0.5">
                    {new Date(selectedInquiry.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Message Content
                </h4>
                <div className="rounded-xl border border-border bg-background p-4 text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedInquiry.message}
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-xs font-bold text-foreground block mb-2">
                  Update Inquiry Workflow Status:
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedInquiry.status === "In Review" ? "filled" : "outlined"}
                    disabled={isUpdating || selectedInquiry.status === "In Review"}
                    onClick={() => handleStatusChange(selectedInquiry.id, "In Review")}
                  >
                    Mark In Review
                  </Button>
                  <Button
                    variant={selectedInquiry.status === "Resolved" ? "filled" : "outlined"}
                    disabled={isUpdating || selectedInquiry.status === "Resolved"}
                    onClick={() => handleStatusChange(selectedInquiry.id, "Resolved")}
                  >
                    Mark as Resolved
                  </Button>
                  <Button
                    variant={selectedInquiry.status === "Archived" ? "filled" : "outlined"}
                    disabled={isUpdating || selectedInquiry.status === "Archived"}
                    onClick={() => handleStatusChange(selectedInquiry.id, "Archived")}
                  >
                    Archive
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="tonal" onClick={() => setSelectedInquiry(null)}>
                Close
              </Button>
              <a
                href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                className="inline-flex items-center gap-1.5 rounded-[var(--md-sys-shape-corner-full)] bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Reply via Email</span>
              </a>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
