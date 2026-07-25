import express from "express";

import * as deathControllers from "../controllers/deathControllers.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";
const router = express.Router();

router.get("/deaths",  authenticate, deathControllers.getDeathRecords);
router.post("/deaths", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), deathControllers.createDeathRecord);
router.delete("/deaths/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), deathControllers.deleteDeathRecord);
router.put("/deaths/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), deathControllers.updateDeathRecord);

export default router;
