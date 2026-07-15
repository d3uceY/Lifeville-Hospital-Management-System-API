// routes/patientRoutes.js
import express from "express";
import * as patientController from "../controllers/patientControllers.js";
import { authenticate } from "../middleware/auth.js";
import { uploadOptionalSingle } from "../middleware/upload.js";
import { authorize } from '../middleware/authorize.js'
import { ROLES } from "../constants/domain.js";

const router = express.Router();

router.get("/patients", authenticate, patientController.getPatients);

router.get("/patients/check-hospital-number", authenticate, patientController.checkHospitalNumber);

router.get("/patients/:id", authenticate, patientController.viewPatient);

router.post("/patients", authenticate, authorize([ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.SUPERADMIN]), patientController.createPatients);

router.put("/patients/:id", authenticate, authorize([ROLES.SUPERADMIN]), patientController.updatePatient);

router.delete("/patients/:id", authenticate, authorize([ROLES.SUPERADMIN]), patientController.deletePatient);

// Profile image routes
router.post(
    "/patients/:id/profile-image",
    authenticate,
    authorize([ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.DOCTOR, ROLES.SUPERADMIN]),
    uploadOptionalSingle("profileImage"),
    patientController.uploadPatientProfileImage
);

router.delete(
    "/patients/:id/profile-image",
    authenticate,
    authorize([ROLES.SUPERADMIN]),
    patientController.deletePatientProfileImage
);

export default router;
