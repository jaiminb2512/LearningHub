import { Router } from "express";
import { loggedIn } from "../middleware/auth.js";
import {
  createAiSettingHandler,
  deleteAiSettingHandler,
  getAiSettingByIdHandler,
  getAllAiSettingsHandler,
  updateAiSettingHandler,
} from "../controllers/aiSettingController.js";

const router = Router();
router.use(loggedIn);

router.post("/", createAiSettingHandler);
router.get("/", getAllAiSettingsHandler);
router.get("/:aiSettingId", getAiSettingByIdHandler);
router.put("/:aiSettingId", updateAiSettingHandler);
router.delete("/:aiSettingId", deleteAiSettingHandler);

export default router;
