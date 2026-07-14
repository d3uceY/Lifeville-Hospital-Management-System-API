import type { Request, Response } from "express";
import * as patientInsuranceServices from "../services/patientInsuranceServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";
import { isHttpError } from "../lib/errors.js";

/** GET /patient-insurance/:patientId */
export const getPatientInsuranceByPatientId = async (req: Request, res: Response) => {
    try {
        const records = await patientInsuranceServices.getPatientInsuranceByPatientId(Number(req.params.patientId));
        res.json(records);
    } catch (error) {
        res.status(500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};

export const createPatientInsurance = async (req: Request, res: Response) => {
    try {
        const record = await patientInsuranceServices.createPatientInsurance(req.body);
        res.status(201).json(record);
        req.activityLogger(ACTIVITY_TYPES.PATIENT_INSURANCE_CREATED, { patientInsuranceId: record.id, patientId: record.patient_id });
    } catch (error) {
        res.status(isHttpError(error) ? error.status : 500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};

export const updatePatientInsurance = async (req: Request, res: Response) => {
    try {
        const record = await patientInsuranceServices.updatePatientInsurance(Number(req.params.id), req.body);
        res.json(record);
        req.activityLogger(ACTIVITY_TYPES.PATIENT_INSURANCE_UPDATED, { patientInsuranceId: Number(req.params.id) });
    } catch (error) {
        res.status(isHttpError(error) ? error.status : 500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};

export const deletePatientInsurance = async (req: Request, res: Response) => {
    try {
        const record = await patientInsuranceServices.deletePatientInsurance(Number(req.params.id));
        res.json(record);
        req.activityLogger(ACTIVITY_TYPES.PATIENT_INSURANCE_DELETED, { patientInsuranceId: Number(req.params.id) });
    } catch (error) {
        res.status(500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};
