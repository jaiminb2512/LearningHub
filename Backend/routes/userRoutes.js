import { Router } from "express";
import { register, login, logout, getMe } from "../controllers/userController.js";
import { loggedIn } from "../middleware/auth.js";

const router = Router();

// Public routes - no authentication required
router.post("/register", register); // api/users/register
router.post("/login", login); // api/users/login
router.post("/logout", logout); // api/users/logout
router.get("/me", loggedIn, getMe);

export default router;
