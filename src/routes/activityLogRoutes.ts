import express from "express";
import { getActivityLogsController } from "../controllers/activityLogController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.get("/activity-logs", authenticate, authorize(["superadmin"]), getActivityLogsController);

export default router;
