import express from "express";
import * as patientVisitsController from "../controllers/patientVisitsController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.post("/patient-visits", authenticate, patientVisitsController.createPatientVisit);
router.get("/patient-visits/paginated", authenticate, patientVisitsController.getPaginatedPatientVisits);
router.get("/patient-visits/:patientId/patient", authenticate, patientVisitsController.getPatientVisitsByPatientId);

export default router;
