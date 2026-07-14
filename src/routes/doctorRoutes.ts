import express from "express";

import * as doctorControllers from "../controllers/doctorControllers.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/doctors", authenticate, doctorControllers.getDoctors);
router.get("/doctors/:id", authenticate, doctorControllers.viewDoctor);
router.post("/doctors", authenticate, doctorControllers.createDoctor);
router.put("/doctors", authenticate, doctorControllers.updateDoctor);
router.delete("/doctors/:id", authenticate, doctorControllers.deleteDoctor);

export default router;
