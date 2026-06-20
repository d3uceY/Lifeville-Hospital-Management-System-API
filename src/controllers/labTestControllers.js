import { priorityLevels, NOTIFICATION_TYPES } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import * as labTestServices from "../services/labTestServices.js";
import { addNotification } from "../services/notificationServices.js";
import { formatDate } from "../utils/formatDate.js";

export async function getLabTests(req, res) {
    try {
        const labTests = await labTestServices.getLabTests();
        res.json(labTests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve lab tests" });
    }
}

export const getPaginatedLabTests = async (req, res) => {
    try {
        const { page, pageSize, searchTerm } = req.query;
        const labTests = await labTestServices.getPaginatedLabTests(page, pageSize, searchTerm);
        res.json(labTests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve lab tests" });
    }
}

export const deleteLabTest = async (req, res) => {
    try {
        const labTest = await labTestServices.deleteLabTest(req.params.id);
        res.json(labTest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete lab test" });
    }
}


export const updateLabTest = async (req, res) => {
    try {
        // Get files from multer (if any were uploaded)
        const files = req.files || (req.file ? [req.file] : []);
        
        // Pass form data and files to service
        const labTest = await labTestServices.updateLabTest(req.params.id, req.body, files);
        if (!labTest) {
            return res.status(400).json({ error: "Failed to update lab test" });
        }

        // notification
        try {

            // Jsonb 
            const data = {
                first_name: labTest.first_name,
                surname: labTest.surname,
                patient_id: labTest.patientId,
                status: labTest.status,
                test_type: Array.isArray(labTest.testType) ? labTest.testType.join(", ") : labTest.testType,
                priority: priorityLevels.normal,
            }
            await addNotification({
                recipientRoles: NOTIFICATION_ROLES.LAB,
                type: NOTIFICATION_TYPES.LAB_TEST,
                title: "Lab Test Updated",
                message: `Lab test on ${formatDate(labTest.updatedAt)} has been updated to ${labTest.status}`,
                data,
            });

        } catch (error) {
            console.error(error);
        }

        // emit notification
        const io = req.app.get("socketio");
        io.emit("notification", {
            recipientRoles: NOTIFICATION_ROLES.LAB,
            message: `(${labTest.testType}) ${labTest.status} by ${labTest.prescribedBy}`,
            description: `Patient: ${labTest.first_name} ${labTest.surname}`
        });

        res.json(labTest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update lab test" });
    }
}

export async function getLabTestsByPatientId(req, res) {
    try {
        const labTests = await labTestServices.getLabTestsByPatientId(req.params.patientId);
        res.json(labTests);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve lab tests" });
    }
}

export async function createLabTest(req, res) {
    try {
        const labTest = await labTestServices.createLabTest(req.body);
        if (!labTest) {
            return res.status(400).json({ error: "Failed to create lab test" });
        }

        // notification to superadmin, doctor and lab
        try {

            // Jsonb data
            const data = {
                first_name: labTest.first_name,
                surname: labTest.surname,
                patient_id: labTest.patientId,
                status: labTest.status,
                test_type: Array.isArray(labTest.testType) ? labTest.testType.join(", ") : labTest.testType,
                priority: priorityLevels.normal,
            }
            await addNotification({
                recipientRoles: NOTIFICATION_ROLES.LAB,
                type: NOTIFICATION_TYPES.LAB_TEST,
                title: "Lab Test Created",
                message: `Lab test ${Array.isArray(labTest.testType) ? labTest.testType.join(", ") : labTest.testType} prescribed by ${labTest.prescribedBy} created on ${formatDate(labTest.createdAt)}`,
                data,
            });

        } catch (error) {
            console.error(error);
        }

        // emit notification
        const io = req.app.get("socketio");
        io.emit("notification", {
            recipientRoles: NOTIFICATION_ROLES.LAB,
            message: `(${labTest.testType}) Prescribed by ${labTest.prescribedBy}`,
            description: `Patient: ${labTest.first_name} ${labTest.surname}`
        });

        res.json(labTest);
    } catch (error) {
        console.error(error);
        res.status(error.status || 500).json({ error: error.message, code: error.code });
    }
}

export async function getLabTestById(req, res) {
    try {
        const labTest = await labTestServices.getLabTestById(req.params.id);
        res.json(labTest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to retrieve lab test" });
    }
}







export async function getLabTestTypes(req, res) {
    try {
        const labTestTypes = await labTestServices.getLabTestTypes();
        res.json(labTestTypes);
    } catch (error) {
        console.error("this is the errror", error);
        res.status(500).json({ error: "Failed to retrieve lab test types" });
    }
}

export async function deleteLabTestType(req, res) {
    try {
        const labTestType = await labTestServices.deleteLabTestType(req.params.id);
        res.json(labTestType);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete lab test type" });
    }
}

export const createLabTestType = async (req, res) => {
    try {
        const labTestType = await labTestServices.createLabTestType(req.body);
        res.json(labTestType);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create lab test type" });
    }
}

export const updateLabTestType = async (req, res) => {
    try {
        const labTestType = await labTestServices.updateLabTestType(req.params.id, req.body);
        res.json(labTestType);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update lab test type" });
    }
}
