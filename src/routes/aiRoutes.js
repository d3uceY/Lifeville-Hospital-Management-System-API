import express from 'express';
import { polishComplaintText, polishDoctorNoteText, polishNurseNoteText } from '../ai/controllers/polishController.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/ai/polish/complaint', strictRateLimiter, polishComplaintText);
router.post('/ai/polish/doctor-note', strictRateLimiter, polishDoctorNoteText);
router.post('/ai/polish/nurse-note', strictRateLimiter, polishNurseNoteText);

export default router;
