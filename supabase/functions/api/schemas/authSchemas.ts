import { z } from "@hono/zod-openapi";

export const SendCitizenOtpSchema = z
  .object({
    phone: z
      .string()
      .optional()
      .openapi({ example: "+919876543210", description: "Citizen 10-digit mobile number with +91 country code" }),
    email: z
      .string()
      .email()
      .optional()
      .openapi({ example: "citizen@example.com", description: "Citizen email address for OTP sign in" }),
    identifier: z
      .string()
      .optional()
      .openapi({ example: "+919876543210", description: "Flexible input: either mobile number or email address" }),
  })
  .openapi("SendCitizenOtpRequest");

export const VerifyCitizenOtpSchema = z
  .object({
    token: z.string().min(6).max(6).openapi({ example: "849201", description: "6-digit OTP code received" }),
    phone: z.string().optional().openapi({ example: "+919876543210" }),
    email: z.string().email().optional().openapi({ example: "citizen@example.com" }),
    identifier: z.string().optional().openapi({ example: "citizen@example.com" }),
    name: z.string().optional().openapi({ example: "Sai Teja Reddy" }),
    city: z.string().optional().openapi({ example: "Hyderabad" }),
  })
  .openapi("VerifyCitizenOtpRequest");

export const LawyerRegisterSchema = z
  .object({
    name: z.string().openapi({ example: "Adv. Sneha Kulkarni" }),
    email: z.string().email().openapi({ example: "sneha.kulkarni@example.com" }),
    phone: z.string().openapi({ example: "+919876500002" }),
    password: z.string().min(6).openapi({ example: "SecretPassword123!" }),
    confirmPassword: z.string().min(6).optional().openapi({ example: "SecretPassword123!" }),
    roleTitle: z.string().optional().openapi({ example: "Advocate" }),
    registrationType: z.enum(["lawyer", "firm"]).optional().openapi({ example: "lawyer" }),
    barId: z.string().openapi({ example: "MAH/4567/2016" }),
    category: z.string().openapi({ example: "Family & Matrimonial" }),
    city: z.string().openapi({ example: "Mumbai" }),
    cities: z.array(z.string()).optional().openapi({ example: ["Mumbai", "Thane", "Navi Mumbai"] }),
    practiceAreas: z
      .array(z.string())
      .optional()
      .openapi({
        example: ["Family Law", "Civil Litigation"],
        description: "Array of lawyer practice area names",
      }),
    specializations: z.array(z.string()).optional().openapi({ example: ["Mutual Consent Divorce", "Child Custody"] }),
    legalServices: z.array(z.string()).optional().openapi({ example: ["Legal Notice Drafting", "Court Representation"] }),
    experienceYears: z.number().optional().openapi({ example: 8 }),
    languages: z.array(z.string()).optional().openapi({
      example: ["lang_en", "lang_hi", "lang_mr"],
      description: "Languages spoken (accepts language IDs, names, or codes; saved as array of language IDs)",
    }),
    courts: z.array(z.string()).optional().openapi({ example: ["Bombay High Court", "Family Court Bandra"] }),
    officeAddress: z.string().optional().openapi({ example: "Suite 402, Nariman Point, Mumbai" }),
    bio: z.string().optional().openapi({ example: "Specialist in family disputes, mutual consent divorce, and high court appeals." }),
    awards: z.array(z.any()).optional().openapi({ example: [{ title: "Best Matrimonial Advocate", year: "2024" }] }),
    photoUrl: z.string().optional().openapi({ example: "https://example.com/photos/sneha.jpg" }),
    idProofUrl: z.string().optional().openapi({ example: "https://example.com/id-proofs/bar-card.pdf" }),
    idProofFileName: z.string().optional().openapi({ example: "bar_id_card.pdf" }),
    declarationAccepted: z.boolean().optional().openapi({ example: true }),
    consultationFee: z.number().optional().openapi({ example: 1500 }),
  })
  .openapi("LawyerRegisterRequest");

export const LawyerLoginSchema = z
  .object({
    email: z.string().email().openapi({ example: "sneha.kulkarni@example.com" }),
    password: z.string().openapi({ example: "SecretPassword123!" }),
  })
  .openapi("LawyerLoginRequest");

export const AdminLoginSchema = z
  .object({
    email: z.string().email().openapi({ example: "admin@closeurcase.app" }),
    password: z.string().openapi({ example: "admin123" }),
  })
  .openapi("AdminLoginRequest");

export const AuthResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
    token: z.string().optional().openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
    user: z.record(z.any()).optional(),
    message: z.string().optional().openapi({ example: "Authentication successful" }),
  })
  .openapi("AuthResponse");
