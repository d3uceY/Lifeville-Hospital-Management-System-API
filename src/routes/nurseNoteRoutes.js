import express from "express";
import * as nurseNoteController from "../controllers/nurseNoteControllers.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.get("/nurse-notes/patient/:patientId", authenticate, nurseNoteController.getNurseNotesByPatientId);
router.post("/nurse-notes", authenticate, nurseNoteController.createNurseNote);
router.put("/nurse-notes/:id", authenticate, nurseNoteController.updateNurseNote);
router.delete("/nurse-notes/:id", authenticate, nurseNoteController.deleteNurseNote);

export default router;
