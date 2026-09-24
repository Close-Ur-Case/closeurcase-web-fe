/**
 * API Contract Types for CloseUrCase Platform
 * Aligned with Supabase Edge Functions Zod Schemas
 */

export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  success: false;
  errors?: unknown[];
  stack?: string;
}

// ============================================================================
// Auth Schemas
// ============================================================================

export interface SendOtpPayload {
  phone?: string;
  email?: string;
  identifier?: string;
}

export interface VerifyOtpPayload {
  token: string;
  phone?: string;
  email?: string;
  identifier?: string;
  name?: string;
  city?: string;
}

export interface LawyerRegisterPayload {
  name: string;
  email: string;
  phone: string;
  password?: string;
  confirmPassword?: string;
  roleTitle?: string;
  registrationType?: "lawyer" | "firm";
  barId: string;
  category?: string;
  city: string;
  cities?: string[];
  practiceAreas?: string[];
  specializations?: string[];
  legalServices?: string[];
  experienceYears?: number;
  languages?: string[];
  courts?: string[];
  officeAddress?: string;
  bio?: string;
  awards?: Array<{ title: string; year?: string }>;
  photoUrl?: string;
  idProofUrl?: string;
  idProofFileName?: string;
  declarationAccepted?: boolean;
  consultationFee?: number;
}

export interface LawyerLoginPayload {
  email: string;
  password: string;
}

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  role: "citizen" | "lawyer" | "admin";
  email?: string | null;
  phone?: string | null;
  name?: string;
  city?: string;
  citizenId?: string;
  lawyerId?: string;
  signupMethod?: "email" | "phone";
  [key: string]: unknown;
}

export interface AuthSessionData {
  accessToken?: string;
  refreshToken?: string;
}

export interface AuthResponseData {
  user?: AuthUser;
  token?: string;
  session?: AuthSessionData;
  lawyer?: Record<string, unknown>;
  admin?: Record<string, unknown>;
  message?: string;
}

// ============================================================================
// Cases & Workflows
// ============================================================================

export interface CaseDocumentItem {
  id?: string;
  name: string;
  fileUrl: string;
  size?: string;
  fileMimeType?: string;
  uploadedAt?: string;
}

export interface CreateUserCasePayload {
  id?: string;
  citizenId?: string;
  lawyerId?: string;
  caseType: "new" | "pending" | "closed" | string;
  cnr?: string;
  petitioner: string;
  respondent?: string;
  title?: string;
  description: string;
  documents?: CaseDocumentItem[];
  practiceArea: string;
  specialization: string;
  legalServices?: string[];
  city?: string;
  isEmergency?: boolean;
}

export interface UpdateLawyerCaseStagePayload {
  stage: "accepted" | "rejected" | "filinginprogress" | "cnrgenerated" | string;
  rejectionReason?: string;
  generatedCnr?: string;
}

export interface ImportCasePayload {
  cnr?: string;
  rawData?: unknown;
}

// ============================================================================
// Master Data & Taxonomies
// ============================================================================

export interface MasterLegalService {
  id: string;
  specializationId: string;
  name: string;
  code: string;
  description?: string;
  baseFee?: number;
}

export interface MasterSpecialization {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  description?: string;
  services?: MasterLegalService[];
}

export interface MasterCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  /** Soft-delete flag on the master `case_categories` table; the API returns it
   * on every category, and the admin taxonomy screen reads it. */
  active?: boolean;
  subCategories?: MasterSpecialization[];
}

export interface MasterCourt {
  id: string;
  name: string;
  code?: string;
  level?: string;
  courtLevel?: string;
  state?: string;
  city?: string;
  district?: string;
  active?: boolean;
}

export interface MasterCity {
  id: string;
  name: string;
  state?: string;
}

// ============================================================================
// Lawyer Lifecycle & Profile Payloads
// ============================================================================

export interface UpdateLawyerProfilePayload {
  name?: string;
  bio?: string;
  consultationFee?: number;
  experienceYears?: number;
  cities?: string[];
  practiceAreas?: string[];
  specializations?: string[];
  legalServices?: string[];
  languages?: string[];
}

export interface ToggleAvailabilityPayload {
  availability: "Online" | "Offline" | "In Consultation";
}

export interface UpdateBankDetailsPayload {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolderName?: string;
}

export interface ModerateLawyerPayload {
  status: "Approved" | "Rejected" | "Suspended" | "Pending";
  moderationNotes?: string;
}

export interface LawyerQueryParams {
  search?: string;
  city?: string;
  area?: string;
  category?: string;
  status?: string;
  practiceArea?: string;
  specialization?: string;
  legalService?: string;
  matchMode?: "all" | "any";
  language?: string;
  limit?: string;
  offset?: string;
}

// ============================================================================
// Citizen Profile & Subscriptions Payloads
// ============================================================================

export interface CitizenProfile {
  id: string;
  userId?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  currentLocation?: string | null;
  address?: string | null;
  state?: string | null;
  stateId?: string | null;
  districtId?: string | null;
  status?: string;
  avatarUrl?: string | null;
  joinedAt?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateCitizenMePayload {
  fullName?: string;
  name?: string;
  city?: string;
  state?: string;
  currentLocation?: string;
  avatarUrl?: string | null;
  phone?: string;
  email?: string;
  address?: string;
}

export interface UpdateCitizenPayload {
  fullName?: string;
  phone?: string;
  email?: string;
  city?: string;
  status?: string;
}

export interface CitizenSubscription {
  id: string;
  citizenId: string;
  planId: string;
  status: string;
  startedAt: string;
  expiresAt?: string;
}

// ============================================================================
// Payment & Withdrawal Payloads
// ============================================================================

export interface CreatePaymentOrderPayload {
  amount: number;
  currency?: string;
  caseId?: string;
  subscriptionId?: string;
  receipt?: string;
  notes?: Record<string, unknown>;
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  source?: "commission" | "subscription" | string;
  grossAmount?: number;
  citizenId?: string;
  citizenName?: string;
  lawyerId?: string;
  lawyerName?: string;
  caseId?: string;
  caseTitle?: string;
  planId?: string;
  planLabel?: string;
}

export interface PaymentRecord {
  id: string;
  source: string;
  date: string;
  status: string;
  grossAmount: number;
  platformAmount: number;
  lawyerAmount: number;
  citizenId?: string | null;
  citizenName?: string | null;
  lawyerId?: string | null;
  lawyerName?: string | null;
  caseId?: string | null;
  caseTitle?: string | null;
  planId?: string | null;
  planLabel?: string | null;
  receiptUrl?: string | null;
  createdAt?: string;
}

export interface CreateWithdrawalPayload {
  lawyerId: string;
  lawyerName?: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  notes?: string;
}

export interface WithdrawalRecord {
  id: string;
  lawyerId: string;
  lawyerName: string;
  amount: number;
  requestedAt: string;
  status: "Pending" | "Approved" | "Rejected";
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  processedAt?: string | null;
  referenceId?: string | null;
  rejectionReason?: string | null;
  createdAt?: string;
}

export interface WithdrawalSummary {
  totalWithdrawn: number;
  pendingWithdrawal: number;
  balance?: number;
}

// ============================================================================
// Notification Center & FCM Payloads
// ============================================================================

export interface NotificationItem {
  id: string;
  userId?: string | null;
  role: "citizen" | "lawyer" | "admin" | "all" | string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  createdAt?: string;
}

/** `userId`/`role` are not part of this payload — the backend derives both
 * from the authenticated session, never from client-supplied values (a
 * client-chosen `userId` would let anyone register a push destination under
 * someone else's account). */
export interface RegisterFcmTokenPayload {
  deviceToken: string;
  deviceType?: "web" | "android" | "ios" | string;
}

export interface NotificationQueryParams {
  role?: string;
  limit?: number;
}

// ============================================================================
// Knowledge Base Payloads
// ============================================================================

export interface KnowledgeBaseItem {
  id: string;
  title: string;
  type: string;
  category: string;
  size?: string;
  fileUrl?: string | null;
  fileName?: string;
  fileMimeType?: string;
  uploadedAt?: string;
  createdAt?: string;
}

export interface CreateKnowledgeItemPayload {
  title: string;
  type: string;
  category: string;
  size?: string;
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
}

export interface KnowledgeQueryParams {
  category?: string;
  type?: string;
}

// ============================================================================
// Extended Master Data Models
// ============================================================================

export interface MasterState {
  id: string;
  name: string;
  code: string;
  districts?: string[];
}

export interface MasterCourtLevel {
  id: string;
  name: string;
  code: string;
  levelOrder?: number;
}

export interface MasterDistrict {
  id: string;
  stateId: string;
  name: string;
}

// ============================================================================
// Real-time Chat & Video Consultation Payloads
// ============================================================================

export interface ApiChatMessage {
  id: string;
  caseId: string;
  sender: "citizen" | "lawyer";
  senderName: string;
  text?: string | null;
  message?: string | null;
  attachmentType?: "image" | "file" | "audio" | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  attachmentSize?: string | null;
  audioDuration?: number | null;
  read: boolean;
  at: string;
  createdAt?: string;
}

export interface SendChatMessagePayload {
  message?: string;
  text?: string;
  sender?: "citizen" | "lawyer";
  senderRole?: "citizen" | "lawyer";
  senderName?: string;
  senderId?: string;
  attachmentType?: "image" | "file" | "audio" | string;
  attachmentName?: string;
  attachmentUrl?: string;
  attachmentSize?: string;
  audioDuration?: number;
}

export interface AgoraTokenPayload {
  channelName: string;
  role?: "publisher" | "subscriber";
  uid?: number;
  expireSeconds?: number;
}

export interface AgoraTokenResponse {
  appId: string;
  channelName: string;
  uid: number;
  token: string;
  expiresIn: number;
}

export interface LogCallPayload {
  caseId: string;
  withName?: string;
  channelName?: string;
  callerId?: string;
  receiverId?: string;
  role?: string;
  status?: string;
  durationSeconds?: number;
}

export interface VideoCallRecord {
  id: string;
  caseId: string;
  channelName?: string;
  withName: string;
  callerId?: string | null;
  receiverId?: string | null;
  at: string;
  durationSeconds?: number;
  status: string;
  role: string;
  createdAt?: string;
}

// ============================================================================
// AI Legal Assistant & Case Insights Payloads
// ============================================================================

export interface GenerateCounterPayload {
  argument?: string;
  argumentText?: string;
  caseId?: string;
  caseCategory?: string;
  jurisdiction?: string;
}

export interface GenerateCounterResponse {
  originalArgument: string;
  counterText: string;
  authorities: string[];
  confidenceScore: number;
  status: string;
}

export interface CaseQAPayload {
  caseId: string;
  question: string;
}

export interface CaseQAResponse {
  caseId: string;
  question: string;
  answer: string;
  timestamp: string;
}

export interface LegalQAPayload {
  question: string;
  context?: string;
  category?: string;
}

export interface LegalQAResponse {
  question: string;
  answer: string;
  followUps?: string[];
  sources?: string[];
  confidenceScore?: number;
  timestamp: string;
}

export interface SummarizeDocPayload {
  documentTitle?: string;
  documentText?: string;
  title?: string;
  text?: string;
  focusArea?: string;
}

export interface SummarizeDocResponse {
  title: string;
  summary: string;
  keyPoints: string[];
  pageCount?: number;
  classifiedType?: string;
}

export interface CaseAnalysisPayload {
  caseId?: string;
  briefText?: string;
  text?: string;
}

export interface CaseAnalysisResponse {
  id: string;
  caseId?: string | null;
  generatedAt: string;
  summary: string;
  strengthScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendedActions: string[];
  relevantPrecedents: string[];
  suggestedTimeline: { step: string; targetDays: string }[];
}

// ============================================================================
// Support Inquiries & Public Feedback Payloads
// ============================================================================

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  status: "New" | "In Review" | "Resolved" | "Archived" | string;
  createdAt: string;
}

export interface ContactInquiryPayload {
  name: string;
  email: string;
  phone?: string;
  category?: string;
  subject?: string;
  message: string;
}

export interface UpdateInquiryStatusPayload {
  status: "New" | "In Review" | "Resolved" | "Archived";
}

// ============================================================================
// Subscription Plans & Citizen Auto-Assign Payloads
// ============================================================================

export interface SubscriptionPlanItem {
  id: "free" | "daily" | "monthly" | "yearly" | string;
  label: string;
  price: number;
  cadence: string;
  badge?: string | null;
  audience: string;
  description: string;
  features: string[];
  active?: string | boolean;
  createdAt?: string;
}

export interface SubscriptionRecord {
  id: string;
  citizenId: string;
  planId: "free" | "daily" | "monthly" | "yearly" | string;
  planLabel: string;
  amount: number;
  startedAt: string;
  expiresAt?: string | null;
  status: "Active" | "Cancelled" | "Expired" | string;
  caseId?: string | null;
  createdAt?: string;
}

export interface CreateSubscriptionPayload {
  citizenId: string;
  planId: "free" | "daily" | "monthly" | "yearly" | string;
  amount: number;
  planLabel?: string;
  expiresAt?: string;
  caseId?: string;
}

// ============================================================================
// Super Admin Dashboard & Live Analytics Payloads
// ============================================================================

export interface AdminDashboardStats {
  citizens: {
    total: number;
  };
  lawyers: {
    total: number;
    pendingApproval: number;
  };
  cases: {
    total: number;
    active: number;
  };
  revenue: {
    totalVolume: number;
    platformCommission: number;
  };
  withdrawals: {
    pendingCount: number;
    pendingAmount: number;
  };
}

export interface AdminProfileRecord {
  id?: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  currentLocation?: string | null;
  avatarUrl?: string | null;
  role?: string;
}

export interface UpdateAdminMePayload {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  currentLocation?: string;
  avatarUrl?: string;
}

// ============================================================================
// Supabase Cloud Storage & Case Documents Payloads
// ============================================================================

export interface UploadFileResponse {
  fileName: string;
  size: string;
  mimeType: string;
  bucket: string;
  filePath: string;
  fileUrl: string;
}

export interface SignedUrlResponse {
  signedUrl: string;
}

export interface UploadFileOptions {
  bucket?: "case-documents" | "id-proofs" | "avatars" | "knowledge-base" | string;
  folder?: string;
}
