# CloseUrCase Email Templates (`email-templates/`)

This directory contains branded, responsive HTML email templates strictly designed for **One-Time Passcode (OTP)** authentication. All magic links and confirmation URLs have been removed in favor of pure 6-digit OTP verification codes.

---

## 📁 Included Templates

1. **[`citizenOtp.html`](file:///Users/sariyam/lomaa/closeurcase/supabase/functions/api/email-templates/citizenOtp.html)**: Pure OTP login email with large 6-digit passcode card (`{{ .Token }}`), 10-minute expiry badge, and security notice.
2. **[`confirmSignup.html`](file:///Users/sariyam/lomaa/closeurcase/supabase/functions/api/email-templates/confirmSignup.html)**: Pure OTP onboarding email for new users containing only the 6-digit registration code (`{{ .Token }}`).
3. **[`index.ts`](file:///Users/sariyam/lomaa/closeurcase/supabase/functions/api/email-templates/index.ts)**: TypeScript generator function (`renderCitizenOtpEmail`) and Supabase Dashboard snippets.

---

## 🚀 Setting Up in Supabase Dashboard (Pure OTP Delivery)

To ensure Supabase sends pure OTP emails (and not magic links) to users:

1. Open your Supabase project:
   👉 **[Supabase Dashboard > Authentication > Email Templates](https://supabase.com/dashboard/project/zxsizwzjktorqjlzzchg/auth/templates)**
2. Select **"Magic Link"**:
   - Copy the HTML from [`citizenOtp.html`](file:///Users/sariyam/lomaa/closeurcase/supabase/functions/api/email-templates/citizenOtp.html).
   - Paste it into the **Message Body** and click **Save**.
3. Select **"Confirm signup"**:
   - Copy the HTML from [`confirmSignup.html`](file:///Users/sariyam/lomaa/closeurcase/supabase/functions/api/email-templates/confirmSignup.html).
   - Paste it into the **Message Body** and click **Save**.

---

## ⚡ Instant Preview in Browser

You can preview the pure OTP email template live from the API server:
- **Citizen OTP Preview**: [http://localhost:8000/api/v1/email-templates/preview/citizen-otp](http://localhost:8000/api/v1/email-templates/preview/citizen-otp)
- **Confirm Signup Preview**: [http://localhost:8000/api/v1/email-templates/preview/confirm-signup](http://localhost:8000/api/v1/email-templates/preview/confirm-signup)
