import type { Request, Response } from "express";
import { priorityLevels, NOTIFICATION_TYPES } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import * as doctorNoteServices from "../services/doctorNoteServices.js";
import { addNotification } from "../services/notificationServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

// Get doctor's notes by patient ID
export const getDoctorNotesByPatientId = async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const notes = await doctorNoteServices.getDoctorNotesByPatientId(patientId);

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error("Error fetching doctor notes:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create a new doctor's note
export const createDoctorNote = async (req: Request, res: Response) => {
  try {
    const { patientId, note, recordedBy, visitInfo } = req.body;
    const newNote = await doctorNoteServices.createDoctorNote({
      patientId,
      note,
      recordedBy,
      visitInfo,
    });

    // Send notification
    try {
      const data = {
        first_name: newNote.first_name,
        surname: newNote.surname,
        patient_id: newNote.patient_id,
        note: newNote.note,
        recorded_by: newNote.recorded_by,
        priority: priorityLevels.normal,
      }
      await addNotification({
        recipientRoles: NOTIFICATION_ROLES.CLINICAL,
        type: NOTIFICATION_TYPES.DOCTOR_NOTE,
        title: "Doctor's Note Added",
        message: `Doctor's note added for ${newNote.first_name} ${newNote.surname} by ${newNote.recorded_by}`,
        data,
      });

    } catch (error) {
      console.error(error);
    }

    // emit notification
    const io = req.app.get("socketio");
    io.emit("notification", {
      recipientRoles: NOTIFICATION_ROLES.CLINICAL,
      message: `Doctor's note added by ${newNote.recorded_by}`,
      description: `Patient: ${newNote.first_name} ${newNote.surname}`
    });

    res.json({
      success: true,
      data: newNote,
    });
    req.activityLogger(ACTIVITY_TYPES.DOCTOR_NOTE_CREATED, { noteId: newNote.id, patientId: newNote.patient_id });
  } catch (error) {
    console.error("Error creating doctor note:", error);
    res.status(error.status || 500).json({ success: false, error: error.message, code: error.code });
  }
};

// Update a doctor's note
export const updateDoctorNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // note ID
    const { updatedBy, note } = req.body;

    const updatedNote = await doctorNoteServices.updateDoctorNote(
      { updatedBy, note }, id
    );

    res.json({
      success: true,
      data: updatedNote,
    });
    req.activityLogger(ACTIVITY_TYPES.DOCTOR_NOTE_UPDATED, { noteId: Number(req.params.id) });
  } catch (error) {
    console.error("Error updating doctor note:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a doctor's note
export const deleteDoctorNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedNote = await doctorNoteServices.deleteDoctorNote(id);

    res.json({
      success: true,
      data: deletedNote,
    });
  } catch (error) {
    console.error("Error deleting doctor note:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
