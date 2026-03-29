import express from "express";
import * as patientVisitsController from "../controllers/patientVisitsController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.post("/patient-visits", authenticate, patientVisitsController.createPatientVisit);
router.get("/patient-visits/paginated", authenticate, patientVisitsController.getPaginatedPatientVisits);
router.get("/patient-visits/:patientId/patient", authenticate, patientVisitsController.getPatientVisitsByPatientId);
router.get("/patient-visits/:visitId/summary", authenticate, patientVisitsController.getVisitSummary);
router.patch("/patient-visits/:visitId/checkout", authenticate, patientVisitsController.checkOutPatientVisit);

export default router;
