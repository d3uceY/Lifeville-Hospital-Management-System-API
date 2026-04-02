import express from "express";
import * as userControllers from '../controllers/userControllers.js';
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/auth/login", authRateLimiter, userControllers.loginController);
router.post("/auth/refresh", authRateLimiter, userControllers.refreshController);
router.post("/auth/logout", authenticate, userControllers.logoutController);

// Super Admin only routes
router.post("/users", authenticate, authorize(["superadmin"]), userControllers.createStaffController);
router.get("/users", authenticate, authorize(["superadmin"]), userControllers.listUsersController);
router.put("/users/:id", authenticate, authorize(["superadmin"]), userControllers.updateUserController);
router.delete("/users/:id", authenticate, authorize(["superadmin"]), userControllers.deleteUserController);
router.put("/users/:id/toggle", authenticate, authorize(["superadmin"]), userControllers.toggleUserController);

export default router;
