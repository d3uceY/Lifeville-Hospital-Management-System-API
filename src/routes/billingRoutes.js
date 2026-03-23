import express from "express";
import * as billingController from "../controllers/billingController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Admission & visit bill views
router.get("/admissions/:admissionId/bill", authenticate, billingController.getAdmissionBill);
router.get("/visits/:visitId/bill", authenticate, billingController.getVisitBill);

// Manual bill item (internal / admin use)
router.post("/billing/add-item", authenticate, billingController.addBillItem);

// Payments
router.post("/billing/payments", authenticate, billingController.recordPayment);

// Services (price catalog)
router.get("/services", authenticate, billingController.getServices);
router.post("/services", authenticate, billingController.createService);
router.put("/services/:id", authenticate, billingController.updateService);
router.delete("/services/:id", authenticate, billingController.deleteService);

// Patient-level invoices (all invoices for a patient)
router.get("/patients/:patientId/invoices", authenticate, billingController.getPatientInvoices);
router.post("/patients/:patientId/invoices", authenticate, billingController.createPatientInvoice);

// Active billing context (single optimized call)
router.get("/patients/:patientId/billing-context", authenticate, billingController.getPatientBillingContext);

export default router;
