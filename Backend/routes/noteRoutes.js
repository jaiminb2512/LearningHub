import { Router } from "express";
import { loggedIn } from "../middleware/auth.js";
import { getNoteByIdGlobalHandler } from "../controllers/noteController.js";

const router = Router();

router.use(loggedIn);

router.get("/:noteId", getNoteByIdGlobalHandler);

export default router;
