// routes/bedRoutes.js

import express from "express";
import * as bedControllers from "../controllers/bedControllers.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const router = express.Router();

// Bed Types
router.get("/bed-types", authenticate, bedControllers.getBedTypes);
router.post("/bed-types", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), bedControllers.createBedType);
router.put("/bed-types/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), bedControllers.updateBedType);
router.delete("/bed-types/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), bedControllers.deleteBedType);

// Bed Groups
router.get("/bed-groups", authenticate, bedControllers.getBedGroups);
router.post("/bed-groups", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), bedControllers.createBedGroup);
router.put("/bed-groups/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), bedControllers.updateBedGroup);
router.delete("/bed-groups/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), bedControllers.deleteBedGroup);

// Beds
router.get("/beds", authenticate, bedControllers.getBeds);
router.get("/beds/:id", authenticate, bedControllers.viewBed);
router.post("/beds", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), bedControllers.createBed);
router.put("/beds/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), bedControllers.updateBed);
router.delete("/beds/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE]), bedControllers.deleteBed);

// Combined
router.get("/beds-data", authenticate, bedControllers.getBedData);

export default router;
