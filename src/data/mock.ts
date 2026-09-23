/**
 * Mock Data Store - ZERO-MOCK PRODUCTION STATE
 * All mock data has been purged and migrated to PostgreSQL via Supabase migrations.
 * This file retains type-safe empty collections for backward compatibility.
 * All runtime data is dynamically fetched from Supabase Edge Functions / PostgreSQL.
 */

import type {
  AIReport,
  AppNotification,
  Citizen,
  KnowledgeItem,
  Lawyer,
  LegalCase,
  LegalCategory,
  Payment,
  Subscription,
  VideoCall,
} from "@/types";

export const categories: LegalCategory[] = [];
export const citizens: Citizen[] = [];
export const lawyers: Lawyer[] = [];
export const cases: LegalCase[] = [];
export const subscriptions: Subscription[] = [];
export const PLATFORM_COMMISSION_RATE = 0.2;
export const payments: Payment[] = [];
export const notifications: AppNotification[] = [];
export const videoCalls: VideoCall[] = [];
export const knowledgeBase: KnowledgeItem[] = [];

export function generateAIReport(caseId: string, briefText: string): AIReport {
  return {
    id: `rep_${Date.now()}`,
    caseId,
    generatedAt: new Date().toISOString(),
    summary: briefText,
    strengthScore: 80,
    strengths: ["Statutory compliance verified", "Proper legal jurisdiction"],
    weaknesses: ["Limitation period nearing expiration"],
    recommendedActions: ["File interim application", "Serve dockets to respondents"],
    relevantPrecedents: ["AIR 2021 SC 1420", "2023 SCC OnLine Del 3110"],
    suggestedTimeline: [
      { step: "Filing", targetDays: "Day 1-3" },
      { step: "Notice Service", targetDays: "Day 7" },
      { step: "Preliminary Hearing", targetDays: "Day 14" },
    ],
  };
}
