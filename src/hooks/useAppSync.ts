/**
 * Global App Synchronization Hook
 * Orchestrates reactive boot hydration from Supabase Edge Functions / PostgreSQL
 * into the reactive client appStore on app mount.
 *
 * Sourced entirely from the backend database:
 * - Master taxonomies (categories, courts, states, languages, court levels)
 * - Lawyers directory
 * - Citizens directory
 * - Knowledge base items
 * - Subscription plans & active memberships
 * - Financial ledger (payments & withdrawals)
 * - In-app notifications
 * - Video consultation sessions
 * - User-scoped case dockets
 */

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/useAuth";
import { useMasterDataSync } from "./useMasterDataSync";
import { useCaseSync } from "./useCaseSync";
import { lawyerService } from "@/services/lawyerService";
import { citizenService } from "@/services/citizenService";
import { knowledgeService } from "@/services/knowledgeService";
import { subscriptionService } from "@/services/subscriptionService";
import { paymentService } from "@/services/paymentService";
import { notificationService } from "@/services/notificationService";
import { videoCallService } from "@/services/videoCallService";
import { withdrawalService } from "@/services/withdrawalService";
import {
  mergeRemoteLawyers,
  mergeRemoteCitizens,
  mergeRemoteKnowledgeItems,
  mergeRemoteSubscriptions,
  mergeRemotePayments,
  mergeRemoteNotifications,
  mergeRemoteVideoCalls,
  mergeRemoteWithdrawals,
} from "@/data/appStore";
import type {
  Lawyer,
  Citizen,
  KnowledgeItem,
  Payment,
  WithdrawalRequest,
  VideoCall,
} from "@/types";

export function useAppSync() {
  const { user, role, isAuthenticated } = useAuth();

  // 1. Synchronize Master Legal Taxonomies
  useMasterDataSync();

  // 2. Synchronize User-Scoped Cases
  useCaseSync();

  // 3. Synchronize User Notifications on Login/Role Change
  useEffect(() => {
    if (!isAuthenticated) return;
    notificationService
      .getNotifications({ role: role || undefined })
      .then((notifs) => {
        if (Array.isArray(notifs) && notifs.length > 0) {
          mergeRemoteNotifications(notifs);
        }
      })
      .catch((err) => console.warn("[AppSync] Notifications notice:", err));
  }, [isAuthenticated, role, user?.id]);

  const entitySyncRef = useRef(false);

  useEffect(() => {
    if (entitySyncRef.current) return;
    entitySyncRef.current = true;

    // A. Sync Lawyers Directory
    lawyerService
      .getLawyers<Partial<Lawyer>>()
      .then((lawyers) => {
        if (Array.isArray(lawyers) && lawyers.length > 0) {
          mergeRemoteLawyers(lawyers);
        }
      })
      .catch((err) => console.warn("[AppSync] Lawyers notice:", err));

    // B. Sync Citizens Directory
    citizenService
      .getCitizens<Partial<Citizen>>()
      .then((citizens) => {
        if (Array.isArray(citizens) && citizens.length > 0) {
          mergeRemoteCitizens(citizens);
        }
      })
      .catch((err) => console.warn("[AppSync] Citizens notice:", err));

    // C. Sync Knowledge Base Items
    knowledgeService
      .getKnowledgeItems<Partial<KnowledgeItem>>()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          mergeRemoteKnowledgeItems(items);
        }
      })
      .catch((err) => console.warn("[AppSync] Knowledge items notice:", err));

    // D. Sync Subscription Plans & Active Memberships
    subscriptionService.getPlans().catch((err) => console.warn("[AppSync] Plans notice:", err));

    subscriptionService
      .listSubscriptions()
      .then((subs) => {
        if (Array.isArray(subs) && subs.length > 0) {
          mergeRemoteSubscriptions(subs);
        }
      })
      .catch((err) => console.warn("[AppSync] Subscriptions notice:", err));

    // E. Sync Financial Payments Ledger
    paymentService
      .getPayments()
      .then((payments) => {
        if (Array.isArray(payments) && payments.length > 0) {
          mergeRemotePayments(payments as Partial<Payment>[]);
        }
      })
      .catch((err) => console.warn("[AppSync] Payments notice:", err));

    // F. Sync In-App Notifications
    notificationService
      .getNotifications()
      .then((notifs) => {
        if (Array.isArray(notifs) && notifs.length > 0) {
          mergeRemoteNotifications(notifs);
        }
      })
      .catch((err) => console.warn("[AppSync] Notifications notice:", err));

    // G. Sync Video Consultations
    videoCallService
      .listCalls()
      .then((calls) => {
        if (Array.isArray(calls) && calls.length > 0) {
          mergeRemoteVideoCalls(calls as Partial<VideoCall>[]);
        }
      })
      .catch((err) => console.warn("[AppSync] Video calls notice:", err));

    // H. Sync Payout Withdrawals
    withdrawalService
      .listWithdrawals<Partial<WithdrawalRequest>>()
      .then((withdrawals) => {
        if (Array.isArray(withdrawals) && withdrawals.length > 0) {
          mergeRemoteWithdrawals(withdrawals);
        }
      })
      .catch((err) => console.warn("[AppSync] Withdrawals notice:", err));
  }, []);
}
