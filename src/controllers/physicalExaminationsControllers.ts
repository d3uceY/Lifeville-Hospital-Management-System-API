import type { Request, Response } from "express";
import { priorityLevels, NOTIFICATION_TYPES } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import * as physicalExaminationsServices from "../services/physicalExaminationsServices.js";
import { addNotification } from "../services/notificationServices.js";
import { formatDate } from "../utils/formatDate.js";

export const createPhysicalExamination = async (req: Request, res: Response) => {
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
      await addNotification({
        recipientRoles: NOTIFICATION_ROLES.ALL_CLINICAL,
        type: NOTIFICATION_TYPES.PHYSICAL_EXAMINATION,
        title: "Physical Examination Recorded",
        message: `Physical examination recorded for ${physicalExamination.first_name} ${physicalExamination.surname} by ${physicalExamination.recorded_by}`,
        data,
      });

    } catch (error) {
      console.error(error);
    }

    // emit notification
    const io = req.app.get("socketio");
    io.emit("notification", {
      recipientRoles: NOTIFICATION_ROLES.ALL_CLINICAL,
      message: `Physical examination recorded by ${physicalExamination.recorded_by}`,
      description: `Patient: ${physicalExamination.first_name} ${physicalExamination.surname}`
    });

    res.status(200).json({ physicalExamination, message: "Submitted Successfully" });
  } catch (err) {
    console.error("error creating physical examination:", err);
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
};

export const getPhysicalExaminationsByPatientId = async (req: Request, res: Response) => {
  try {
    const physicalExaminations = await physicalExaminationsServices.getPhysicalExaminationsByPatientId(req.params.patientId);
    res.status(200).json(physicalExaminations);
  } catch (err) {
    console.error("error fetching physical examinations:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

