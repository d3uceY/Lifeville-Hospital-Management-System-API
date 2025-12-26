// routes/billRoutes.js

import express from "express";
import * as billControllers from "../controllers/billController.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

router.post("/bills", authenticate, billControllers.createBill);
router.get("/bills", authenticate, billControllers.getPaginatedBills);
router.get("/bills/:id", authenticate, billControllers.getBillById);
router.put("/bills/:id", authenticate, billControllers.updateBillPayment);
router.delete("/bills/:id", authenticate, billControllers.deleteBill);
router.get("/patient-bills/:id", authenticate, billControllers.getBillByPatientId);
export default router;
