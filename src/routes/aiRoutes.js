import express from 'express';
import { polishComplaintText, polishDoctorNoteText, polishNurseNoteText, polishLabTestResultText, generatePhysicalExamFindingsText, getAIPatientSummary, getCachedPatientSummary, generateLabTestCommentText } from '../ai/controllers/polishController.js';
import { strictRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/ai/polish/complaint', strictRateLimiter, polishComplaintText);
router.post('/ai/polish/doctor-note', strictRateLimiter, polishDoctorNoteText);
router.post('/ai/polish/nurse-note', strictRateLimiter, polishNurseNoteText);
router.post('/ai/polish/lab-test-result', strictRateLimiter, polishLabTestResultText);
router.post('/ai/generate/physical-exam-findings', strictRateLimiter, generatePhysicalExamFindingsText);
router.post('/ai/generate/lab-test-comment', strictRateLimiter, generateLabTestCommentText);
router.get('/ai/patient-summary/:patientId/cached', getCachedPatientSummary);
router.get('/ai/patient-summary/:patientId', strictRateLimiter, getAIPatientSummary);

export default router;
