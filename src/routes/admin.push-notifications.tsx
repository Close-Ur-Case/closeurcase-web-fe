import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { Select, Button, TextField } from "@/components/m3";
import { useSendPushNotificationMutation, useNotificationsQuery } from "@/hooks/queries/useNotifications";
import { citizenService } from "@/services/citizenService";
import { lawyerService } from "@/services/lawyerService";
import { getCitizens, getLawyers } from "@/data/appStore";
import { notificationService } from "@/services/notificationService";
import type { Citizen, Lawyer } from "@/types";
import {
  BellRing,
  Send,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Users,
  Scale,
  Sparkles,
  Clock,
  Radio,
  ShieldCheck,
  RotateCw,
} from "lucide-react";

export const Route = createFileRoute("/admin/push-notifications")({
  head: () => ({ meta: [{ title: "Push Notifications — Admin CloseUrCase" }] }),
  component: AdminPushNotificationsPage,
});

const QUICK_TEMPLATES = [
  {
    label: "Case Docket Update",
    title: "Case Docket Update",
    message: "Your case docket status has been updated. Please log in to your CloseUrCase dashboard to review the latest proceedings.",
  },
  {
    label: "Hearing Date Alert",
    title: "Upcoming Court Hearing",
    message: "A new hearing date has been scheduled for your active matter. Check hearing schedules and prepare requisite pleadings.",
  },
  {
    label: "Document Verification",
    title: "Action Required: Document Upload",
    message: "Additional supporting documentation is required for your case review. Please upload required affidavits via your portal.",
  },
  {
    label: "Platform Maintenance",
    title: "Scheduled Maintenance Notice",
    message: "CloseUrCase platform maintenance is scheduled for tonight at 11:00 PM IST. Emergency SOS features remain fully operational.",
  },
];

export function AdminPushNotificationsPage() {
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedUserId, setSelectedUserId] = useState<string>("all");
  const [title, setTitle] = useState<string>("CloseUrCase Platform Alert");
  const [message, setMessage] = useState<string>("");

  const [citizensList, setCitizensList] = useState<Citizen[]>(getCitizens);
  const [lawyersList, setLawyersList] = useState<Lawyer[]>(getLawyers);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  const [lastSentSuccess, setLastSentSuccess] = useState<{
    id: string;
    role: string;
    userLabel: string;
    title: string;
    message: string;
    at: string;
  } | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targetTokens, setTargetTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState<boolean>(false);

  const sendMutation = useSendPushNotificationMutation();
  const { data: notificationsData, refetch: refetchNotifications } = useNotificationsQuery({ limit: 15 });

  // Fetch updated citizens and lawyers on mount
  useEffect(() => {
    setLoadingUsers(true);
    Promise.allSettled([
      citizenService.getCitizens<Citizen>().then((data) => {
        if (Array.isArray(data) && data.length > 0) setCitizensList(data);
      }),
      lawyerService.getLawyers<Lawyer>().then((data) => {
        if (Array.isArray(data) && data.length > 0) setLawyersList(data);
      }),
    ]).finally(() => setLoadingUsers(false));
  }, []);

  // Fetch active device tokens whenever targeting changes
  useEffect(() => {
    setLoadingTokens(true);
    notificationService
      .getDeviceTokens({
        userId: selectedUserId !== "all" ? selectedUserId : undefined,
        role: selectedRole !== "all" ? selectedRole : undefined,
      })
      .then((tokens) => setTargetTokens(Array.isArray(tokens) ? tokens : []))
      .catch(() => setTargetTokens([]))
      .finally(() => setLoadingTokens(false));
  }, [selectedUserId, selectedRole]);

  // When role changes, reset target user selection to "all"
  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    setSelectedUserId("all");
  };

  // Build options for User dropdown based on selectedRole
  const userOptions = useMemo(() => {
    if (selectedRole === "all") {
      return [{ value: "all", label: "All Users (Broadcast across entire platform)" }];
    }

    if (selectedRole === "citizen") {
      const opts = [{ value: "all", label: "All Citizens (Role Broadcast)" }];
      citizensList.forEach((c) => {
        const primaryId = (c as any).userId || c.id;
        const emailOrPhone = c.email || c.phone || c.city || "";
        const label = `${c.name || "Citizen"} ${emailOrPhone ? `(${emailOrPhone})` : ""}`;
        opts.push({ value: primaryId, label });
      });
      return opts;
    }

    if (selectedRole === "lawyer") {
      const opts = [{ value: "all", label: "All Advocates / Lawyers (Role Broadcast)" }];
      lawyersList.forEach((l) => {
        const primaryId = l.userId || l.id;
        const info = l.email || l.city || l.category || "";
        const label = `Adv. ${l.name || "Advocate"} ${info ? `(${info})` : ""}`;
        opts.push({ value: primaryId, label });
      });
      return opts;
    }

    if (selectedRole === "admin") {
      return [
        { value: "all", label: "All Administrators (Role Broadcast)" },
        { value: "admin@closeurcase.com", label: "Super Admin (admin@closeurcase.com)" },
        { value: "ops@closeur.legal", label: "Platform Ops (ops@closeur.legal)" },
      ];
    }

    return [{ value: "all", label: "All Users" }];
  }, [selectedRole, citizensList, lawyersList]);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setErrorMessage("Please enter both a title and a notification message.");
      return;
    }

    setErrorMessage(null);

    const targetUserId = selectedUserId === "all" ? null : selectedUserId;
    const targetRole = selectedRole;

    try {
      const response = await sendMutation.mutateAsync({
        role: targetRole,
        userId: targetUserId,
        title: title.trim(),
        message: message.trim(),
      });

      const selectedUserObj = userOptions.find((u) => u.value === selectedUserId);
      const userLabel = selectedUserObj ? selectedUserObj.label : selectedUserId;

      setLastSentSuccess({
        id: (response as any)?.id || `notif_${Date.now()}`,
        role: targetRole,
        userLabel,
        title: title.trim(),
        message: message.trim(),
        at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      });

      // Clear message after successful dispatch
      setMessage("");
      refetchNotifications();
    } catch (err: any) {
      console.error("Failed to send push notification:", err);
      setErrorMessage(err?.message || "Failed to dispatch push notification. Check server logs.");
    }
  };

  const applyTemplate = (t: { title: string; message: string }) => {
    setTitle(t.title);
    setMessage(t.message);
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <PageHeader
        title="Push Notifications"
        description="Broadcast and dispatch real-time Firebase Cloud Messaging (FCM) web and PWA push notifications to citizens, advocates, and administrators."
      />

      {/* Stats and delivery strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">FCM Delivery Channel</div>
            <div className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-0.5">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
              HTTP v1 API Online
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Registered Directory</div>
            <div className="text-sm font-bold text-foreground mt-0.5">
              {citizensList.length} Citizens • {lawyersList.length} Advocates
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-600">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Supported Target Platforms</div>
            <div className="text-sm font-bold text-foreground mt-0.5">
              PWA Standalone & Web Push
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Compose Form */}
        <div className="lg:col-span-7 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <BellRing className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Compose Push Notification</h2>
                <p className="text-xs text-muted-foreground">Select targeting and write alert payload</p>
              </div>
            </div>
            {loadingUsers && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <RotateCw className="h-3 w-3 animate-spin" /> Syncing users…
              </span>
            )}
          </div>

          {/* Quick Templates */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-2">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="px-2.5 py-1 text-xs rounded-full border border-border bg-background hover:bg-primary/5 hover:border-primary/40 text-foreground transition-colors cursor-pointer flex items-center gap-1 font-medium"
                >
                  <Sparkles className="h-3 w-3 text-primary" />
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dropdown 1: Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Target Role</label>
            <Select
              label="Role"
              value={selectedRole}
              onChange={handleRoleChange}
              className="w-full"
              options={[
                { value: "all", label: "All Roles (Broadcast to Everyone)" },
                { value: "citizen", label: "Citizen Users" },
                { value: "lawyer", label: "Advocates & Legal Counsel" },
                { value: "admin", label: "Administrators" },
              ]}
            />
            <p className="text-[11px] text-muted-foreground">
              Narrow down dispatch to a specific user tier or broadcast to all registered devices.
            </p>
          </div>

          {/* Dropdown 2: User */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Target User</label>
            <Select
              label="User"
              value={selectedUserId}
              onChange={(val) => setSelectedUserId(val)}
              className="w-full"
              options={userOptions}
            />
            <p className="text-[11px] text-muted-foreground">
              {selectedUserId === "all"
                ? `Will send to every active device token in the ${selectedRole.toUpperCase()} segment.`
                : "Direct 1-on-1 push targeting only this user's registered devices."}
            </p>

            {/* Target Device Coverage Diagnostic */}
            <div className="mt-2 rounded-xl border border-border bg-background/50 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <Smartphone className="h-3.5 w-3.5 text-primary" />
                  Target Device Coverage
                </span>
                {loadingTokens ? (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <RotateCw className="h-2.5 w-2.5 animate-spin" /> Checking tokens…
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface text-muted-foreground border border-border">
                    {targetTokens.length} active {targetTokens.length === 1 ? "token" : "tokens"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>
                  📱 Mobile PWA:{" "}
                  <strong className={targetTokens.filter((t) => t.deviceType === "mobile_pwa" || t.deviceType === "mobile_web").length > 0 ? "text-emerald-600 font-bold" : "text-amber-500 font-bold"}>
                    {targetTokens.filter((t) => t.deviceType === "mobile_pwa" || t.deviceType === "mobile_web").length}
                  </strong>
                </span>
                <span>
                  💻 Desktop Web:{" "}
                  <strong className="text-foreground font-semibold">
                    {targetTokens.filter((t) => t.deviceType === "web" || t.deviceType === "desktop_pwa").length}
                  </strong>
                </span>
              </div>
              {targetTokens.filter((t) => t.deviceType === "mobile_pwa" || t.deviceType === "mobile_web").length === 0 && selectedUserId !== "all" && (
                <div className="mt-1 flex items-start gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-amber-700 dark:text-amber-400 text-[11px] leading-tight">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-500" />
                  <span>
                    <strong>No Mobile PWA device registered for this recipient.</strong> Push alerts will deliver to their desktop browser, but cannot appear on a mobile lockscreen until the user opens the PWA on their phone and taps <em>"Enable Push"</em>.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Title input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Notification Title</label>
            <TextField
              value={title}
              onChange={(val) => setTitle(val)}
              placeholder="e.g. Case Status Update"
              className="w-full"
            />
          </div>

          {/* Message input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-foreground">Message Body</label>
              <span className="text-[11px] text-muted-foreground">{message.length}/250 characters</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter the push notification message body here..."
              rows={4}
              maxLength={250}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-y"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Banner */}
          {lastSentSuccess && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <div className="space-y-0.5">
                <div className="font-bold">Push notification successfully dispatched at {lastSentSuccess.at}!</div>
                <div className="text-[11px] text-muted-foreground">
                  ID: <span className="font-mono">{lastSentSuccess.id}</span> • Targeted:{" "}
                  <span className="font-semibold">{lastSentSuccess.userLabel}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button
              variant="filled"
              onClick={handleSend}
              disabled={sendMutation.isPending || !message.trim() || !title.trim()}
              className="px-6 min-h-[44px]"
            >
              <Send className="h-4 w-4 mr-2" />
              {sendMutation.isPending ? "Dispatching Push Alert…" : "Send Push Notification"}
            </Button>
          </div>
        </div>

        {/* Live Device Preview & Details */}
        <div className="lg:col-span-5 space-y-5">
          {/* Mobile Lockscreen / Desktop Push Preview */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Live Device Preview
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                PWA / Browser Alert
              </span>
            </div>

            {/* Mock Push Notification Bubble */}
            <div className="rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md p-4 shadow-md space-y-2.5 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src="/logo_nobg.png"
                    alt="CloseUrCase"
                    className="h-5 w-5 object-contain rounded-md"
                  />
                  <span className="text-xs font-bold text-foreground">CloseUrCase</span>
                </div>
                <span className="text-[10px] text-muted-foreground">just now</span>
              </div>

              <div>
                <p className="text-xs font-bold text-foreground leading-snug">
                  {title.trim() || "Notification Title"}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                  {message.trim() || "Your message preview will appear here in real time as you compose it."}
                </p>
              </div>

              <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-medium text-primary">
                  <ShieldCheck className="h-3 w-3" /> CloseUrCase Platform
                </span>
                <span className="capitalize">
                  Role: <span className="font-semibold text-foreground">{selectedRole}</span>
                </span>
              </div>
            </div>

            {/* Targeting summary box */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-3 text-xs space-y-1.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-primary" /> Active Targeting Parameters
              </div>
              <div className="text-muted-foreground space-y-0.5 text-[11px]">
                <div>
                  • Target Role: <span className="font-semibold text-foreground capitalize">{selectedRole}</span>
                </div>
                <div>
                  • Target User:{" "}
                  <span className="font-semibold text-foreground">
                    {userOptions.find((u) => u.value === selectedUserId)?.label || selectedUserId}
                  </span>
                </div>
                <div>
                  • Delivery: <span className="text-emerald-600 font-medium">Real-time Push + In-App Notice</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Guidelines Card */}
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Push Delivery Architecture
            </h3>
            <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  <strong>Broadcasting:</strong> Selecting &quot;All Roles&quot; or &quot;All Citizens&quot; triggers parallel fan-out to all device tokens recorded in the database.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  <strong>Token Hygiene:</strong> Expired or unregistered device tokens are automatically purged upon FCM feedback.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <span>
                  <strong>Dual Storage:</strong> Every push notification also logs an in-app alert row in PostgreSQL so users see it in their notification center upon login.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Dispatched Notifications */}
      {notificationsData && notificationsData.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Recent In-App & Push Alerts</h3>
            </div>
            <span className="text-xs text-muted-foreground">Latest 15 system alerts</span>
          </div>

          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {notificationsData.slice(0, 8).map((notif) => (
              <div key={notif.id} className="p-3.5 bg-background hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{notif.title}</span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {notif.role || "all"}
                    </span>
                    {notif.userId && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Target: {notif.userId}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{notif.body}</p>
                </div>
                <div className="text-[11px] text-muted-foreground shrink-0 sm:text-right">
                  {notif.at || notif.createdAt ? new Date(notif.at || notif.createdAt!).toLocaleString() : "Recently"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
