import { Hono } from "hono";
import {
  sendCitizenOtp,
  verifyCitizenOtp,
  registerLawyer,
  loginLawyer,
  loginAdmin,
  getCurrentUser,
} from "../controllers/authController.ts";
import { authenticateUser } from "../middlewares/auth.ts";

const auth = new Hono();

auth.post("/citizen/send-otp", sendCitizenOtp);
auth.post("/citizen/verify-otp", verifyCitizenOtp);
auth.post("/lawyer/register", registerLawyer);
auth.post("/lawyer/login", loginLawyer);
auth.post("/admin/login", loginAdmin);
auth.get("/me", authenticateUser, getCurrentUser);

export default auth;
