import express from "express";
import { createCondition, getConditions, deleteCondition, updateCondition } from "../controllers/conditionController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.post("/conditions", authenticate, createCondition);
router.get("/conditions", authenticate, getConditions);
router.delete("/conditions/:id", authenticate, deleteCondition);
router.put("/conditions/:id", authenticate, updateCondition);

export default router;