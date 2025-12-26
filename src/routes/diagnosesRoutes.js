import express from "express";
import { createDiagnosis, getDiagnosesByPatientId, getDiagnosisById, updateDiagnosis, deleteDiagnosis } from "../controllers/diagnosesController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.post("/diagnoses", authenticate, createDiagnosis);
router.get("/diagnoses/:patientId", authenticate, getDiagnosesByPatientId);
router.get("/diagnoses/:diagnosisId", authenticate, getDiagnosisById);
router.put("/diagnoses/:diagnosisId", authenticate, updateDiagnosis);
router.delete("/diagnoses/:diagnosisId", authenticate, deleteDiagnosis);
export default router;
