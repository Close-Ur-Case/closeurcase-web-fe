import { Hono } from "hono";
import { getDashboardStats } from "../controllers/adminController.ts";
import { optionalAuth } from "../middlewares/auth.ts";

const admin = new Hono();

admin.get("/dashboard-stats", optionalAuth, getDashboardStats);

export default admin;
