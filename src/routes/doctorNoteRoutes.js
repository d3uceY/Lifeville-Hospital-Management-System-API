import * as doctorNoteController from "../controllers/doctorNoteController.js";
import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const router = express.Router();

router.get("/doctor-notes/patient/:patientId", authenticate, doctorNoteController.getDoctorNotesByPatientId);
router.post("/doctor-notes", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), doctorNoteController.createDoctorNote);
router.put("/doctor-notes/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), doctorNoteController.updateDoctorNote);
router.delete("/doctor-notes/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), doctorNoteController.deleteDoctorNote);

export default router;