import express from "express";
import { searchIcdCodes, getIcdByCode } from "../icd/controllers/icd.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/icd", authenticate, searchIcdCodes);
router.get("/icd/:code", authenticate, getIcdByCode);

export default router;
