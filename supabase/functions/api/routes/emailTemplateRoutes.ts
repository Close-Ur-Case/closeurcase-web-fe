import { Hono } from "hono";
import { renderCitizenOtpEmail } from "../email-templates/index.ts";

const emailTemplates = new Hono();

// Pure OTP Email Template Preview (No Magic Links)
emailTemplates.get("/preview/citizen-otp", (c) => {
  const token = c.req.query("token") || "849201";
  const name = c.req.query("name") || "Vijay Sariyam";
  const html = renderCitizenOtpEmail({
    token,
    name,
    expiryMinutes: 10,
  });
  return c.html(html);
});

// Pure OTP Signup Template Preview (No Magic Links)
emailTemplates.get("/preview/confirm-signup", (c) => {
  const token = c.req.query("token") || "849201";
  const name = c.req.query("name") || "Vijay Sariyam";
  const html = renderCitizenOtpEmail({
    token,
    name,
    expiryMinutes: 10,
  });
  return c.html(html);
});

export default emailTemplates;
