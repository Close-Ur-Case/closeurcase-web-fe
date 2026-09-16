import { Hono } from "hono";
import {
  getCitizens,
  getCitizenById,
  updateCitizenProfile,
  getMySubscriptions,
  getMe,
  updateMe,
} from "../controllers/citizenController.ts";
import { optionalAuth } from "../middlewares/auth.ts";

const citizen = new Hono();

citizen.get("/me", optionalAuth, getMe);
citizen.patch("/me", optionalAuth, updateMe);
citizen.get("/", optionalAuth, getCitizens);
citizen.get("/:id", optionalAuth, getCitizenById);
citizen.patch("/:id", optionalAuth, updateCitizenProfile);
citizen.get("/:citizenId/subscriptions", optionalAuth, getMySubscriptions);

export default citizen;

