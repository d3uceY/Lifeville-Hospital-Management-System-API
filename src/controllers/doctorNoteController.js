import { priorityLevels } from "../constants/notification.js";
import * as doctorNoteServices from "../services/doctorNoteServices.js";
import { addNotification } from "../services/notificationServices.js";
import { formatDate } from "../utils/formatDate.js";

// Get doctor's notes by patient ID
export const getDoctorNotesByPatientId = async (req, res) => {
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
export const createDoctorNote = async (req, res) => {
  try {
    const { patientId, note, recordedBy } = req.body;
    const newNote = await doctorNoteServices.createDoctorNote({
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
        priority: priorityLevels.normal,
      }
      const roles = ["superadmin", "doctor", "nurse"];

      const notificationInfo = roles.map(role => ({
        recipient_role: role,
        type: "DOCTOR_NOTE",
        title: "Doctor's Note Added",
        message: `Doctor's note added for ${newNote.first_name} ${newNote.surname} by ${newNote.recorded_by}`,
        data,
      }));
      await addNotification(notificationInfo);

    } catch (error) {
      console.error(error);
    }

    // emit notification
    const io = req.app.get("socketio");
    io.emit("notification", {
      message: `Doctor's note added by ${newNote.recorded_by}`,
      description: `Patient: ${newNote.first_name} ${newNote.surname}`
    });

    res.json({
      success: true,
      data: newNote,
    });
  } catch (error) {
    console.error("Error creating doctor note:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update a doctor's note
export const updateDoctorNote = async (req, res) => {
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
  } catch (error) {
    console.error("Error updating doctor note:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a doctor's note
export const deleteDoctorNote = async (req, res) => {
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
