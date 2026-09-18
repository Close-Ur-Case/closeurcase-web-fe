import { relations } from "drizzle-orm";
import { users, citizens, lawyers, adminProfiles, type LawyerPracticeAreaItem } from "./users.ts";
import { casesImported, type CaseImported, type NewCaseImported } from "./casesImported.ts";
import { lookups, type Lookup, type NewLookup } from "./lookups.ts";
import {
  casesUser,
  type CaseUser,
  type NewCaseUser,
  type UserCaseDocument,
  type UserCaseTimelineEvent,
} from "./casesUser.ts";
import { lawyerDocuments } from "./documents.ts";
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
  cases: many(casesUser),
  subscriptions: many(subscriptions),
  payments: many(payments),
}));

export const lawyerRelations = relations(lawyers, ({ one, many }: any) => ({
  user: one(users, {
    fields: [lawyers.userId],
    references: [users.id],
  }),
  cases: many(casesUser),
  ratings: many(lawyerRatings),
  withdrawals: many(withdrawalRequests),
  documents: many(lawyerDocuments),
}));

export const caseUserRelations = relations(casesUser, ({ one, many }: any) => ({
  citizen: one(citizens, {
    fields: [casesUser.citizenId],
    references: [citizens.id],
  }),
  lawyer: one(lawyers, {
    fields: [casesUser.lawyerId],
    references: [lawyers.id],
  }),
  caseTypeRel: one(lookups, {
    fields: [casesUser.caseType],
    references: [lookups.id],
  }),
  stageRel: one(lookups, {
    fields: [casesUser.lawyerCasestageId],
    references: [lookups.id],
  }),
  importedCase: one(casesImported, {
    fields: [casesUser.cnr],
    references: [casesImported.cnr],
  }),
  videoCalls: many(videoCalls),
  messages: many(chatMessages),
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

export const stateRelations = relations(states, ({ many }: any) => ({
  districts: many(districts),
  citizens: many(citizens),
  lawyers: many(lawyers),
  cases: many(casesUser),
  courts: many(courts),
}));

export const districtRelations = relations(districts, ({ one, many }: any) => ({
  state: one(states, {
    fields: [districts.stateId],
    references: [states.id],
  }),
  citizens: many(citizens),
  lawyers: many(lawyers),
  cases: many(casesUser),
  courts: many(courts),
}));

export {
  users,
  citizens,
  lawyers,
  adminProfiles,
  lookups,
  type Lookup,
  type NewLookup,
  casesImported,
  type CaseImported,
  type NewCaseImported,
  casesUser,
  casesUser as cases,
  type CaseUser,
  type NewCaseUser,
  type UserCaseDocument,
  type UserCaseTimelineEvent,
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
