import { priorityLevels, NOTIFICATION_TYPES } from "../constants/notification.js";
import * as appointmentService from "../services/appointmentServices.js";
import { formatDate } from "../utils/formatDate.js";
import { addNotification } from "../services/notificationServices.js";

// Get all appointments
export const getAppointments = async (req, res) => {
  try {
    const { page, pageSize, searchTerm } = req.query;
    const appointments = await appointmentService.getPaginatedAppointments(page, pageSize, searchTerm);
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve appointments" });
  }
};

// View a single appointment
export const viewAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await appointmentService.viewAppointment(appointmentId);

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve appointment" });
  }
};

// Create a new appointment
export const createAppointment = async (req, res) => {
  try {
    const appointmentData = req.body;
    const newAppointment = await appointmentService.createAppointment(
      appointmentData
    );
    if (!newAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // notification
    try {

      // Jsonb data
      const data = {
        first_name: newAppointment.first_name,
        surname: newAppointment.surname,
        patient_id: newAppointment.patient_id,
        priority: priorityLevels.normal,
      }
      const roles = ["superadmin", "doctor", "receptionist"];

      const notificationInfo = roles.map(role => ({
        recipient_role: role,
        type: NOTIFICATION_TYPES.APPOINTMENT,
        title: "New Appointment",
        message: `New appointment on ${formatDate(newAppointment.appointment_date)} has been created`,
        data,
      }));

      await addNotification(notificationInfo);

    } catch (error) {
      console.error(error);
    }

    const io = req.app.get("socketio");
    io.emit("notification", {
      message: `( New Appointment on ${formatDate(newAppointment.appointment_date)} ) Doctor: ${newAppointment.doctor_name}`,
      description: `Patient: ${newAppointment.first_name} ${newAppointment.surname}`
    });


    res
      .status(201)
      .json({ newAppointment, message: "Appointment created successfully" });
  } catch (error) {
    console.error(error)
    res
      .status(500)
      .json({ message: "Failed to create appointment", error: error.message });
  }
};

export const getAppointmentsByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    const appointments = await appointmentService.getAppointmentsByPatientId(patientId);
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve appointments" });
  }
};

// Update an appointment
export const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedAppointment = await appointmentService.updateAppointment(
      id,
      updateData
    );

    if (!updatedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // notification
    try {

      // Jsonb data
      const data = {
        first_name: updatedAppointment.first_name,
        surname: updatedAppointment.surname,
        patient_id: updatedAppointment.patient_id,
        priority: priorityLevels.normal,
      }
      const roles = ["superadmin", "doctor", "receptionist"];

      const notificationInfo = roles.map(role => ({
        recipient_role: role,
        type: NOTIFICATION_TYPES.APPOINTMENT,
        title: "Appointment Updated",
        message: `Appointment on ${formatDate(updatedAppointment.appointment_date)} has been updated (status: ${updatedAppointment.status})`,
        data,
      }));
      await addNotification(notificationInfo);

    } catch (error) {
      console.error(error);
    }

    const io = req.app.get("socketio");
    io.emit("notification", {
      message: `(Updated Appointment on ${formatDate(updatedAppointment.appointment_date)} ) Status: ${updatedAppointment.status}`,
      description: `Patient: ${updatedAppointment.first_name} ${updatedAppointment.surname}`
    });


    res.status(200).json({
      updatedAppointment,
      message: "Appointment updated successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to update appointment" });
  }
};

export const updateAppointmentStatusController = async (req, res) => {
  try {
    const { appointment_id } = req.params;
    const { status } = req.body;

    const updatedAppointment = await appointmentService.updateAppointmentStatus(
      appointment_id,
      status
    );


    if (!updatedAppointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    // notification
    try {

      // Jsonb data
      const data = {
        first_name: updatedAppointment.first_name,
        surname: updatedAppointment.surname,
        patient_id: updatedAppointment.patient_id,
        priority: priorityLevels.normal,
      }
      const roles = ["superadmin", "doctor", "receptionist"];

      const notificationInfo = roles.map(role => ({
        recipient_role: role,
        type: NOTIFICATION_TYPES.APPOINTMENT,
        title: "Appointment Updated",
        message: `Appointment on ${formatDate(updatedAppointment.appointment_date)} has been updated to ${updatedAppointment.status}`,
        data,
      }));
      await addNotification(notificationInfo);

    } catch (error) {
      console.error(error);
    }

    const io = req.app.get("socketio");
    io.emit("notification", {
      message: `(Updated Appointment on ${formatDate(updatedAppointment.appointment_date)} ) Status: ${updatedAppointment.status}`,
      description: `Patient: ${updatedAppointment.first_name} ${updatedAppointment.surname}`
    });

    res.status(200).json({
      updatedAppointment,
      message: "Appointment status updated successfully",
    });
  } catch (error) {
    console.error("Error updating appointment status:", error);
    res.status(500).json({
      error: "Failed to update appointment status",
      message: error.message,
    });
  }
};

// Delete an appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const isDeleted = await appointmentService.deleteAppointment(id);

    if (!isDeleted) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete appointment" });
  }
};
