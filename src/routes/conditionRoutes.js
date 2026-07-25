import express from "express";
import { createCondition, getConditions, deleteCondition, updateCondition } from "../controllers/conditionController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";
const router = express.Router();

router.post("/conditions", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), createCondition);
router.get("/conditions", authenticate, getConditions);
router.delete("/conditions/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), deleteCondition);
router.put("/conditions/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.DOCTOR]), updateCondition);

export default router;