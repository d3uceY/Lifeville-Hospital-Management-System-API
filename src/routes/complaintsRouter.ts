import express from "express";
import { createComplaint, getComplaints, getComplaintsByPatientId } from "../controllers/complaintsController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.get("/complaints", authenticate, getComplaints);
router.get("/complaints/:patientId", authenticate, getComplaintsByPatientId);
router.post("/complaints", authenticate, createComplaint);

export default router;