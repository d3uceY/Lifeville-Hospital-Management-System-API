import express from "express";
import * as billingController from "../controllers/billingController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const router = express.Router();

// Admission & visit bill views
router.get("/admissions/:admissionId/bill", authenticate, billingController.getAdmissionBill);
router.get("/visits/:visitId/bill", authenticate, billingController.getVisitBill);
router.get("/billing/invoices/:invoiceId", authenticate, billingController.getManualBill);

// Manual bill item (internal / admin use)
router.post("/billing/add-item", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT]), billingController.addBillItem);
router.delete("/billing/items/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT]), billingController.deleteBillItem);

// Payments
router.post("/billing/payments", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT]), billingController.recordPayment);

// Services (price catalog)
router.get("/services/counts", authenticate, billingController.getServiceCounts);
router.get("/services", authenticate, billingController.getServices);
router.post("/services", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT]), billingController.createService);
router.put("/services/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT]), billingController.updateService);
router.delete("/services/:id", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT]), billingController.deleteService);

// Patient-level invoices (all invoices for a patient)
router.get("/patients/:patientId/invoices", authenticate, billingController.getPatientInvoices);
router.post("/patients/:patientId/invoices", authenticate, billingController.createPatientInvoice);

// Active billing context (single optimized call)
router.get("/patients/:patientId/billing-context", authenticate, billingController.getPatientBillingContext);

// Global paginated invoices list
router.get("/invoices", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT]), billingController.getAllInvoices);

// Billing analytics
router.get("/billing/stats", authenticate, authorize([ROLES.SUPERADMIN, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT]), billingController.getBillingStats);

export default router;
