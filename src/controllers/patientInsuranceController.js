import * as patientInsuranceServices from "../services/patientInsuranceServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

/** GET /patient-insurance/:patientId */
export const getPatientInsuranceByPatientId = async (req, res) => {
    try {
        const records = await patientInsuranceServices.getPatientInsuranceByPatientId(req.params.patientId);
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createPatientInsurance = async (req, res) => {
    try {
        const record = await patientInsuranceServices.createPatientInsurance(req.body);
        res.status(201).json(record);
        req.activityLogger(ACTIVITY_TYPES.PATIENT_INSURANCE_CREATED, { patientInsuranceId: record.id, patientId: record.patient_id });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

export const updatePatientInsurance = async (req, res) => {
    try {
        const record = await patientInsuranceServices.updatePatientInsurance(req.params.id, req.body);
        res.json(record);
        req.activityLogger(ACTIVITY_TYPES.PATIENT_INSURANCE_UPDATED, { patientInsuranceId: Number(req.params.id) });
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

export const deletePatientInsurance = async (req, res) => {
    try {
        const record = await patientInsuranceServices.deletePatientInsurance(req.params.id);
        res.json(record);
        req.activityLogger(ACTIVITY_TYPES.PATIENT_INSURANCE_DELETED, { patientInsuranceId: Number(req.params.id) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
