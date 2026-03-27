import express from 'express';
import { polishComplaintText, polishDoctorNoteText, polishNurseNoteText } from '../ai/controllers/polishController.js';

const router = express.Router();

router.post('/ai/polish/complaint', polishComplaintText);
router.post('/ai/polish/doctor-note', polishDoctorNoteText);
router.post('/ai/polish/nurse-note', polishNurseNoteText);

export default router;
