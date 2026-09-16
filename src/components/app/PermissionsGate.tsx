import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button } from "@/components/m3";
import {
  DEVICE_PERMISSIONS,
  getPermissionHint,
  requestDevicePermission,
  type DevicePermissionId,
  type DevicePermissionState,
} from "@/features/permissions/devicePermissions";

type StatusMap = Record<DevicePermissionId, DevicePermissionState>;

const initialStatus: StatusMap = {
  camera: "idle",
  microphone: "idle",
  location: "idle",
  notifications: "idle",
};

/** Full-screen gate shown once per browser session before any login/signup
 * screen, requesting the native camera/microphone/location/notifications
 * permissions up front with a plain-language reason for each. */
export function PermissionsGate({
  onContinue,
  image = "/lawyer-login.png",
}: {
  onContinue: () => void;
  image?: string;
}) {
  const [status, setStatus] = useState<StatusMap>(initialStatus);
  const [requesting, setRequesting] = useState(false);
  const [retryingId, setRetryingId] = useState<DevicePermissionId | null>(null);
  const settled = DEVICE_PERMISSIONS.every(
    (p) => status[p.id] !== "idle" && status[p.id] !== "pending",
  );

  async function allowAll() {
    setRequesting(true);
    for (const permission of DEVICE_PERMISSIONS) {
      setStatus((prev) => ({ ...prev, [permission.id]: "pending" }));
      const result = await requestDevicePermission(permission.id);
      setStatus((prev) => ({ ...prev, [permission.id]: result }));
    }
    setRequesting(false);
  }

  async function retryPermission(id: DevicePermissionId) {
    setRetryingId(id);
    setStatus((prev) => ({ ...prev, [id]: "pending" }));
    const result = await requestDevicePermission(id);
    setStatus((prev) => ({ ...prev, [id]: result }));
    setRetryingId(null);
  }

  return (
    <AuthLayout
      centerLogoOnMobile
      image={image}
      title="Before you continue"
      subtitle="CloseUrCase needs a few device permissions to work well. We'll tell you why for each one."
    >
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          {DEVICE_PERMISSIONS.map((permission) => {
            const permissionState = status[permission.id];
            const hint = getPermissionHint(permission.id, permissionState);
            const canRetry = permissionState === "denied" || permissionState === "unavailable";
            const isRetrying = retryingId === permission.id;
            return (
              <PermissionRow key={permission.id} state={permissionState}>
                <permission.icon className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-foreground leading-tight">
                    {permission.label}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    {permission.reason}
                  </p>
                  {hint && (
                    <p className="mt-1 text-[11px] leading-snug font-medium text-warning">
                      {hint}
                    </p>
                  )}
                  {canRetry && (
                    <Button
                      variant="text"
                      icon={<RefreshCw className={`h-3 w-3 ${isRetrying ? "animate-spin" : ""}`} />}
                      onClick={() => retryPermission(permission.id)}
                      disabled={requesting || isRetrying}
                      className="mt-1 h-auto! min-h-0! px-0! text-xs"
                    >
                      {isRetrying ? "Checking…" : "Try again"}
                    </Button>
                  )}
                </div>
              </PermissionRow>
            );
          })}
        </div>

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2 text-[11px] leading-snug text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
          <span>
            Your browser will show its own permission prompts. You can allow or deny each one — you
            can always change your choice later in your browser or device settings.
          </span>
        </div>

        <div className="space-y-1.5">
          <Button
            type="button"
            variant="filled"
            onClick={settled ? onContinue : allowAll}
            disabled={requesting}
            className="w-full"
          >
            {requesting ? "Requesting…" : settled ? "Continue" : "Allow permissions & continue"}
          </Button>

          {!settled && (
            <Button
              type="button"
              variant="text"
              onClick={onContinue}
              disabled={requesting}
              className="w-full h-8"
            >
              Skip for now
            </Button>
          )}
        </div>
      </div>
    </AuthLayout>
  );
}

function PermissionRow({
  state,
  children,
}: {
  state: DevicePermissionState;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-border bg-surface p-2.5">
      {children}
      <div className="shrink-0 pt-0.5">
        <StatusBadge state={state} />
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: DevicePermissionState }) {
  switch (state) {
    case "pending":
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    case "granted":
      return <CheckCircle2 className="h-4 w-4 text-success" aria-label="Allowed" />;
    case "denied":
      return <XCircle className="h-4 w-4 text-destructive" aria-label="Denied" />;
    case "unavailable":
      return <AlertTriangle className="h-4 w-4 text-warning" aria-label="Turned off" />;
    case "unsupported":
      return <span className="text-[10px] font-semibold uppercase text-muted-foreground">N/A</span>;
    default:
      return null;
  }
}
