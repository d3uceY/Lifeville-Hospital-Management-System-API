import * as complaintsServices from "../services/complaintsServices.js";
import { addNotification } from "../services/notificationServices.js";
import { formatDate } from "../utils/formatDate.js";

export async function getComplaints(req, res) {
    try {
        const complaints = await complaintsServices.getComplaints();
        res.json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve complaints" });
    }
}

export async function getComplaintsByPatientId(req, res) {
    try {
        const complaints = await complaintsServices.getComplaintsByPatientId(req.params.patientId);
        res.json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve complaints" });
    }
}

export async function createComplaint(req, res) {
    try {
        const complaint = await complaintsServices.createComplaint(req.body);
        
        // Send notification
        try {
            const data = {
                first_name: complaint.first_name,
                surname: complaint.surname,
                patient_id: complaint.patient_id,
                complaint: complaint.complaint,
                recorded_by: complaint.recorded_by,
                priority: "normal",
            }
            const roles = ["superadmin", "doctor", "nurse"];

            const notificationInfo = roles.map(role => ({
                recipient_role: role,
                type: "COMPLAINT",
                title: "New Patient Complaint",
                message: `Complaint recorded for ${complaint.first_name} ${complaint.surname} by ${complaint.recorded_by}`,
                data,
            }));
            await addNotification(notificationInfo);

        } catch (error) {
            console.error(error);
        }

        // emit notification
        const io = req.app.get("socketio");
        io.emit("notification", {
            message: `New complaint recorded by ${complaint.recorded_by}`,
            description: `Patient: ${complaint.first_name} ${complaint.surname}`
        });

        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create complaint" });
    }
}
