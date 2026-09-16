import { Hono } from "hono";
import {
  registerFcmToken,
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.ts";
import { authenticateUser } from "../middlewares/auth.ts";

const notification = new Hono();

notification.post("/register-token", authenticateUser, registerFcmToken);
notification.get("/", authenticateUser, getNotifications);
notification.patch("/:id/read", authenticateUser, markAsRead);
notification.post("/mark-all-read", authenticateUser, markAllAsRead);

export default notification;
