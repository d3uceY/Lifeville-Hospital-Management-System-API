import express from "express";

import * as birthControllers from "../controllers/birthControllers.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/births",  authenticate, birthControllers.getBirthRecords);
router.post("/births", authenticate, birthControllers.createBirthRecord);
router.put("/births/:id", authenticate, birthControllers.updateBirthRecord);
router.delete("/births/:id", authenticate, birthControllers.deleteBirthRecord);

export default router;
