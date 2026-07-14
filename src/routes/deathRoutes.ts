import express from "express";

import * as deathControllers from "../controllers/deathControllers.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.get("/deaths",  authenticate, deathControllers.getDeathRecords);
router.post("/deaths", authenticate, deathControllers.createDeathRecord);
router.delete("/deaths/:id", authenticate, deathControllers.deleteDeathRecord);
router.put("/deaths/:id", authenticate, deathControllers.updateDeathRecord);

export default router;
