import express from "express";
import * as summaryController from "../controllers/summaryController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.get("/patient-summary/:patientId", authenticate, summaryController.getPatientDashboardSummary);
router.get("/admissions-summary/:patientId", authenticate, summaryController.getAdmissionSummaryByPatientId);
router.get("/diagnosis-summary/:patientId", authenticate, summaryController.getDiagnosisSummaryByPatientId);
router.get("/lab-test-summary/:patientId", authenticate, summaryController.getLabTestSummaryByPatientId);
router.get("/vital-sign-summary/:patientId", authenticate, summaryController.getVitalSignSummaryByPatientId);

export default router;
