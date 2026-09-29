import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  Button,
} from "@/components/m3";
import { getSubscriptionDateTimes } from "@/data/appStore";
import { getTierConfig } from "@/data/subscriptionTiers";
import type { Subscription } from "@/types";
import {
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";

interface SubscriptionExpiryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: (Partial<Subscription> & { createdAt?: string }) | null | undefined;
  onRenew?: () => void;
}

export function SubscriptionExpiryModal({
  open,
  onOpenChange,
  subscription,
  onRenew,
}: SubscriptionExpiryModalProps) {
  if (!subscription) return null;

  const dates = getSubscriptionDateTimes(subscription);
  const tierConfig = getTierConfig(subscription.planId);
  const TierIcon = tierConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} maxWidth="480px">
      <DialogHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 ring-4 ring-amber-500/10 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Plan Expired
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                Action Required
              </span>
            </div>
            <DialogTitle className="text-lg font-black text-foreground mt-0.5">
              Subscription Expired
            </DialogTitle>
          </div>
        </div>
      </DialogHeader>

      <DialogContent className="space-y-4 pt-2">
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Your <strong className="text-foreground">{subscription.planLabel || "Auto-Assign"}</strong> membership has expired.
          Your account has been automatically set to the <strong className="text-amber-600 dark:text-amber-400 font-bold">Bronze Free Tier</strong>.
          Auto-Assign benefits and priority advocate dispatch are currently paused on your account.
        </p>

        {/* Expired Details Box */}
        <div className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <span className="text-muted-foreground font-medium">Previous Plan:</span>
            <span className="font-extrabold text-foreground flex items-center gap-1.5">
              <TierIcon className="h-3.5 w-3.5 text-amber-500" />
              {subscription.planLabel} (₹{subscription.amount})
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground font-medium flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Subscribed On:
            </span>
            <span className="font-semibold text-foreground">{dates.subscribedOn}</span>
          </div>

          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span className="font-medium flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Expired On:
            </span>
            <span className="font-extrabold tracking-wide">{dates.expiresOn}</span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-amber-600 dark:text-amber-400">
            <span className="font-medium">Current Account Tier:</span>
            <span className="font-extrabold">Bronze Free Tier (Auto-Set)</span>
          </div>
        </div>

        {/* Impact List */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3.5 space-y-2 text-xs">
          <div className="font-extrabold text-foreground text-[11px] uppercase tracking-wider flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Sparkles className="h-3.5 w-3.5" />
            What is affected?
          </div>
          <ul className="space-y-1.5 text-muted-foreground text-[11px] leading-snug">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold shrink-0">•</span>
              <span>
                <strong>Bronze Free Tier Active:</strong> You retain complete access to your account and standard case filing without monthly subscription fees.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold shrink-0">•</span>
              <span>
                <strong>Auto-Assign Paused:</strong> New cases will require manual advocate selection or plan renewal for automated senior lawyer dispatch.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 font-bold shrink-0">•</span>
              <span>
                <strong>Safe & Secure:</strong> All your previous cases, filed dossiers, uploaded evidence, and active chats remain 100% intact.
              </span>
            </li>
          </ul>
        </div>
      </DialogContent>

      <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3">
        <Button
          variant="outlined"
          onClick={() => onOpenChange(false)}
          className="text-xs font-semibold w-full sm:w-auto"
        >
          Remind Me Later
        </Button>

        <Button
          variant="filled"
          onClick={() => {
            onOpenChange(false);
            if (onRenew) {
              onRenew();
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-5 shadow-md flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <span>Renew & Pay Plan</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
