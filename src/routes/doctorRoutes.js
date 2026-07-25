import express from "express";

import * as doctorControllers from "../controllers/doctorControllers.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const router = express.Router();

router.get("/doctors", authenticate, doctorControllers.getDoctors);
router.get("/doctors/:id", authenticate, doctorControllers.viewDoctor);
router.post("/doctors", authenticate, authorize([ROLES.SUPERADMIN]), doctorControllers.createDoctor);
router.put("/doctors", authenticate, authorize([ROLES.SUPERADMIN]), doctorControllers.updateDoctor);
router.delete("/doctors/:id", authenticate, authorize([ROLES.SUPERADMIN]), doctorControllers.deleteDoctor);

export default router;
