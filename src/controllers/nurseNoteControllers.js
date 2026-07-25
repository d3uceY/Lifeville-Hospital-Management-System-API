import { priorityLevels, NOTIFICATION_TYPES } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import * as nurseNoteServices from "../services/nurseNoteServices.js";
import { addNotification } from "../services/notificationServices.js";
import { formatDate } from "../utils/formatDate.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

// Get nurse's notes by patient ID
export const getNurseNotesByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const notes = await nurseNoteServices.getNurseNotesByPatientId(patientId);

    res.json({
      success: true,
      data: notes,
    });
  } catch (error) {
    console.error("Error fetching nurse notes:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create a new nurse's note
export const createNurseNote = async (req, res) => {
  try {
    const { patientId, note, recordedBy, visitInfo } = req.body;
    const newNote = await nurseNoteServices.createNurseNote({
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
        type: NOTIFICATION_TYPES.NURSE_NOTE,
        title: "Nurse's Note Added",
        message: `Nurse's note added for ${newNote.first_name} ${newNote.surname} by ${newNote.recorded_by}`,
        data,
      });

    } catch (error) {
      console.error(error);
    }

    // emit notification
    const io = req.app.get("socketio");
    io.emit("notification", {
      recipientRoles: NOTIFICATION_ROLES.CLINICAL,
      message: `Nurse's note added by ${newNote.recordedBy}`,
      description: `Patient: ${newNote.first_name} ${newNote.surname}`
    });

    res.json({
      success: true,
      data: newNote,
    });
    req.activityLogger(ACTIVITY_TYPES.NURSE_NOTE_CREATED, { noteId: newNote.id, patientId: newNote.patient_id });
  } catch (error) {
    console.error("Error creating nurse note:", error);
    res.status(error.status || 500).json({ success: false, error: error.message, code: error.code });
  }
};

// Update a nurse's note
export const updateNurseNote = async (req, res) => {
  try {
    const { id } = req.params; // note ID
    const { updatedBy, note } = req.body;

    const updatedNote = await nurseNoteServices.updateNurseNote(
      id,
      updatedBy,
      note
    );

    res.json({
      success: true,
      data: updatedNote,
    });
    req.activityLogger(ACTIVITY_TYPES.NURSE_NOTE_UPDATED, { noteId: Number(req.params.id) });
  } catch (error) {
    console.error("Error updating nurse note:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a nurse's note
export const deleteNurseNote = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNote = await nurseNoteServices.deleteNurseNote(id);

    res.json({
      success: true,
      data: deletedNote,
    });
    req.activityLogger(ACTIVITY_TYPES.NURSE_NOTE_DELETED, { noteId: Number(id) });
  } catch (error) {
    console.error("Error deleting nurse note:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
