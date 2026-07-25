// routes/inpatientAdmissionsRoutes.js

import express from "express";
import * as inpatientControllers from "../controllers/inpatientAdmissionsController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const STAFF = [ROLES.SUPERADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST];

const router = express.Router();

router.get("/inpatients", authenticate, inpatientControllers.getInpatientAdmissions);
router.post("/inpatients", authenticate, authorize(STAFF), inpatientControllers.createInpatientAdmission);
router.get("/inpatients/:id", authenticate, inpatientControllers.viewInpatientAdmission);
router.put("/inpatients/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), inpatientControllers.updateInpatientAdmission);
router.delete("/inpatients/:id", authenticate, authorize([ROLES.SUPERADMIN]), inpatientControllers.deleteInpatientAdmission);
router.get("/inpatients/:patientId/admissions", authenticate, inpatientControllers.getInpatientAdmissionsByPatientId);
router.post("/inpatients/:id/discharge", authenticate, inpatientControllers.dischargeInpatientAdmission);
router.get("/inpatients/:id/discharge-summary", authenticate, inpatientControllers.getDischargeSummaryByAdmissionId);
router.get("/inpatients/:id/latest-diagnosis", authenticate, inpatientControllers.getLatestDiagnosisForAdmission);

export default router;
