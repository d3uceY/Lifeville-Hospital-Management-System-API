import { priorityLevels, NOTIFICATION_TYPES } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import * as patientVisitsServices from "../services/patientVisitsServices.js";
import { formatDate } from "../utils/formatDate.js";
import { addNotification } from "../services/notificationServices.js";

export const createPatientVisit = async (req, res) => {
    try {
        const patientVisit = await patientVisitsServices.createPatientVisit(req.body);
        if (!patientVisit) {
            return res.status(400).json({ error: "Failed to create patient visit" });
        }

        // notification
        try {

            // Jsonb data
            const data = {
                first_name: patientVisit.first_name,
                surname: patientVisit.surname,
                patient_id: patientVisit.patient_id,
                priority: priorityLevels.normal,
            }
            await addNotification({
                recipientRoles: NOTIFICATION_ROLES.VISIT,
                type: NOTIFICATION_TYPES.PATIENT_VISIT,
                title: "Patient Visit Created",
                message: `Patient visit on ${formatDate(patientVisit.checkInTime)} has been created`,
                data,
            });

        } catch (error) {
            console.error(error);
        }

        const io = req.app.get("socketio");
        io.emit("notification", {
            recipientRoles: NOTIFICATION_ROLES.VISIT,
            message: `( New Patient Visit on ${formatDate(patientVisit.checkInTime)} ) Doctor: ${patientVisit.doctor_name}`,
            description: `Patient: ${patientVisit.first_name} ${patientVisit.surname}`
        });


        res.status(201).json(patientVisit);
    } catch (error) {
        if (error.code === "ONGOING_VISIT_EXISTS") {
            return res.status(409).json({ error: error.message });
        }
        console.error("Error creating patient visit:", error);
        res.status(500).json({ error: "Failed to create patient visit" });
    }
};

export const getPaginatedPatientVisits = async (req, res) => {
    try {
        const { page, pageSize, search, startDate, endDate } = req.query;
        const patientVisits = await patientVisitsServices.getPaginatedPatientVisits(page, pageSize, { search, startDate, endDate });
        res.status(200).json(patientVisits);
    } catch (error) {
        console.error("Error fetching patient visits:", error);
        res.status(500).json({ error: "Failed to fetch patient visits" });
    }
};

export const getPatientVisitsByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;
        const patientVisits = await patientVisitsServices.getPatientVisitsByPatientId(patientId);
        res.status(200).json(patientVisits);
    } catch (error) {
        console.error("Error fetching patient visits:", error);
        res.status(500).json({ error: "Failed to fetch patient visits" });
    }
};

export const checkOutPatientVisit = async (req, res) => {
    try {
        const visitId = Number(req.params.visitId);
        const updated = await patientVisitsServices.checkOutPatientVisit(visitId);
        res.status(200).json({ visit: updated, message: "Patient checked out successfully" });
    } catch (error) {
        if (error.code === "VISIT_NOT_FOUND") {
            return res.status(404).json({ error: error.message });
        }
        if (error.code === "INPATIENT_CHECKOUT_NOT_ALLOWED") {
            return res.status(400).json({ error: error.message });
        }
        if (error.code === "ALREADY_CHECKED_OUT") {
            return res.status(409).json({ error: error.message });
        }
        console.error("Error checking out patient visit:", error);
        res.status(500).json({ error: "Failed to check out patient visit" });
    }
};

export const getVisitSummary = async (req, res) => {
    try {
        const visitId = Number(req.params.visitId);
        const summary = await patientVisitsServices.getVisitSummary(visitId);
        res.status(200).json(summary);
    } catch (error) {
        console.error("Error fetching visit summary:", error);
        res.status(500).json({ error: "Failed to fetch visit summary" });
    }
};