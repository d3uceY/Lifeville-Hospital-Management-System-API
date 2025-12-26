import * as doctorNoteController from "../controllers/doctorNoteController.js";
import express from "express";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/doctor-notes/patient/:patientId", authenticate, doctorNoteController.getDoctorNotesByPatientId);
router.post("/doctor-notes", authenticate, doctorNoteController.createDoctorNote);
router.put("/doctor-notes/:id", authenticate, doctorNoteController.updateDoctorNote);
router.delete("/doctor-notes/:id", authenticate, doctorNoteController.deleteDoctorNote);

export default router;