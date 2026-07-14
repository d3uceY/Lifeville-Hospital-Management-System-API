import type { Request, Response } from "express";
import { priorityLevels, NOTIFICATION_TYPES } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import * as vitalSignServices from '../services/vitalSignServices.js';
import { addNotification } from "../services/notificationServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

export const createVitalSign = async (req: Request, res: Response) => {
  try {
    const vitalSignData = req.body;
    const createdVitalSign = await vitalSignServices.createVitalSign(
      vitalSignData
    );

    // Send notification
    try {
      // Jsonb 
      const data = {
        first_name: createdVitalSign.first_name,
        surname: createdVitalSign.surname,
        patient_id: createdVitalSign.patient_id,
        recorded_by: createdVitalSign.recorded_by,
        priority: priorityLevels.normal,
      }
      await addNotification({
        recipientRoles: NOTIFICATION_ROLES.ALL_CLINICAL,
        type: NOTIFICATION_TYPES.VITAL_SIGNS,
        title: "Vital Signs Recorded",
        message: `Vital signs recorded for ${createdVitalSign.first_name} ${createdVitalSign.surname} by ${createdVitalSign.recorded_by}`,
        data,
      });

    } catch (error) {
      console.error(error);
    }

    // emit notification
    const io = req.app.get("socketio");
    io.emit("notification", {
      recipientRoles: NOTIFICATION_ROLES.ALL_CLINICAL,
      message: `Vital signs recorded by ${createdVitalSign.recorded_by}`,
      description: `Patient: ${createdVitalSign.first_name} ${createdVitalSign.surname} - BP: ${createdVitalSign.blood_pressure_systolic}/${createdVitalSign.blood_pressure_diastolic}, Temp: ${createdVitalSign.temperature}°C`
    });

    res
      .status(200)
      .json({ createdVitalSign, message: "Submitted Successfully" });
    req.activityLogger(ACTIVITY_TYPES.VITAL_SIGNS_RECORDED, { vitalSignId: createdVitalSign.id, patientId: createdVitalSign.patient_id });
  } catch (err) {
    console.error("error creating vital sign:", err);
    res.status(err.status || 500).json({ error: err.message, code: err.code });
  }
}

export const getVitalSignsByPatientId = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const vitalSigns = await vitalSignServices.getVitalSignsByPatientId(
      patientId
    );
    res.status(200).json({ vitalSigns });
  } catch (err) {
    console.error("error getting vital signs:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

export const updateVitalSign = async (req: Request, res: Response) => {
  try {
    const { vitalSignId } = req.params;
    const response = await vitalSignServices.updateVitalSign(req.body, vitalSignId)
    res.status(200).json({ response })
    req.activityLogger(ACTIVITY_TYPES.VITAL_SIGNS_UPDATED, { vitalSignId: Number(vitalSignId) });
  } catch (err) {
    console.error("error updating vital sign:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
}