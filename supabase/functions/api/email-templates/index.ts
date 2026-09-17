/**
 * CloseUrCase Email Templates Module
 * Provides branded responsive HTML email templates strictly for One-Time Passcode (OTP)
 * verification with zero magic links.
 */

export interface EmailTemplateParams {
  token: string;
  name?: string;
  expiryMinutes?: number;
}

/**
 * Citizen OTP Email Template Generator (Pure OTP - No Magic Links)
 */
export function renderCitizenOtpEmail({
  token,
  name = "Citizen",
  expiryMinutes = 10,
}: EmailTemplateParams): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CloseUrCase - Verification Code</title>
  <style>
    body {
      margin: 0; padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc; color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper { width: 100%; table-layout: fixed; background-color: #f8fafc; padding: 40px 16px; }
    .container {
      max-width: 520px; margin: 0 auto; background-color: #ffffff;
      border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; text-align: center; }
    .header-logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; }
    .header-tagline { font-size: 13px; color: #94a3b8; margin-top: 6px; margin-bottom: 0; font-weight: 500; }
    .content { padding: 36px 32px; text-align: center; }
    .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; }
    .description { font-size: 15px; line-height: 24px; color: #475569; margin: 0 0 24px 0; text-align: left; }
    .otp-card {
      background: #f8fafc; border: 2px dashed #0284c7; border-radius: 14px;
      padding: 26px 20px; text-align: center; margin: 24px 0;
    }
    .otp-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 12px; }
    .otp-code {
      font-family: 'SF Pro Mono', Menlo, Monaco, Consolas, monospace;
      font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #0284c7; margin: 0; line-height: 1;
    }
    .badge { display: inline-block; margin-top: 14px; padding: 4px 12px; background-color: #e0f2fe; color: #0369a1; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .instruction { font-size: 14px; line-height: 22px; color: #475569; margin: 20px 0 0 0; text-align: left; }
    .notice {
      font-size: 13px; color: #64748b; line-height: 20px; margin: 24px 0 0 0;
      padding: 12px 16px; background-color: #fffbeb; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0;
      text-align: left;
    }
    .footer { background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer-text { font-size: 12px; line-height: 18px; color: #94a3b8; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1 class="header-logo">CloseUrCase</h1>
        <p class="header-tagline">Legal Services &amp; Case Resolution Platform</p>
      </div>
      <div class="content">
        <h2 class="greeting">Your One-Time Passcode</h2>
        <p class="description">
          Hello ${name}, we received a sign-in request for your CloseUrCase citizen account. Enter the verification code below to sign in:
        </p>
        <div class="otp-card">
          <div class="otp-label">Verification Code (OTP)</div>
          <div class="otp-code">${token}</div>
          <div class="badge">Valid for ${expiryMinutes} minutes</div>
        </div>
        <p class="instruction">
          Enter this 6-digit code on the <strong>Citizen Sign In</strong> page to complete authentication.
        </p>
        <div class="notice">
          <strong>Security Notice:</strong> Never share this OTP with anyone. CloseUrCase will never request your code via call, SMS, or chat.
        </div>
      </div>
      <div class="footer">
        <p class="footer-text">
          &copy; CloseUrCase Platform &bull; Automated Security Verification<br>
          Please do not reply directly to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Pre-formatted templates ready for pasting directly into Supabase Dashboard
 * (Authentication -> Email Templates -> "Magic Link" and "Confirm Signup")
 * Strictly pure OTP code only.
 */
export const supabaseDashboardTemplates = {
  /**
   * For Supabase Dashboard > Authentication > Email Templates > "Magic Link"
   */
  citizenOtpOnly: `<h2>Your CloseUrCase Login Code</h2>
<p>Your 6-digit verification code is:</p>
<div style="background: #f8fafc; border: 2px dashed #0284c7; border-radius: 12px; padding: 22px; text-align: center; margin: 20px 0;">
  <span style="font-family: monospace; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #0284c7;">{{ .Token }}</span>
  <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Code valid for 10 minutes &bull; Do not share with anyone</p>
</div>
<p>Enter this code on the CloseUrCase sign-in screen to authenticate.</p>`,

  /**
   * For Supabase Dashboard > Authentication > Email Templates > "Confirm Signup"
   */
  confirmSignupOtpOnly: `<h2>Welcome to CloseUrCase!</h2>
<p>Your registration verification code is:</p>
<div style="background: #f8fafc; border: 2px dashed #1e40af; border-radius: 12px; padding: 22px; text-align: center; margin: 20px 0;">
  <span style="font-family: monospace; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #1e40af;">{{ .Token }}</span>
  <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Code valid for 10 minutes</p>
</div>
<p>Enter this code on the CloseUrCase sign-in screen to complete your registration.</p>`,
};
