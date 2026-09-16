export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "CloseUrCase Supabase Edge API",
    version: "1.0.0",
    description: `
**Production-ready REST API for CloseUrCase Platform** running natively on Deno and Supabase Edge Functions.

### Core Features:
- 🔐 **Authentication**: Supabase Phone OTP for Citizens, Email & Password for Lawyers & Superadmin
- ⚖️ **Cases & Docket**: Full legal case filing, hearings timeline, case notes & lawyer assignments
- 💬 **Case Consultation Chat**: Real-time messaging, voice notes, attachments between citizen & lawyer
- 👨‍⚖️ **Lawyers**: Verified lawyer directory, availability toggle, bank details, ratings, and moderation
- 💳 **Payments & Billing**: Razorpay orders, payment verification, and lawyer withdrawal requests
- 📦 **Subscription Plans**: Tiered citizen plans (Free, Monthly ₹499, Yearly ₹4999) with features
- 📹 **Video Calling**: Agora RTC token generation for lawyer-client secure consultations
- 🤖 **AI Legal Assistant**: Legal counter-argument generator, case Q&A, and executive document summarizer
- 🔔 **Push Notifications**: Firebase Cloud Messaging (FCM) & in-app notification center
- 🏛️ **Master Data Management**: Full CRUD for 7 taxonomies (categories, cities, courts, states, languages)
- 📊 **Superadmin Metrics**: High-level platform statistics and financial analytics
    `,
  },
  servers: [
    {
      url: "http://localhost:8000",
      description: "Local Development Server (Current active)",
    },
    {
      url: "https://zxsizwzjktorqjlzzchg.supabase.co/functions/v1/api",
      description: "Supabase Cloud Edge Function (Production)",
    },
    {
      url: "http://localhost:54321/functions/v1/api",
      description: "Local Supabase CLI (Docker)",
    },
  ],
  tags: [
    { name: "System", description: "Health checks and database initialization" },
    { name: "Auth - Citizen", description: "Phone OTP authentication for citizens" },
    { name: "Auth - Lawyer", description: "Email & password authentication for lawyers" },
    { name: "Citizens", description: "Citizen profile and subscription management" },
    { name: "Cases", description: "Case docket, hearings, notes, and assignments" },
    { name: "Chat", description: "Case consultation messaging and attachments" },
    { name: "Lawyers", description: "Directory search, profiles, availability, and moderation" },
    { name: "Subscriptions", description: "Subscription plans catalog and citizen subscriptions" },
    { name: "Payments", description: "Razorpay order creation and payment verification" },
    { name: "Withdrawals", description: "Lawyer earnings payout requests and approvals" },
    { name: "Video Calls", description: "Agora RTC token generation for consultations" },
    { name: "AI Assistant", description: "AI counter-arguments, case Q&A, and document summarization" },
    { name: "Support", description: "Contact inquiries and public feedback" },
    { name: "Notifications", description: "In-app notifications and push alerts" },
    { name: "Master Data", description: "Taxonomies, legal categories, cities, courts CRUD" },
    { name: "Admin", description: "Superadmin overview metrics and moderation" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Supabase JWT Access Token. Format: Bearer <token>",
      },
    },
    schemas: {
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          statusCode: { type: "integer", example: 400 },
          message: { type: "string", example: "Invalid input provided" },
        },
      },
      SendOtpRequest: {
        type: "object",
        required: ["phone"],
        properties: {
          phone: { type: "string", example: "+919876543210", description: "Citizen 10-digit mobile number with +91 country code" },
        },
      },
      VerifyOtpRequest: {
        type: "object",
        required: ["phone", "token"],
        properties: {
          phone: { type: "string", example: "+919876543210" },
          token: { type: "string", example: "123456", description: "6-digit OTP code received via SMS" },
        },
      },
      LawyerRegisterRequest: {
        type: "object",
        required: ["name", "email", "phone", "password", "barId", "category", "city"],
        properties: {
          name: { type: "string", example: "Adv. Sneha Kulkarni" },
          email: { type: "string", example: "sneha.kulkarni@example.com" },
          phone: { type: "string", example: "+919876500002" },
          password: { type: "string", example: "SecretPassword123!" },
          confirmPassword: { type: "string", example: "SecretPassword123!" },
          barId: { type: "string", example: "MAH/4567/2016" },
          category: { type: "string", example: "Family & Matrimonial" },
          city: { type: "string", example: "Mumbai" },
          cities: { type: "array", items: { type: "string" }, example: ["Mumbai", "Thane", "Navi Mumbai"] },
          experienceYears: { type: "integer", example: 8 },
          consultationFee: { type: "integer", example: 1500 },
          bio: { type: "string", example: "Specialist in family disputes, mutual consent divorce, and high court appeals." },
        },
      },
      LawyerLoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "sneha.kulkarni@example.com" },
          password: { type: "string", example: "SecretPassword123!" },
        },
      },
      CreateCaseRequest: {
        type: "object",
        required: ["title", "caseType", "description", "courtName"],
        properties: {
          title: { type: "string", example: "Commercial Lease Agreement Breach" },
          caseType: { type: "string", example: "Civil" },
          category: { type: "string", example: "Corporate & Commercial" },
          courtName: { type: "string", example: "City Civil Court Mumbai" },
          caseNumber: { type: "string", example: "CC/4521/2026" },
          description: { type: "string", example: "Dispute over unreturned security deposit and lease termination terms." },
          claimAmount: { type: "number", example: 500000 },
          priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"], example: "High" },
          city: { type: "string", example: "Mumbai" },
          isEmergency: { type: "boolean", example: false },
        },
      },
      SendChatMessageRequest: {
        type: "object",
        required: ["sender", "senderName"],
        properties: {
          sender: { type: "string", enum: ["citizen", "lawyer"], example: "citizen" },
          senderName: { type: "string", example: "Sai Teja Reddy" },
          text: { type: "string", example: "Advocate, I have uploaded the municipal survey demarcation report." },
          attachmentType: { type: "string", enum: ["image", "file", "audio"], example: "file" },
          attachmentName: { type: "string", example: "demarcation_report.pdf" },
          attachmentUrl: { type: "string", example: "https://closeurcase.app/docs/report.pdf" },
          attachmentSize: { type: "string", example: "1.4 MB" },
        },
      },
      ContactInquiryRequest: {
        type: "object",
        required: ["name", "email", "subject", "message"],
        properties: {
          name: { type: "string", example: "Vikramaditya Construction Ltd" },
          email: { type: "string", example: "legal@vikramaditya.in" },
          category: { type: "string", example: "corporate" },
          subject: { type: "string", example: "Corporate Legal Empanelment" },
          message: { type: "string", example: "We would like to empanel our corporate matters for nationwide dispute resolution." },
        },
      },
      GenerateCounterRequest: {
        type: "object",
        required: ["argumentText"],
        properties: {
          caseId: { type: "string", example: "CUC-20260831154512" },
          argumentText: { type: "string", example: "Developer asserts force majeure due to municipal approval delays and supply chain shortages." },
        },
      },
      CaseQARequest: {
        type: "object",
        required: ["caseId", "question"],
        properties: {
          caseId: { type: "string", example: "CUC-20260831154512" },
          question: { type: "string", example: "When is the next court hearing scheduled and before which judge?" },
        },
      },
      SummarizeDocRequest: {
        type: "object",
        properties: {
          documentTitle: { type: "string", example: "Commercial Lease Deed" },
          documentText: { type: "string", example: "Full text or excerpt of the contract..." },
          documentUrl: { type: "string", example: "https://closeurcase.app/docs/lease.pdf" },
        },
      },
      CreateWithdrawalRequest: {
        type: "object",
        required: ["lawyerId", "amount", "bankName", "accountNumber", "ifscCode"],
        properties: {
          lawyerId: { type: "string", example: "l_001" },
          lawyerName: { type: "string", example: "Adv. Swathi Reddy" },
          amount: { type: "integer", example: 12000 },
          bankName: { type: "string", example: "HDFC Bank Ltd" },
          accountNumber: { type: "string", example: "50100234567890" },
          ifscCode: { type: "string", example: "HDFC0001234" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "API Health Check",
        responses: { "200": { description: "Service is operational" } },
      },
    },
    "/init-db": {
      get: {
        tags: ["System"],
        summary: "1-Click Database Setup & Seed",
        description: "Verifies and auto-creates all 20 tables and populates full frontend mockup data.",
        responses: { "200": { description: "Database initialized successfully" } },
      },
      post: {
        tags: ["System"],
        summary: "Trigger Database Setup via POST",
        responses: { "200": { description: "Database initialized" } },
      },
    },
    "/auth/citizen/send-otp": {
      post: {
        tags: ["Auth - Citizen"],
        summary: "Send SMS OTP to citizen mobile number",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SendOtpRequest" } } } },
        responses: { "200": { description: "OTP sent successfully" } },
      },
    },
    "/auth/citizen/verify-otp": {
      post: {
        tags: ["Auth - Citizen"],
        summary: "Verify citizen OTP & authenticate",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyOtpRequest" } } } },
        responses: { "200": { description: "Session authenticated with JWT token" } },
      },
    },
    "/auth/lawyer/register": {
      post: {
        tags: ["Auth - Lawyer"],
        summary: "Register new advocate account",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LawyerRegisterRequest" } } } },
        responses: { "201": { description: "Lawyer registered successfully" } },
      },
    },
    "/auth/lawyer/login": {
      post: {
        tags: ["Auth - Lawyer"],
        summary: "Lawyer email & password login",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LawyerLoginRequest" } } } },
        responses: { "200": { description: "Login successful with JWT access token" } },
      },
    },
    "/citizens/me": {
      get: {
        tags: ["Citizens"],
        summary: "Get current citizen profile",
        responses: { "200": { description: "Citizen profile returned" } },
      },
      patch: {
        tags: ["Citizens"],
        summary: "Update citizen profile (address, phone, emergency contact)",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { address: { type: "string" }, state: { type: "string" }, pincode: { type: "string" }, emergencyContact: { type: "string" } } } } } },
        responses: { "200": { description: "Profile updated" } },
      },
    },
    "/cases": {
      get: {
        tags: ["Cases"],
        summary: "List legal cases with filtering",
        parameters: [
          { name: "cnr", in: "query", schema: { type: "string", example: "DLND020047882015" }, description: "Filter by 16-character eCourts CNR number" },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "search", in: "query", schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        ],
        responses: { "200": { description: "Cases list retrieved" } },
      },
      post: {
        tags: ["Cases"],
        summary: "File a new legal case",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateCaseRequest" } } } },
        responses: { "201": { description: "Case created successfully" } },
      },
    },
    "/cases/cnr/{cnr}": {
      get: {
        tags: ["Cases"],
        summary: "Get case details by unique eCourts CNR number",
        parameters: [{ name: "cnr", in: "path", required: true, schema: { type: "string", example: "DLND020047882015" } }],
        responses: { "200": { description: "Case details retrieved by CNR" } },
      },
    },
    "/cases/{id}": {
      get: {
        tags: ["Cases"],
        summary: "Get case details by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "CUC-20260831154512" } }],
        responses: { "200": { description: "Case details retrieved" } },
      },
    },
    "/cases/{id}/messages": {
      get: {
        tags: ["Chat"],
        summary: "Get case consultation chat messages",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "CUC-20260831154512" } }],
        responses: { "200": { description: "Chat messages list" } },
      },
      post: {
        tags: ["Chat"],
        summary: "Send consultation message / audio / attachment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "CUC-20260831154512" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SendChatMessageRequest" } } } },
        responses: { "201": { description: "Message sent" } },
      },
    },
    "/cases/{id}/messages/read": {
      patch: {
        tags: ["Chat"],
        summary: "Mark case messages as read",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "CUC-20260831154512" } }],
        responses: { "200": { description: "Messages marked read" } },
      },
    },
    "/lawyers": {
      get: {
        tags: ["Lawyers"],
        summary: "Search & browse verified advocates directory",
        parameters: [
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "city", in: "query", schema: { type: "string" } },
          { name: "experience", in: "query", schema: { type: "integer" } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Lawyers directory list" } },
      },
    },
    "/lawyers/{id}/availability": {
      patch: {
        tags: ["Lawyers"],
        summary: "Toggle lawyer online/offline status",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "l_001" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { availabilityStatus: { type: "string", enum: ["Online", "Offline"], example: "Online" } } } } } },
        responses: { "200": { description: "Status updated" } },
      },
    },
    "/lawyers/{id}/bank-details": {
      patch: {
        tags: ["Lawyers"],
        summary: "Save bank account details for payouts",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "l_001" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { bankName: { type: "string", example: "HDFC Bank" }, accountNumber: { type: "string", example: "50100234567890" }, ifscCode: { type: "string", example: "HDFC0001234" } } } } } },
        responses: { "200": { description: "Bank details saved" } },
      },
    },
    "/lawyers/{id}/moderate": {
      patch: {
        tags: ["Lawyers"],
        summary: "Admin moderate lawyer account",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "l_001" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["Approved", "Rejected", "Suspended", "Pending"], example: "Approved" } } } } } },
        responses: { "200": { description: "Moderation status updated" } },
      },
    },
    "/subscriptions/plans": {
      get: {
        tags: ["Subscriptions"],
        summary: "Get citizen subscription plans catalog (Free, Monthly, Yearly)",
        responses: { "200": { description: "Plans catalog list" } },
      },
    },
    "/subscriptions": {
      get: {
        tags: ["Subscriptions"],
        summary: "List citizen subscriptions",
        parameters: [{ name: "citizenId", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Subscriptions list" } },
      },
      post: {
        tags: ["Subscriptions"],
        summary: "Subscribe to an Auto-Assign plan",
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["citizenId", "planId", "amount"], properties: { citizenId: { type: "string", example: "u_001" }, planId: { type: "string", example: "monthly" }, amount: { type: "integer", example: 499 } } } } } },
        responses: { "201": { description: "Subscription created" } },
      },
    },
    "/withdrawals": {
      get: {
        tags: ["Withdrawals"],
        summary: "List payout requests",
        parameters: [{ name: "lawyerId", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Withdrawals list" } },
      },
      post: {
        tags: ["Withdrawals"],
        summary: "Submit lawyer payout request",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CreateWithdrawalRequest" } } } },
        responses: { "201": { description: "Payout requested" } },
      },
    },
    "/withdrawals/summary": {
      get: {
        tags: ["Withdrawals"],
        summary: "Get lawyer earnings and withdrawal balance",
        parameters: [{ name: "lawyerId", in: "query", required: true, schema: { type: "string", example: "l_001" } }],
        responses: { "200": { description: "Summary balance returned" } },
      },
    },
    "/withdrawals/{id}/approve": {
      patch: {
        tags: ["Withdrawals"],
        summary: "Admin approve payout request",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "w_102" } }],
        responses: { "200": { description: "Payout approved" } },
      },
    },
    "/withdrawals/{id}/reject": {
      patch: {
        tags: ["Withdrawals"],
        summary: "Admin reject payout request with reason",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "w_102" } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { rejectionReason: { type: "string", example: "IFSC Code mismatch" } } } } } },
        responses: { "200": { description: "Payout rejected" } },
      },
    },
    "/ai/generate-counter": {
      post: {
        tags: ["AI Assistant"],
        summary: "Generate statutory & precedent-backed legal counter-argument",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/GenerateCounterRequest" } } } },
        responses: { "200": { description: "Counter-argument with authorities returned" } },
      },
    },
    "/ai/case-qa": {
      post: {
        tags: ["AI Assistant"],
        summary: "Ask questions regarding case docket & hearings",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/CaseQARequest" } } } },
        responses: { "200": { description: "Q&A answer returned" } },
      },
    },
    "/ai/summarize-document": {
      post: {
        tags: ["AI Assistant"],
        summary: "Generate executive summary of legal document",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SummarizeDocRequest" } } } },
        responses: { "200": { description: "Executive summary and risks returned" } },
      },
    },
    "/support/contact": {
      post: {
        tags: ["Support"],
        summary: "Submit public contact inquiry or support request",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ContactInquiryRequest" } } } },
        responses: { "201": { description: "Inquiry submitted" } },
      },
    },
    "/support/inquiries": {
      get: {
        tags: ["Support"],
        summary: "List contact inquiries (Admin)",
        responses: { "200": { description: "Inquiries list" } },
      },
    },
    "/admin/dashboard-stats": {
      get: {
        tags: ["Admin"],
        summary: "Get superadmin overview metrics & financials",
        responses: { "200": { description: "Overview metrics" } },
      },
    },
    "/master-data/categories": {
      get: { tags: ["Master Data"], summary: "Get legal practice areas & categories", responses: { "200": { description: "Categories list" } } },
    },
    "/master-data/cities": {
      get: { tags: ["Master Data"], summary: "Get supported Indian cities & tiers", responses: { "200": { description: "Cities list" } } },
    },
    "/master-data/districts": {
      get: { tags: ["Master Data"], summary: "Get Indian districts", responses: { "200": { description: "Districts list" } } },
    },
    "/master-data/courts": {
      get: { tags: ["Master Data"], summary: "Get Indian courts list", responses: { "200": { description: "Courts list" } } },
    },
    "/master-data/languages": {
      get: { tags: ["Master Data"], summary: "Get supported consultation languages", responses: { "200": { description: "Languages list" } } },
    },
    "/master-data/states": {
      get: { tags: ["Master Data"], summary: "Get Indian states & UTs", responses: { "200": { description: "States list" } } },
    },
    "/master-data/court-levels": {
      get: { tags: ["Master Data"], summary: "Get court hierarchy levels", responses: { "200": { description: "Court levels list" } } },
    },
    "/master-data/{type}": {
      post: {
        tags: ["Master Data"],
        summary: "Admin add new taxonomy record",
        parameters: [{ name: "type", in: "path", required: true, schema: { type: "string", enum: ["categories", "cities", "districts", "courts", "states", "court-levels", "languages"] } }],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "201": { description: "Taxonomy record created" } },
      },
    },
    "/master-data/{type}/{id}": {
      put: {
        tags: ["Master Data"],
        summary: "Admin update taxonomy record",
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string" } },
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: { required: true, content: { "application/json": { schema: { type: "object" } } } },
        responses: { "200": { description: "Taxonomy record updated" } },
      },
      delete: {
        tags: ["Master Data"],
        summary: "Admin delete taxonomy record",
        parameters: [
          { name: "type", in: "path", required: true, schema: { type: "string" } },
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "200": { description: "Taxonomy record deleted" } },
      },
    },
  },
};
