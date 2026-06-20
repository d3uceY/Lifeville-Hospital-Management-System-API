import { priorityLevels, NOTIFICATION_TYPES } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import * as diagnosesServices from "../services/diagnosesServices.js";
import { addNotification } from "../services/notificationServices.js";
import { formatDate } from "../utils/formatDate.js";

export const createDiagnosis = async (req, res) => {
    try {
        const diagnosis = await diagnosesServices.createDiagnosis(req.body);

        // Serialize jsonb condition to a readable label for notifications
        const conditionLabel = diagnosis.condition && typeof diagnosis.condition === 'object'
            ? Object.entries(diagnosis.condition).map(([code, desc]) => desc ? `${code} — ${desc}` : code).join('; ')
            : String(diagnosis.condition ?? '');

        // Send notification
        try {
            const data = {
                first_name: diagnosis.first_name,
                surname: diagnosis.surname,
                patient_id: diagnosis.patient_id,
                condition: conditionLabel,
                recorded_by: diagnosis.recorded_by,
                priority: priorityLevels.normal,
            }
            await addNotification({
                recipientRoles: NOTIFICATION_ROLES.CLINICAL,
                type: NOTIFICATION_TYPES.DIAGNOSIS,
                title: "New Diagnosis Recorded",
                message: `Diagnosis recorded for ${diagnosis.first_name} ${diagnosis.surname}: ${conditionLabel}`,
                data,
            });

        } catch (error) {
            console.error(error);
        }

        // emit notification
        const io = req.app.get("socketio");
        io.emit("notification", {
            recipientRoles: NOTIFICATION_ROLES.CLINICAL,
            message: `New diagnosis: ${conditionLabel} by ${diagnosis.recorded_by}`,
            description: `Patient: ${diagnosis.first_name} ${diagnosis.surname}`
        });

        res.status(201).json(diagnosis);
    } catch (error) {
        const statusCode = error.status || 500;
        res.status(statusCode).json({ error: error.message, code: error.code });
    }
};

export const getDiagnosesByPatientId = async (req, res) => {
    try {
        const diagnoses = await diagnosesServices.getDiagnosesByPatientId(req.params.patientId);
        res.json(diagnoses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const getDiagnosisById = async (req, res) => {
    try {
        const diagnosis = await diagnosesServices.getDiagnosisById(req.params.diagnosisId);
        res.json(diagnosis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const updateDiagnosis = async (req, res) => {
    try {
        const diagnosis = await diagnosesServices.updateDiagnosis(req.params.diagnosisId, req.body);
        res.json(diagnosis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export const deleteDiagnosis = async (req, res) => {
    try {
        const diagnosis = await diagnosesServices.deleteDiagnosis(req.params.diagnosisId);
        res.json(diagnosis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
