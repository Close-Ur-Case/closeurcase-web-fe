import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  subscribeToStore,
} from "@/data/appStore";
import type { AppNotification } from "@/types";
import {
  Bell,
  CheckCheck,
  Trash2,
  ExternalLink,
  UserCheck,
  FileCheck2,
  Clock,
  Sparkles,
  Scale,
  AlertCircle,
} from "lucide-react";
import { ChipSet, FilterChip, AssistChip, IconButton, Button } from "@/components/m3";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";

type Role = "citizen" | "lawyer" | "admin";

function getNotifIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("lawyer") || t.includes("assigned") || t.includes("appointed")) {
    return <UserCheck className="h-4 w-4 text-emerald-600" />;
  }
  if (t.includes("document") || t.includes("upload") || t.includes("fir")) {
    return <FileCheck2 className="h-4 w-4 text-amber-600" />;
  }
  if (t.includes("status") || t.includes("resolved") || t.includes("progress")) {
    return <Clock className="h-4 w-4 text-primary" />;
  }
  if (t.includes("case") || t.includes("new")) {
    return <Scale className="h-4 w-4 text-indigo-600" />;
  }
  if (t.includes("alert") || t.includes("warn") || t.includes("reject")) {
    return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
  return <Sparkles className="h-4 w-4 text-indigo-600" />;
}

function getCaseIdFromText(title: string, body: string): string | null {
  const match = `${title} ${body}`.match(/CS-\d+/i);
  return match ? match[0].toUpperCase() : null;
}

export function SharedNotificationsPage({ role }: { role: Role }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<AppNotification[]>(() => getNotifications(role));
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setItems(getNotifications(role));
    return subscribeToStore(sync);
  }, [role]);

  const unreadCount = items.filter((n) => !n.read).length;
  const filtered = items.filter((n) => (filter === "unread" ? !n.read : true));

  const handleViewCase = (caseId: string) => {
    if (role === "citizen") {
      navigate({ to: "/citizen/my-cases" as never });
    } else if (role === "lawyer") {
      navigate({ to: "/lawyer/cases" as never });
    } else {
      navigate({ to: "/admin/cases" as never });
    }
  };

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleMarkAll = () => {
    markAllNotificationsRead();
  };

  const pendingDeleteNotif = items.find((n) => n.id === pendingDeleteId) ?? null;

  const handleConfirmDelete = () => {
    if (pendingDeleteId) deleteNotification(pendingDeleteId);
    setPendingDeleteId(null);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: `/${role}` as never });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Stay informed with real-time alerts regarding cases, assignments, and platform updates."
        actionsPosition="inline"
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outlined"
              icon={<CheckCheck className="h-4 w-4" />}
              onClick={handleMarkAll}
            >
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      {/* Filter Chips */}
      <div className="flex items-center justify-between border-b border-border/80 pb-3">
        <ChipSet>
          <FilterChip
            label={`All (${items.length})`}
            selected={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <FilterChip
            label={`Unread (${unreadCount})`}
            selected={filter === "unread"}
            onClick={() => setFilter("unread")}
          />
        </ChipSet>
        <span className="text-xs text-muted-foreground">
          Showing {filtered.length} notification{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border/80 bg-surface p-12 text-center shadow-2xs space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">No notifications found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {filter === "unread"
              ? "You've read all your notifications! Check back later for updates."
              : "No notifications recorded yet. Actions like case submissions and assignments will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((n) => {
            const caseId = getCaseIdFromText(n.title, n.body);
            return (
              <div
                key={n.id}
                className={`group relative flex items-start gap-4 rounded-xl border p-4 transition-all ${
                  n.read
                    ? "border-border/60 bg-surface/70"
                    : "border-primary/40 bg-primary/5 shadow-2xs"
                }`}
              >
                {/* Icon Column */}
                <div
                  className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                    n.read
                      ? "border-border bg-background"
                      : "border-primary/20 bg-surface shadow-2xs"
                  }`}
                >
                  {getNotifIcon(n.title)}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{n.title}</span>
                      {!n.read && <span className="inline-block h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{n.at}</span>
                  </div>

                  <p className="text-xs leading-relaxed text-muted-foreground">{n.body}</p>

                  {/* Actions Footer */}
                  <div className="mt-2 flex items-center gap-2 pt-1">
                    {caseId && (
                      <AssistChip
                        label={`View ${caseId}`}
                        icon={<ExternalLink className="h-3.5 w-3.5" />}
                        onClick={() => handleViewCase(caseId)}
                      />
                    )}

                    {!n.read && (
                      <Button variant="text" onClick={() => handleMarkRead(n.id)}>
                        Mark as read
                      </Button>
                    )}

                    <IconButton
                      variant="standard"
                      className="ml-auto"
                      ariaLabel="Delete notification"
                      onClick={() => setPendingDeleteId(n.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Delete Notification"
        message={
          pendingDeleteNotif
            ? `Are you sure you want to delete "${pendingDeleteNotif.title}"? This notification will be permanently removed and can't be recovered.`
            : "Are you sure you want to delete this notification? It will be permanently removed and can't be recovered."
        }
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  );
}
