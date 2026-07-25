import express from "express";
import * as nurseNoteController from "../controllers/nurseNoteControllers.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";
const router = express.Router();

router.get("/nurse-notes/patient/:patientId", authenticate, nurseNoteController.getNurseNotesByPatientId);
router.post("/nurse-notes", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), nurseNoteController.createNurseNote);
router.put("/nurse-notes/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), nurseNoteController.updateNurseNote);
router.delete("/nurse-notes/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), nurseNoteController.deleteNurseNote);

export default router;
