import express from "express";
import { createPhysicalExamination, getPhysicalExaminationsByPatientId } from "../controllers/physicalExaminationsControllers.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.post("/physical-examinations", authenticate, createPhysicalExamination);
router.get("/physical-examinations/patient/:patientId", authenticate, getPhysicalExaminationsByPatientId);


export default router;