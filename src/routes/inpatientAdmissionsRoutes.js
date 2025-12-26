// routes/inpatientAdmissionsRoutes.js

import express from "express";
import * as inpatientControllers from "../controllers/inpatientAdmissionsController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

/**
 * GET   /inpatients      → list all admissions
 * POST  /inpatients      → create a new admission
 * GET   /inpatients/:id  → view one admission
 * PUT   /inpatients/:id  → update an admission
 * DELETE /inpatients/:id → delete an admission
 */

router.get("/inpatients", authenticate, inpatientControllers.getInpatientAdmissions);
router.post("/inpatients", authenticate, inpatientControllers.createInpatientAdmission);
router.get("/inpatients/:id", authenticate, inpatientControllers.viewInpatientAdmission);
router.put("/inpatients/:id", authenticate, inpatientControllers.updateInpatientAdmission);
router.delete("/inpatients/:id", authenticate, inpatientControllers.deleteInpatientAdmission);
router.get("/inpatients/:patientId/admissions", authenticate, inpatientControllers.getInpatientAdmissionsByPatientId);
router.post("/inpatients/:id/discharge", authenticate, inpatientControllers.dischargeInpatientAdmission);
router.get("/inpatients/:id/discharge-summary", authenticate, inpatientControllers.getDischargeSummaryByAdmissionId);

export default router;
