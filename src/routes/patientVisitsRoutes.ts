import express from "express";
import * as patientVisitsController from "../controllers/patientVisitsController.js";
import { authenticate } from "../middleware/auth.js";
import {authorize} from "../middleware/authorize.js";
import {ROLES} from "../constants/domain.js";
const router = express.Router();

const allowedRoles = [ROLES.SUPERADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST];

router.post("/patient-visits", authenticate, authorize(allowedRoles), patientVisitsController.createPatientVisit);
router.get("/patient-visits/paginated", authenticate, authorize(allowedRoles), patientVisitsController.getPaginatedPatientVisits);
router.get("/patient-visits/:patientId/patient", authenticate, authorize(allowedRoles), patientVisitsController.getPatientVisitsByPatientId);
router.get("/patient-visits/:visitId/summary", authenticate, authorize(allowedRoles), patientVisitsController.getVisitSummary);
router.patch("/patient-visits/:visitId/checkout", authenticate, authorize(allowedRoles), patientVisitsController.checkOutPatientVisit);

export default router;
