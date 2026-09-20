import { Router } from "express";
import { getProviders, generate, stream, resume, getThreadUsage } from "../controllers/aiController.js";
import { loggedIn } from "../middleware/auth.js";

const router = Router();

router.use(loggedIn);

router.get("/providers", getProviders);
router.post("/generate", generate);
router.post("/stream", stream);
router.post("/resume", resume);
router.get("/thread/:threadId/usage", getThreadUsage);
export default router;
