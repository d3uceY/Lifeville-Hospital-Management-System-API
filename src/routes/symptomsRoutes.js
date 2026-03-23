import express from "express";
import * as symptomsController from "../controllers/symptomsControllers.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

// Symptom Types
router.get("/symptom-types", authenticate, symptomsController.getSymptomTypes);
router.post("/symptom-types", authenticate, symptomsController.createSymptomType);
router.put("/symptom-types/:id", authenticate, symptomsController.updateSymptomType);
router.delete("/symptom-types/:id", authenticate, symptomsController.deleteSymptomType);

// Symptom Heads
router.get("/symptom-heads", authenticate, symptomsController.getSymptomHeads);
router.post("/symptom-heads", authenticate, symptomsController.createSymptomHead);
router.put("/symptom-heads/:id", authenticate, symptomsController.updateSymptomHead);
router.delete("/symptom-heads/:id", authenticate, symptomsController.deleteSymptomHead);

// Combined
router.get("/symptoms-data", authenticate, symptomsController.getSymptomsData);

export default router;
