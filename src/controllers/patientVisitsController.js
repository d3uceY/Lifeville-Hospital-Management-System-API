import { priorityLevels } from "../constants/notification.js";
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
            const roles = ["superadmin", "doctor", "receptionist", "lab", "nurse"];

            const notificationInfo = roles.map(role => ({
                recipient_role: role,
                type: "PATIENT_VISIT",
                title: "Patient Visit Created",
                message: `Patient visit on ${formatDate(patientVisit.created_at)} has been created`,
                data,
            }));
            await addNotification(notificationInfo);

        } catch (error) {
            console.error(error);
        }

        const io = req.app.get("socketio");
        io.emit("notification", {
            message: `( New Patient Visit on ${formatDate(patientVisit.created_at)} ) Doctor: ${patientVisit.doctor_name}`,
            description: `Patient: ${patientVisit.first_name} ${patientVisit.surname}`
        });


        res.status(201).json(patientVisit);
    } catch (error) {
        console.error("Error creating patient visit:", error);
        res.status(500).json({ error: "Failed to create patient visit" });
    }
};

export const getPaginatedPatientVisits = async (req, res) => {
    try {
        const { page, pageSize, firstName, surname, phoneNumber, hospitalNumber, startDate, endDate } = req.query;
        const patientVisits = await patientVisitsServices.getPaginatedPatientVisits(page, pageSize, { firstName, surname, phoneNumber, hospitalNumber, startDate, endDate });
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