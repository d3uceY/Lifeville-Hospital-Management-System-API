import { priorityLevels } from "../constants/notification.js";
import * as physicalExaminationsServices from "../services/physicalExaminationsServices.js";
import { addNotification } from "../services/notificationServices.js";
import { formatDate } from "../utils/formatDate.js";

export const createPhysicalExamination = async (req, res) => {
  try {
    const physicalExamination = await physicalExaminationsServices.createPhysicalExamination(req.body);
    
    // Send notification
    try {
      const data = {
        first_name: physicalExamination.first_name,
        surname: physicalExamination.surname,
        patient_id: physicalExamination.patient_id,
        recorded_by: physicalExamination.recorded_by,
        findings: physicalExamination.findings,
        priority: priorityLevels.normal,
      }
      const roles = ["superadmin", "doctor", "nurse", "lab"];

      const notificationInfo = roles.map(role => ({
        recipient_role: role,
        type: "PHYSICAL_EXAMINATION",
        title: "Physical Examination Recorded",
        message: `Physical examination recorded for ${physicalExamination.first_name} ${physicalExamination.surname} by ${physicalExamination.recorded_by}`,
        data,
      }));
      await addNotification(notificationInfo);

    } catch (error) {
      console.error(error);
    }

    // emit notification
    const io = req.app.get("socketio");
    io.emit("notification", {
      message: `Physical examination recorded by ${physicalExamination.recorded_by}`,
      description: `Patient: ${physicalExamination.first_name} ${physicalExamination.surname}`
    });

    res.status(200).json({ physicalExamination, message: "Submitted Successfully" });
  } catch (err) {
    console.error("error creating physical examination:", err);
    res.status(500).json({ message: "internal server error" });
  }
};

export const getPhysicalExaminationsByPatientId = async (req, res) => {
  try {
    const physicalExaminations = await physicalExaminationsServices.getPhysicalExaminationsByPatientId(req.params.patientId);
    res.status(200).json(physicalExaminations);
  } catch (err) {
    console.error("error fetching physical examinations:", err);
    res.status(500).json({ message: "internal server error" });
  }
};

