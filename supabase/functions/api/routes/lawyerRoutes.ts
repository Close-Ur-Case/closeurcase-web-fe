import { Hono } from "hono";
import {
  getLawyers,
  getLawyerById,
  updateLawyerStatus,
  updateLawyerProfile,
  submitRating,
  toggleAvailability,
  updateBankDetails,
  moderateLawyer,
} from "../controllers/lawyerController.ts";
import { optionalAuth } from "../middlewares/auth.ts";

const lawyer = new Hono();

lawyer.get("/", optionalAuth, getLawyers);
lawyer.get("/:id", optionalAuth, getLawyerById);
lawyer.patch("/:id/status", optionalAuth, updateLawyerStatus);
lawyer.patch("/:id/moderate", optionalAuth, moderateLawyer);
lawyer.patch("/:id/availability", optionalAuth, toggleAvailability);
lawyer.patch("/:id/bank-details", optionalAuth, updateBankDetails);
lawyer.patch("/:id", optionalAuth, updateLawyerProfile);
lawyer.post("/:id/ratings", optionalAuth, submitRating);

export default lawyer;

