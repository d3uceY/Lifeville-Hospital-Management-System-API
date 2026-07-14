import express from 'express';
import { createPrescriptionController, getPrescriptionsController, deletePrescriptionController, updatePrescriptionStatusController } from '../controllers/prescriptionController.js';
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.post('/prescriptions', authenticate, createPrescriptionController);
router.get('/prescriptions/:patient_id', authenticate, getPrescriptionsController);
router.delete('/prescriptions/:id', authenticate, deletePrescriptionController);
router.put('/prescriptions/:id', authenticate, updatePrescriptionStatusController);

export default router;