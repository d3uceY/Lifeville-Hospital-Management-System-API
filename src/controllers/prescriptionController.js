import * as prescriptionServices from '../services/prescriptionServices.js'

export const createPrescriptionController = async (req, res) => {
    try {
        const prescription = await prescriptionServices.createPrescription(req.body);
        res.status(201).json(prescription);
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
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message });
    }
}

export const updatePrescriptionStatusController = async (req, res) => {
    try {
        const prescription = await prescriptionServices.updatePrescriptionStatus(req.params.id, req.body.status, req.body.updatedBy);
        res.json(prescription);
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: error.message });
    }
}
