import { Router } from "express";
import userRoutes from "./userRoutes.js";
import threadRoutes from "./threadRoutes.js";
import aiRoutes from "./aiRoutes.js";
import systemPromptRoutes from "./systemPromptRoute.js";
import bookRoutes from "./bookRoutes.js";
import noteRoutes from "./noteRoutes.js";
import aiSettingRoutes from "./aiSettingRoutes.js";
import knowledgeRoutes from "./knowledgeRoutes.js";
import observabilityRoutes from "./observabilityRoutes.js";

const router = Router();
router.use("/users", userRoutes);
router.use("/threads", threadRoutes);
router.use("/ai", aiRoutes);
router.use("/system-prompts", systemPromptRoutes);
router.use("/books", bookRoutes);
router.use("/notes", noteRoutes);
router.use("/ai-settings", aiSettingRoutes);
router.use("/knowledge", knowledgeRoutes);
router.use("/observability", observabilityRoutes);

export default router;
