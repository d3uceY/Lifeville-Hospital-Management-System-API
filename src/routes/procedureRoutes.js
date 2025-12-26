import * as procedureController from "../controllers/procedureController.js";
import express from "express";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.post("/procedures", authenticate, procedureController.addProcedureController);
router.get("/procedures/:patient_id", procedureController.getProceduresByPatientIdController);

export default router;
