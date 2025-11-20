import * as nurseNoteServices from "../services/nurseNoteServices.js";
import { addNotification } from "../services/notificationServices.js";
import { formatDate } from "../utils/formatDate.js";

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
    const { patientId, note, recordedBy } = req.body;
    const newNote = await nurseNoteServices.createNurseNote({
      patientId,
      note,
      recordedBy,
    });

    // Send notification
    try {
      const data = {
        first_name: newNote.first_name,
        surname: newNote.surname,
        patient_id: newNote.patient_id,
        note: newNote.note,
        recorded_by: newNote.recorded_by,
        priority: "normal",
      }
      const roles = ["superadmin", "doctor", "nurse"];

      const notificationInfo = roles.map(role => ({
        recipient_role: role,
        type: "NURSE_NOTE",
        title: "Nurse's Note Added",
        message: `Nurse's note added for ${newNote.first_name} ${newNote.surname} by ${newNote.recorded_by}`,
        data,
      }));
      await addNotification(notificationInfo);

    } catch (error) {
      console.error(error);
    }

    // emit notification
    const io = req.app.get("socketio");
    io.emit("notification", {
      message: `Nurse's note added by ${newNote.recorded_by}`,
      description: `Patient: ${newNote.first_name} ${newNote.surname}`
    });

    res.json({
      success: true,
      data: newNote,
    });
  } catch (error) {
    console.error("Error creating nurse note:", error);
    res.status(500).json({ success: false, message: "Server error" });
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
  } catch (error) {
    console.error("Error deleting nurse note:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
