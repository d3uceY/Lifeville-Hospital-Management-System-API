import express from 'express';
import { polishComplaintText, polishDoctorNoteText, polishNurseNoteText, polishLabTestResultText, generatePhysicalExamFindingsText, getAIPatientSummary, getCachedPatientSummary, generateLabTestCommentText, generateDiagnosisSuggestionText } from '../ai/controllers/polishController.js';
import { strictRateLimiter, veryStrictRateLimiter } from '../middleware/rateLimiter.js';
import {authorize} from '../middleware/authorize.js';
import { ROLES } from '../../../LHMS/src/constants/config.js';

const doctor = ROLES.DOCTOR;
const nurse = ROLES.NURSE;
const superadmin = ROLES.SUPERADMIN;
const lab = ROLES.LAB;

const router = express.Router();

router.post('/ai/polish/complaint', strictRateLimiter, authorize([superadmin, doctor, nurse]), polishComplaintText);

router.post('/ai/polish/doctor-note', strictRateLimiter, authorize([superadmin, doctor]), polishDoctorNoteText);

router.post('/ai/polish/nurse-note', strictRateLimiter, authorize([superadmin, nurse]), polishNurseNoteText);

router.post('/ai/polish/lab-test-result', strictRateLimiter, authorize([superadmin, doctor, lab]), polishLabTestResultText);

router.post('/ai/generate/physical-exam-findings', veryStrictRateLimiter, authorize([superadmin, doctor]), generatePhysicalExamFindingsText);

router.post('/ai/generate/lab-test-comment', strictRateLimiter, authorize([superadmin, doctor, lab]), generateLabTestCommentText);

router.post('/ai/generate/diagnosis-suggestion', veryStrictRateLimiter, authorize([superadmin, doctor]), generateDiagnosisSuggestionText);

router.get('/ai/patient-summary/:patientId/cached', authorize([superadmin, doctor, nurse, lab]), getCachedPatientSummary);

router.get('/ai/patient-summary/:patientId', strictRateLimiter, authorize([superadmin, doctor, nurse, lab]), getAIPatientSummary);

export default router; 
