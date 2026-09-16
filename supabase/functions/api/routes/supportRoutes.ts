import { Hono } from "hono";
import { submitContactInquiry, listContactInquiries } from "../controllers/supportController.ts";
import { optionalAuth } from "../middlewares/auth.ts";

const support = new Hono();

support.post("/contact", submitContactInquiry);
support.get("/inquiries", optionalAuth, listContactInquiries);

export default support;
