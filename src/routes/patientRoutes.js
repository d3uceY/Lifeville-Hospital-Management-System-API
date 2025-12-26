// routes/patientRoutes.js
import express from "express";
import * as patientController from "../controllers/patientControllers.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.get("/patients", authenticate, patientController.getPatients);

router.get("/patients/:id", authenticate, patientController.viewPatient);

router.post("/patients", authenticate, patientController.createPatients);

router.put("/patients/:id", authenticate, patientController.updatePatient);

router.delete("/patients/:id", authenticate, patientController.deletePatient);

export default router;
