import { Router } from "express";
import userRoutes from "./userRoutes.js";
import threadRoutes from "./threadRoutes.js";
import aiRoutes from "./aiRoutes.js";
import systemPromptRoutes from "./systemPromptRoute.js";
import bookRoutes from "./bookRoutes.js";
import noteRoutes from "./noteRoutes.js";

const router = Router();
router.use("/users", userRoutes);
router.use("/threads", threadRoutes);
router.use("/ai", aiRoutes);
router.use("/system-prompts", systemPromptRoutes);
router.use("/books", bookRoutes);
router.use("/notes", noteRoutes);

export default router;
