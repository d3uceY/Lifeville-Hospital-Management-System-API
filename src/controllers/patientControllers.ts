import { HttpError } from "../lib/errors.js";
import type { Request, Response } from "express";
import { priorityLevels, NOTIFICATION_TYPES } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import * as patientServices from "../services/patientServices.js";
import * as patientImageService from "../services/patientImageService.js";
import { formatDate } from "../utils/formatDate.js";
import { addNotification } from "../services/notificationServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

export const getPatients = async (req: Request, res: Response) => {
  try {
    const patients = await patientServices.getPatients();
    res.status(200).json(patients);
  } catch (err) {
    console.error("error fetching patients:", err);
    res.status(500).json({
      message: "internal server error",
    });
  }
};

export const createPatients = async (req: Request, res: Response) => {
  try {
    const patientData = req.body;
    const newPatient = await patientServices.createPatient(patientData);

    if (!newPatient) {
      return res.status(400).json({
        message: "Failed to create patient",
      });
    }

    // notification 
    try {

      // Jsonb data
      const data = {
        first_name: newPatient.firstName,
        surname: newPatient.surname,
        patient_id: newPatient.patientId,
        priority: priorityLevels.normal,
      }

      await addNotification({
        recipientRoles: NOTIFICATION_ROLES.ALL_STAFF,
        type: NOTIFICATION_TYPES.PATIENT,
        title: "New Patient Added",
        message: `New patient ${newPatient.firstName} ${newPatient.surname} has been added`,
        data,
      });

    } catch (error) {
      console.error(error);
    }

    // emit notification
    const io = req.app.get("socketio");
    io.emit("notification", {
      recipientRoles: NOTIFICATION_ROLES.ALL_STAFF,
      message: "New Patient Added",
      description: `${newPatient.firstName} ${newPatient.surname}`
    });

    res.status(200).json({ newPatient, message: "Submitted Successfully" });
    req.activityLogger(ACTIVITY_TYPES.PATIENT_CREATED, { patientId: newPatient.patient_id });
  } catch (err) {


    if (err.code === "DUPLICATE_HOSPITAL_NUMBER") {
      return res.status(400).json({
        error: err.message,
      });
    }

    res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
};

export const viewPatient = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;
    const patient = await patientServices.viewPatient(patientId);
    res.status(200).json(patient);
  } catch (err) {
    console.error("error fetching patient:", err);
    res.status(500).json({
      message: "internal server error",
      err,
    });
  }
};

export const updatePatient = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;
    const patientData = req.body;
    const updatedPatient = await patientServices.updatePatient(
      patientId,
      patientData
    );

    if (!updatedPatient) {
      return res.status(400).json({
        message: "Failed to update patient",
      });
    }

    // notification
    try {

      // Jsonb data
      const data = {
        first_name: updatedPatient.first_name,
        surname: updatedPatient.surname,
        patient_id: updatedPatient.patient_id,
        priority: "urgent",
      }
      await addNotification({
        recipientRoles: NOTIFICATION_ROLES.ALL_STAFF,
        type: NOTIFICATION_TYPES.PATIENT,
        title: "Patient Updated",
        message: `Patient ${updatedPatient.first_name} ${updatedPatient.surname} has been updated`,
        data,
      });

    } catch (error) {
      console.error(error);
    }

    // emit notification
    const io = req.app.get("socketio");
    io.emit("notification", {
      recipientRoles: NOTIFICATION_ROLES.ALL_STAFF,
      message: "Patient Updated",
      description: `${updatedPatient.firstName} ${updatedPatient.surname}`
    });

    res.status(200).json({ updatedPatient, message: "Updated Successfully" });
    req.activityLogger(ACTIVITY_TYPES.PATIENT_UPDATED, { patientId: updatedPatient.patient_id });
  } catch (err) {
    console.error("this is za error", err.code);
    // Check if the error is related to duplicate id
    if (err.code === "PATIENT_NOT_FOUND") {
      return res.status(404).json({
        message: err.message, // Send custom error message to the frontend
      });
    }

    if (err?.code === "23505") {
      return res.status(404).json({
        message: err.detail,
      });
    }

    res.status(500).json({
      message: "internal server error",
      err,
    });
  }
};

export const deletePatient = async (req: Request, res: Response) => {
  try {
    const patientId = req.params.id;
    const deletedPatient = await patientServices.deletePatient(patientId);
    res.status(200).json({ deletedPatient, message: "Deleted Successfully" });
    req.activityLogger(ACTIVITY_TYPES.PATIENT_DELETED, { patientId: req.params.id });
  } catch (err) {
    console.error("error deleting patient:", err);
    res.status(500).json({
      message: "internal server error",
      err,
    });
  }
};

export const uploadPatientProfileImage = async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.params.id);

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const mediaRecord = await patientImageService.upsertPatientProfileImage(
      patientId,
      req.file.buffer,
      req.file.mimetype
    );

    res.status(200).json({ mediaRecord, message: "Profile image uploaded successfully" });
  } catch (err) {
    console.error("error uploading patient profile image:", err);

    if (err.code === "PATIENT_NOT_FOUND") {
      return res.status(404).json({ message: err.message });
    }

    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

export const deletePatientProfileImage = async (req: Request, res: Response) => {
  try {
    const patientId = Number(req.params.id);

    await patientImageService.deletePatientProfileImage(patientId);

    res.status(200).json({ message: "Profile image deleted successfully" });
  } catch (err) {
    console.error("error deleting patient profile image:", err);

    if (err.code === "PATIENT_NOT_FOUND") {
      return res.status(404).json({ message: err.message });
    }

    if (err.code === "NO_PROFILE_IMAGE") {
      return res.status(404).json({ message: err.message });
    }

    res.status(500).json({ error: err.message || "Internal server error" });
  }
};
