import { z } from "@hono/zod-openapi";

export const UpdateLawyerProfileSchema = z
  .object({
    name: z.string().optional().openapi({ example: "Adv. Sneha Kulkarni" }),
    bio: z.string().optional().openapi({ example: "Specialist in corporate & cyber law." }),
    consultationFee: z.number().optional().openapi({ example: 2000 }),
    experienceYears: z.number().optional().openapi({ example: 10 }),
    cities: z.array(z.string()).optional().openapi({ example: ["Mumbai", "Pune"] }),
    languages: z.array(z.string()).optional().openapi({ example: ["English", "Hindi", "Marathi"] }),
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
