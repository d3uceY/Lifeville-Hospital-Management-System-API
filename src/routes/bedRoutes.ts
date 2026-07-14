// routes/bedRoutes.js

import express from "express";
import * as bedControllers from "../controllers/bedControllers.js";

const router = express.Router();

// Bed Types
router.get("/bed-types", bedControllers.getBedTypes);   
router.post("/bed-types", bedControllers.createBedType);
router.put("/bed-types/:id", bedControllers.updateBedType);
router.delete("/bed-types/:id", bedControllers.deleteBedType);

// Bed Groups
router.get("/bed-groups", bedControllers.getBedGroups);
router.post("/bed-groups", bedControllers.createBedGroup);
router.put("/bed-groups/:id", bedControllers.updateBedGroup);
router.delete("/bed-groups/:id", bedControllers.deleteBedGroup);

// Beds
router.get("/beds", bedControllers.getBeds);
router.get("/beds/:id", bedControllers.viewBed);
router.post("/beds", bedControllers.createBed);
router.put("/beds/:id", bedControllers.updateBed);
router.delete("/beds/:id", bedControllers.deleteBed);

// Combined
router.get("/beds-data", bedControllers.getBedData);

export default router;
