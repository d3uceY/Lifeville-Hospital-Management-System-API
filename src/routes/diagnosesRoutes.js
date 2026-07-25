import express from "express";
import { createDiagnosis, getDiagnosesByPatientId, getDiagnosisById, updateDiagnosis, deleteDiagnosis } from "../controllers/diagnosesController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";
const router = express.Router();

router.post("/diagnoses", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), createDiagnosis);
router.get("/diagnoses/:patientId", authenticate, getDiagnosesByPatientId);
router.get("/diagnoses/:diagnosisId", authenticate, getDiagnosisById);
router.put("/diagnoses/:diagnosisId", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), updateDiagnosis);
router.delete("/diagnoses/:diagnosisId", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), deleteDiagnosis);
export default router;
