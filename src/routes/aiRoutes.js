import express from 'express';
import { polishComplaintText, polishDoctorNoteText, polishNurseNoteText, polishLabTestResultText, generatePhysicalExamFindingsText, getAIPatientSummary, getCachedPatientSummary, generateLabTestCommentText, generateDiagnosisSuggestionText } from '../ai/controllers/polishController.js';
import { transcribeSpeechController } from '../ai/controllers/speechController.js';
import { strictRateLimiter, veryStrictRateLimiter } from '../middleware/rateLimiter.js';
import { authorize } from '../middleware/authorize.js';
import { authenticate } from '../middleware/auth.js';
import { uploadAudio } from '../middleware/upload.js';
import { ROLES } from '../constants/domain.js';

const doctor = ROLES.DOCTOR;
const nurse = ROLES.NURSE;
const superadmin = ROLES.SUPERADMIN;
const lab = ROLES.LAB;

const router = express.Router();

router.post('/ai/polish/complaint', strictRateLimiter, authenticate, authorize([superadmin, doctor, nurse]), polishComplaintText);

router.post('/ai/polish/doctor-note', strictRateLimiter, authenticate, authorize([superadmin, doctor]), polishDoctorNoteText);

router.post('/ai/polish/nurse-note', strictRateLimiter, authenticate, authorize([superadmin, nurse]), polishNurseNoteText);

router.post('/ai/polish/lab-test-result', strictRateLimiter, authenticate, authorize([superadmin, doctor, lab]), polishLabTestResultText);

router.post('/ai/generate/physical-exam-findings', veryStrictRateLimiter, authenticate, authorize([superadmin, doctor]), generatePhysicalExamFindingsText);

router.post('/ai/generate/lab-test-comment', strictRateLimiter, authenticate, authorize([superadmin, doctor, lab]), generateLabTestCommentText);

router.post('/ai/generate/diagnosis-suggestion', veryStrictRateLimiter, authenticate, authorize([superadmin, doctor]), generateDiagnosisSuggestionText);

router.get('/ai/patient-summary/:patientId/cached', authenticate, authorize([superadmin, doctor, nurse, lab]), getCachedPatientSummary);

router.get('/ai/patient-summary/:patientId', strictRateLimiter, authenticate, authorize([superadmin, doctor, nurse, lab]), getAIPatientSummary);

router.post('/ai/transcribe/speech', veryStrictRateLimiter, authenticate, authorize([superadmin, doctor, nurse]), uploadAudio.single('audio'), transcribeSpeechController);

export default router; 
