import { Router } from "express";
import { loggedIn } from "../middleware/auth.js";
import { overview, traces, trace } from "../controllers/observabilityController.js";

const router = Router();
router.use(loggedIn);
router.get("/overview", overview);
router.get("/traces", traces);
router.get("/traces/:traceId", trace);

export default router;
