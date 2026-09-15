import { Router } from "express";
import { loggedIn } from "../middleware/auth.js";
import { uploadKnowledgeFile } from "../middleware/knowledgeUpload.js";
import {
  attachKnowledgeHandler,
  deleteKnowledgeHandler,
  detachKnowledgeHandler,
  generateKnowledgeEmbeddingsHandler,
  listThreadKnowledgeHandler,
  listUserKnowledgeHandler,
  uploadKnowledgeHandler,
} from "../controllers/knowledgeController.js";

const router = Router();

router.use(loggedIn);

router.post("/upload", uploadKnowledgeFile, uploadKnowledgeHandler);
router.post("/generate-embeddings/:knowledgeSourceId", generateKnowledgeEmbeddingsHandler);

router.get("/", listUserKnowledgeHandler);
router.get("/thread/:threadId", listThreadKnowledgeHandler);
router.post("/thread/:threadId/attach/:knowledgeSourceId", attachKnowledgeHandler);
router.delete("/thread/:threadId/:knowledgeSourceId", detachKnowledgeHandler);
router.delete("/:knowledgeSourceId", deleteKnowledgeHandler);

export default router;
