import express from "express";
import { authenticate } from "../middleware/auth.js";
import * as appointmentController from "../controllers/appointmentController.js";

const routes = express.Router();

routes.get("/appointments", authenticate, appointmentController.getAppointments);

routes.get("/appointments/:id", authenticate, appointmentController.viewAppointment);

routes.get("/appointments/:patientId/patient", authenticate, appointmentController.getAppointmentsByPatientId);
routes.post("/appointments", authenticate, appointmentController.createAppointment);

routes.put("/appointments/:id", authenticate, appointmentController.updateAppointment);

routes.put(
  "/appointments/:appointment_id/status",
  authenticate,
  appointmentController.updateAppointmentStatusController
);


routes.delete("/appointments/:id", authenticate, appointmentController.deleteAppointment);

export default routes;
