import { Hono } from "hono";
import { uploadFile, getSignedUrl } from "../controllers/storageController.ts";
import { authenticateUser } from "../middlewares/auth.ts";

const storage = new Hono();

storage.post("/upload", authenticateUser, uploadFile);
storage.get("/signed-url", authenticateUser, getSignedUrl);

export default storage;
