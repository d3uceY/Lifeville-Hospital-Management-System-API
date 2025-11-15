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
                patient_id: labTest.patient_id,
                status: labTest.status,
                test_type: labTest.test_type,
                priority: "normal",
            }
            const roles = ["superadmin", "doctor", "lab"];

            const notificationInfo = roles.map(role => ({
                recipient_role: role,
                type: "LAB_TEST",
                title: "Lab Test Updated",
                message: `Lab test on ${formatDate(labTest.updated_at)} has been updated to ${labTest.status}`,
                data,
            }));
            await addNotification(notificationInfo);

        } catch (error) {
            console.error(error);
        }

        // emit notification
        const io = req.app.get("socketio");
        io.emit("notification", {
            message: `(${labTest.test_type}) ${labTest.status} by ${labTest.prescribed_by}`,
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
                patient_id: labTest.patient_id,
                status: labTest.status,
                test_type: labTest.test_type,
                priority: "normal",
            }
            const roles = ["superadmin", "doctor", "lab"];

            const notificationInfo = roles.map(role => ({
                recipient_role: role,
                type: "LAB_TEST",
                title: "Lab Test Created",
                message: `Lab test ${labTest.test_type} prescribed by ${labTest.prescribed_by} created on ${formatDate(labTest.created_at)}`,
                data,
            }));
            await addNotification(notificationInfo);

        } catch (error) {
            console.error(error);
        }

        // emit notification
        const io = req.app.get("socketio");
        io.emit("notification", {
            message: `(${labTest.test_type}) Prescribed by ${labTest.prescribed_by}`,
            description: `Patient: ${labTest.first_name} ${labTest.surname}`
        });

        res.json(labTest);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create lab test" });
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
