import express from "express";
import * as patientInsuranceController from "../controllers/patientInsuranceController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const router = express.Router();

// Roles allowed to manage a patient's insurance records
const MANAGE_ROLES = [ROLES.SUPERADMIN, ROLES.RECEPTIONIST, ROLES.NURSE, ROLES.DOCTOR];

router.get("/patient-insurance/:patientId", authenticate, patientInsuranceController.getPatientInsuranceByPatientId);
router.post("/patient-insurance", authenticate, authorize(MANAGE_ROLES), patientInsuranceController.createPatientInsurance);
router.put("/patient-insurance/:id", authenticate, authorize(MANAGE_ROLES), patientInsuranceController.updatePatientInsurance);
router.delete("/patient-insurance/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.RECEPTIONIST]), patientInsuranceController.deletePatientInsurance);

export default router;
