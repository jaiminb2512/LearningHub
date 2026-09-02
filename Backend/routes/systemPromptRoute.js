import { Router } from "express";
import {
    createSystemPrompt,
    getSystemPrompt,
    updateSystemPrompt,
    deleteSystemPrompt
} from "../controllers/systemPromptController.js";
import { loggedIn } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(loggedIn);

router.post("/", createSystemPrompt);
router.get("/", getSystemPrompt);
router.put("/:id", updateSystemPrompt);
router.delete("/:id", deleteSystemPrompt);

export default router;
