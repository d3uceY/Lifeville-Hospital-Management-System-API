import express from 'express';
import { createPrescriptionController, getPrescriptionsController, deletePrescriptionController, updatePrescriptionStatusController } from '../controllers/prescriptionController.js';
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";
const router = express.Router();

router.post('/prescriptions', authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), createPrescriptionController);
router.get('/prescriptions/:patient_id', authenticate, getPrescriptionsController);
router.delete('/prescriptions/:id', authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), deletePrescriptionController);
router.put('/prescriptions/:id', authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), updatePrescriptionStatusController);

export default router;