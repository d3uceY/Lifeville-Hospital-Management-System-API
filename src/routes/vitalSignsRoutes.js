import express from "express";

import * as vitalSignsController from "../controllers/vitalSignsController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();


router.get("/vital-signs/patient/:patientId", authenticate, vitalSignsController.getVitalSignsByPatientId);
router.post("/vital-signs", authenticate, vitalSignsController.createVitalSign);
router.put("/vital-signs/:vitalSignId", authenticate, vitalSignsController.updateVitalSign);

// router.delete("/patients/:id", patientController.deletePatients);

export default router;
