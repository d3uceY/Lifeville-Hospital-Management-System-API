import express from "express";
import * as symptomsController from "../controllers/symptomsControllers.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const router = express.Router();

// Symptom Types
router.get("/symptom-types", authenticate, symptomsController.getSymptomTypes);
router.post("/symptom-types", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), symptomsController.createSymptomType);
router.put("/symptom-types/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), symptomsController.updateSymptomType);
router.delete("/symptom-types/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), symptomsController.deleteSymptomType);

// Symptom Heads
router.get("/symptom-heads", authenticate, symptomsController.getSymptomHeads);
router.post("/symptom-heads", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), symptomsController.createSymptomHead);
router.put("/symptom-heads/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), symptomsController.updateSymptomHead);
router.delete("/symptom-heads/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), symptomsController.deleteSymptomHead);

// Combined
router.get("/symptoms-data", authenticate, symptomsController.getSymptomsData);

export default router;
