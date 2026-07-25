import express from "express";

import * as birthControllers from "../controllers/birthControllers.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const router = express.Router();

router.get("/births",  authenticate, birthControllers.getBirthRecords);
router.post("/births", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), birthControllers.createBirthRecord);
router.put("/births/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), birthControllers.updateBirthRecord);
router.delete("/births/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), birthControllers.deleteBirthRecord);

export default router;
