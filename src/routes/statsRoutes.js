import express from "express";
import * as statsController from "../controllers/statsController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.get("/stats/patient-status-distribution", authenticate, statsController.getPatientStatusDistribution);
router.get("/stats/staff-roles-distribution", authenticate, statsController.getStaffRolesDistribution);
router.get("/stats/appointment-status-distribution", authenticate, statsController.getAppointmentStatusDistribution);
router.get("/stats/appointments-today", authenticate, statsController.getAppointmensToday);
router.get("/stats/lab-test-pending", authenticate, statsController.getLabTestPending);
export default router;

