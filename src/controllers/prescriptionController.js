import * as prescriptionServices from '../services/prescriptionServices.js'
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

export const createPrescriptionController = async (req, res) => {
    try {
        const prescription = await prescriptionServices.createPrescription(req.body);
        res.status(201).json(prescription);
        req.activityLogger(ACTIVITY_TYPES.PRESCRIPTION_CREATED, { prescriptionId: prescription.id });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message, code: error.code });
    }
}

export const getPrescriptionsController = async (req, res) => {
    try {
        const prescriptions = await prescriptionServices.getPrescriptions(req.params.patient_id);
        res.json(prescriptions);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message });
    }
}

export const deletePrescriptionController = async (req, res) => {
    try {
        const prescription = await prescriptionServices.deletePrescription(req.params.id);
        res.json(prescription);
        req.activityLogger(ACTIVITY_TYPES.PRESCRIPTION_DELETED, { prescriptionId: Number(req.params.id) });
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message });
    }
}

export const updatePrescriptionStatusController = async (req, res) => {
    try {
        const prescription = await prescriptionServices.updatePrescriptionStatus(req.params.id, req.body.status, req.body.updatedBy);
        res.json(prescription);
        req.activityLogger(ACTIVITY_TYPES.PRESCRIPTION_UPDATED, { prescriptionId: Number(req.params.id) });
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message });
    }
}
