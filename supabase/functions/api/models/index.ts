import { relations } from "drizzle-orm";
import { users, citizens, lawyers, adminProfiles, type LawyerPracticeAreaItem } from "./users.ts";
import { cases } from "./cases.ts";
import { caseHearings } from "./hearings.ts";
import { caseOrders } from "./orders.ts";
import { caseNotes } from "./notes.ts";
import { caseDocuments, lawyerDocuments } from "./documents.ts";
import { lawyerRatings } from "./ratings.ts";
import { subscriptions, subscriptionPlans } from "./subscriptions.ts";
import { payments } from "./payments.ts";
import { withdrawalRequests } from "./withdrawals.ts";
import { videoCalls } from "./videoCalls.ts";
import { appNotifications, fcmTokens } from "./notifications.ts";
import { knowledgeItems } from "./knowledgeBase.ts";
import { chatMessages } from "./chat.ts";
import { contactInquiries } from "./support.ts";
import { aiCaseAnalyses } from "./ai.ts";
import { migrations, type Migration, type NewMigration } from "./migrations.ts";
import {
  caseCategories,
  caseSpecializations,
  legalServices,
  cities,
  districts,
  courts,
  states,
  courtLevels,
  languages,
} from "./masterData.ts";

export const userRelations = relations(users, ({ one }: any) => ({
  citizen: one(citizens, {
    fields: [users.id],
    references: [citizens.userId],
  }),
  lawyer: one(lawyers, {
    fields: [users.id],
    references: [lawyers.userId],
  }),
  adminProfile: one(adminProfiles, {
    fields: [users.id],
    references: [adminProfiles.userId],
  }),
}));

export const citizenRelations = relations(citizens, ({ one, many }: any) => ({
  user: one(users, {
    fields: [citizens.userId],
    references: [users.id],
  }),
  cases: many(cases),
  subscriptions: many(subscriptions),
  payments: many(payments),
}));

export const lawyerRelations = relations(lawyers, ({ one, many }: any) => ({
  user: one(users, {
    fields: [lawyers.userId],
    references: [users.id],
  }),
  cases: many(cases),
  ratings: many(lawyerRatings),
  withdrawals: many(withdrawalRequests),
  documents: many(lawyerDocuments),
}));

export const caseRelations = relations(cases, ({ one, many }: any) => ({
  citizen: one(citizens, {
    fields: [cases.citizenId],
    references: [citizens.id],
  }),
  lawyer: one(lawyers, {
    fields: [cases.lawyerId],
    references: [lawyers.id],
  }),
  hearings: many(caseHearings),
  orders: many(caseOrders),
  notes: many(caseNotes),
  documents: many(caseDocuments),
  videoCalls: many(videoCalls),
  messages: many(chatMessages),
  aiAnalyses: many(aiCaseAnalyses),
}));

export const caseCategoriesRelations = relations(caseCategories, ({ many }: any) => ({
  specializations: many(caseSpecializations),
  legalServices: many(legalServices),
}));

export const caseSpecializationsRelations = relations(caseSpecializations, ({ one, many }: any) => ({
  category: one(caseCategories, {
    fields: [caseSpecializations.categoryId],
    references: [caseCategories.id],
  }),
  legalServices: many(legalServices),
}));

export const legalServicesRelations = relations(legalServices, ({ one }: any) => ({
  specialization: one(caseSpecializations, {
    fields: [legalServices.specializationId],
    references: [caseSpecializations.id],
  }),
  category: one(caseCategories, {
    fields: [legalServices.categoryId],
    references: [caseCategories.id],
  }),
}));

export {
  users,
  citizens,
  lawyers,
  adminProfiles,
  cases,
  caseHearings,
  caseOrders,
  caseNotes,
  caseDocuments,
  lawyerDocuments,
  lawyerRatings,
  subscriptions,
  subscriptionPlans,
  payments,
  withdrawalRequests,
  videoCalls,
  appNotifications,
  fcmTokens,
  knowledgeItems,
  chatMessages,
  contactInquiries,
  aiCaseAnalyses,
  caseCategories,
  caseSpecializations,
  legalServices,
  cities,
  districts,
  courts,
  states,
  courtLevels,
  languages,
  migrations,
  type Migration,
  type NewMigration,
  type LawyerPracticeAreaItem,
};

