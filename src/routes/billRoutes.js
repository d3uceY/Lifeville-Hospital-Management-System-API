import express from "express";
import * as billControllers from "../controllers/billController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const BILL_EDIT = [ROLES.SUPERADMIN, ROLES.ACCOUNTANT];

const router = express.Router();

router.post("/bills", authenticate, authorize(BILL_EDIT), billControllers.createBill);
router.get("/bills", authenticate, billControllers.getPaginatedBills);
router.get("/bills/:id", authenticate, billControllers.getBillById);
router.put("/bills/:id", authenticate, authorize(BILL_EDIT), billControllers.updateBillPayment);
router.delete("/bills/:id", authenticate, authorize(BILL_EDIT), billControllers.deleteBill);
router.get("/patient-bills/:id", authenticate, billControllers.getBillByPatientId);
export default router;
