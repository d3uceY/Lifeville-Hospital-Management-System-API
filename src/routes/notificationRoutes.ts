import express from "express";
import * as notificationController from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/notifications", authenticate, notificationController.getNotificationsByUserData);
router.get("/notifications/paginated", authenticate, notificationController.getPaginatedNotificationsByUserData);
router.get("/notifications/unread", authenticate, notificationController.getUnreadNotifications);
router.post("/notifications/:notificationId/mark-as-read", authenticate, notificationController.markNotificationAsRead);

export default router;