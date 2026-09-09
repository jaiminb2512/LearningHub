import { Router } from "express";
import {
  createThread,
  getAllThreads,
  getThreadById,
  updateThread,
  deleteThread,
} from "../controllers/threadController.js";
import { loggedIn } from "../middleware/auth.js";

const router = Router();

// All thread routes require authentication
router.use(loggedIn);

router.post("/", createThread);
router.get("/", getAllThreads);
router.get("/:threadId", getThreadById);
router.patch("/:threadId", updateThread);
router.delete("/:threadId", deleteThread);

export default router;
