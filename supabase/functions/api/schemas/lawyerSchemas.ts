import { z } from "@hono/zod-openapi";

export const LinkedLanguageSchema = z
  .object({
    id: z.string().openapi({ example: "lang_te", description: "Master data language ID" }),
    name: z.string().openapi({ example: "Telugu", description: "Language name in English" }),
    nativeName: z.string().openapi({ example: "తెలుగు", description: "Native language script name" }),
    code: z.string().openapi({ example: "te", description: "ISO 639-1 language code" }),
    active: z.boolean().openapi({ example: true }),
  })
  .openapi("LinkedLanguage");

export const SyncLawyerLanguagesSchema = z
  .object({
    languages: z.array(z.string()).openapi({
      example: ["lang_en", "lang_te", "lang_hi"],
      description: "Array of language IDs (e.g. lang_en, lang_te) or names/codes to save in lawyers.languages",
    }),
  })
  .openapi("SyncLawyerLanguagesRequest");

export const LawyerCategoryDetailSchema = z
  .object({
    categoryId: z.string().openapi({ example: "cat_1", description: "Master case category ID" }),
    categoryName: z.string().openapi({ example: "Criminal Defense", description: "Category / Practice Area name" }),
    code: z.string().openapi({ example: "CRIM", description: "Category code" }),
    specializations: z.array(
      z.object({
        id: z.string().openapi({ example: "spec_1_1", description: "Specialization ID" }),
        name: z.string().openapi({ example: "Anticipatory Bail", description: "Sub-category specialization name" }),
        services: z.array(
          z.object({
            id: z.string().openapi({ example: "srv_1_1_1", description: "Legal service ID" }),
            name: z.string().openapi({ example: "File Anticipatory Bail Application", description: "Legal service name" }),
          })
        ),
      })
    ),
  })
  .openapi("LawyerCategoryDetail");

export const UpdateLawyerProfileSchema = z
  .object({
    name: z.string().optional().openapi({ example: "Adv. Sneha Kulkarni" }),
    bio: z.string().optional().openapi({ example: "Specialist in corporate & cyber law." }),
    consultationFee: z.number().optional().openapi({ example: 2000 }),
    experienceYears: z.number().optional().openapi({ example: 10 }),
    cities: z.array(z.string()).optional().openapi({ example: ["Mumbai", "Pune"] }),
    practiceAreas: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["cat_1", "cat_6"],
        description: "Array of category IDs from master case_categories (e.g. 'cat_1', 'cat_6'). Display names or codes are also accepted on write and normalized to IDs.",
      }),
    specializations: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["spec_1_1", "spec_1_2"],
        description: "Array of specialization IDs from case_categories.sub_categories[].id (e.g. 'spec_1_1'). Display names are also accepted on write and normalized to IDs.",
      }),
    legalServices: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["srv_1_1_1", "srv_1_1_2"],
        description: "Array of legal service IDs from case_categories.sub_categories[].services[].id (e.g. 'srv_1_1_1'). Display names are also accepted on write and normalized to IDs.",
      }),
    languages: z.array(z.string()).optional().openapi({
      example: ["lang_en", "lang_te", "lang_hi"],
      description: "Array of master data language IDs (e.g. 'lang_en', 'lang_te') saved in languages column",
    }),
  })
  .openapi("UpdateLawyerProfileRequest");

export const ToggleAvailabilitySchema = z
  .object({
    availability: z.enum(["Online", "Offline", "In Consultation"]).openapi({ example: "Online" }),
  })
  .openapi("ToggleAvailabilityRequest");

export const UpdateBankDetailsSchema = z
  .object({
    bankName: z.string().openapi({ example: "HDFC Bank" }),
    accountNumber: z.string().openapi({ example: "50100234567890" }),
    ifscCode: z.string().openapi({ example: "HDFC0001234" }),
    accountHolderName: z.string().optional().openapi({ example: "Sneha Kulkarni" }),
  })
  .openapi("UpdateBankDetailsRequest");

export const ModerateLawyerSchema = z
  .object({
    status: z.enum(["Approved", "Rejected", "Suspended", "Pending"]).openapi({ example: "Approved" }),
    moderationNotes: z.string().optional().openapi({ example: "Bar Council certificate verified." }),
  })
  .openapi("ModerateLawyerRequest");

export const SubmitRatingSchema = z
  .object({
    rating: z.number().min(1).max(5).openapi({ example: 5 }),
    review: z.string().optional().openapi({ example: "Very patient advocate, gave clear guidance on property succession." }),
    citizenId: z.string().optional().openapi({ example: "u_001" }),
    caseId: z.string().optional().openapi({ example: "c_102" }),
  })
  .openapi("SubmitRatingRequest");
