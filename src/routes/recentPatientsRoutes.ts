import express from "express";
import * as recentPatientsController from "../controllers/recentPatientsController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.post("/patients/recent-viewed", authenticate, recentPatientsController.recordRecentViewed);
router.get("/patients/recent-viewed", authenticate, recentPatientsController.getRecentViewed);
router.get("/patient-visits/recent", authenticate, recentPatientsController.getRecentVisits);

export default router;
