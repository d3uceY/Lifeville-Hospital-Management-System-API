import { HttpError } from "../lib/errors.js";
import type { Request, Response } from "express";
/**
 * billingController.js
 * Handles event-driven billing endpoints.
 */

import * as billingService from "../services/billingService.js";
import * as billingStatsService from "../services/billingStatsService.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

// ─── GET /admissions/:admissionId/bill ────────────────────────────────────────
export const getAdmissionBill = async (req: Request, res: Response) => {
  try {
    const bill = await billingService.getBillForAdmission(Number(req.params.admissionId));
    res.status(200).json(bill);
  } catch (err) {
    console.error("getAdmissionBill:", err);
    res.status(err.message === "Admission not found" ? 404 : 500).json({ error: err.message });
  }
};

// ─── GET /visits/:visitId/bill ────────────────────────────────────────────────
export const getVisitBill = async (req: Request, res: Response) => {
  try {
    const bill = await billingService.getBillForVisit(Number(req.params.visitId));
    res.status(200).json(bill);
  } catch (err) {
    console.error("getVisitBill:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /billing/stats ───────────────────────────────────────────────────────
export const getBillingStats = async (req: Request, res: Response) => {
  try {
    const { from, to, groupBy } = req.query;
    const stats = await billingStatsService.getBillingStats({ from, to, groupBy });
    res.status(200).json(stats);
  } catch (err) {
    console.error("getBillingStats:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /billing/invoices/:invoiceId ────────────────────────────────────────
export const getManualBill = async (req: Request, res: Response) => {
  try {
    const bill = await billingService.getBillForManualInvoice(Number(req.params.invoiceId));
    res.status(200).json(bill);
  } catch (err) {
    console.error("getManualBill:", err);
    res.status(err.message === "Invoice not found" ? 404 : 500).json({ error: err.message });
  }
};

// ─── POST /billing/add-item ───────────────────────────────────────────────────
export const addBillItem = async (req: Request, res: Response) => {
  try {
    const {
      admissionId, visitId, invoiceId, serviceId,
      description, category, quantity, unitPrice,
      billingType, discountPercent,
    } = req.body;

    if (!description || unitPrice === undefined) {
      return res.status(400).json({ error: "description and unitPrice are required" });
    }
    if (!admissionId && !visitId && !invoiceId) {
      return res.status(400).json({ error: "admissionId, visitId, or invoiceId is required" });
    }

    const item = await billingService.addItem({
      admissionId: admissionId ? Number(admissionId) : null,
      visitId: visitId ? Number(visitId) : null,
      invoiceId: invoiceId ? Number(invoiceId) : null,
      serviceId: serviceId ? Number(serviceId) : null,
      description,
      category: category || "service",
      quantity: Number(quantity) || 1,
      unitPrice: Number(unitPrice),
      billingType: billingType || "credit",
      discountPercent: Number(discountPercent) || 0,
      createdBy: req.user?.id || null,
    });

    res.status(201).json({ item, message: "Bill item added" });
  } catch (err) {
    console.error("addBillItem:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ─── POST /billing/payments ───────────────────────────────────────────────────
export const recordPayment = async (req: Request, res: Response) => {
  try {
    const { invoiceId, amount, paymentMethod, notes } = req.body;
    if (!invoiceId || !amount) {
      return res.status(400).json({ error: "invoiceId and amount are required" });
    }
    const payment = await billingService.recordPayment({
      invoiceId: Number(invoiceId),
      amount: Number(amount),
      paymentMethod: paymentMethod || "cash",
      notes: notes || null,
      createdBy: req.user?.id || null,
    });
    res.status(201).json({ payment, message: "Payment recorded" });
    req.activityLogger(ACTIVITY_TYPES.PAYMENT_RECORDED, { invoiceId: Number(req.body.invoiceId), amount: Number(req.body.amount) });
  } catch (err) {
    console.error("recordPayment:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ─── GET /services/counts ─────────────────────────────────────────────────────
export const getServiceCounts = async (req: Request, res: Response) => {
  try {
    const counts = await billingService.getServiceCounts();
    res.status(200).json(counts);
  } catch (err) {
    console.error("getServiceCounts:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /services ────────────────────────────────────────────────────────────
// Supports optional query params: page, pageSize, category, search
// When pageSize is provided returns a pagination envelope; otherwise a flat array.
export const getServices = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, category, search } = req.query;
    const list = await billingService.listServices({ page, pageSize, category, search });
    res.status(200).json(list);
  } catch (err) {
    console.error("getServices:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /services ───────────────────────────────────────────────────────────
export const createService = async (req: Request, res: Response) => {
  try {
    const { name, category, price, isVariablePrice } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ error: "name, category, and price are required" });
    }
    const svc = await billingService.upsertService({ name, category, price: Number(price), isVariablePrice: !!isVariablePrice });
    res.status(201).json({ service: svc, message: "Service created" });
  } catch (err) {
    if (err.code === "DUPLICATE_SERVICE_NAME") {
      return res.status(409).json({ error: err.message });
    }
    console.error("createService:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── PUT /services/:id ────────────────────────────────────────────────────────
export const updateService = async (req: Request, res: Response) => {
  try {
    const { name, category, price, isVariablePrice } = req.body;
    const svc = await billingService.upsertService({
      id: Number(req.params.id),
      name, category,
      price: Number(price),
      isVariablePrice: !!isVariablePrice,
    });
    res.status(200).json({ service: svc, message: "Service updated" });
  } catch (err) {
    console.error("updateService:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /services/:id ─────────────────────────────────────────────────────
export const deleteService = async (req: Request, res: Response) => {
  try {
    const deleted = await billingService.deleteService(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Service not found" });
    res.status(200).json({ message: "Service deleted" });
  } catch (err) {
    if (err.code === "SYSTEM_SERVICE") {
      return res.status(403).json({ error: err.message });
    }
    console.error("deleteService:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /patients/:patientId/invoices ────────────────────────────────────────
export const getPatientInvoices = async (req: Request, res: Response) => {
  try {
    const invoices = await billingService.getPatientInvoices(Number(req.params.patientId));
    res.status(200).json(invoices);
  } catch (err) {
    console.error("getPatientInvoices:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /patients/:patientId/invoices ───────────────────────────────────────
export const createPatientInvoice = async (req: Request, res: Response) => {
  try {
    const invoice = await billingService.createPatientInvoice(Number(req.params.patientId));
    res.status(201).json({ invoice, message: "Manual invoice created" });
  } catch (err) {
    console.error("createPatientInvoice:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /patients/:patientId/billing-context ─────────────────────────────────
export const getPatientBillingContext = async (req: Request, res: Response) => {
  try {
    const context = await billingService.getPatientBillingContext(Number(req.params.patientId));
    res.status(200).json(context);
  } catch (err) {
    console.error("getPatientBillingContext:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /billing/items/:id ───────────────────────────────────────────────
export const deleteBillItem = async (req: Request, res: Response) => {
  try {
    const deleted = await billingService.deleteBillItem(Number(req.params.id));
    if (!deleted) return res.status(404).json({ error: "Bill item not found" });
    res.status(200).json({ message: "Bill item deleted", item: deleted });
  } catch (err) {
    console.error("deleteBillItem:", err);
    res.status(err.status || 500).json({ error: err.message });
  }
};

// ─── GET /invoices (paginated global list) ────────────────────────────────────────
export const getAllInvoices = async (req: Request, res: Response) => {
  try {
    const { page, pageSize, search, status } = req.query;
    const result = await billingService.getPaginatedInvoices({ page, pageSize, search, status });
    res.status(200).json(result);
  } catch (err) {
    console.error("getAllInvoices:", err);
    res.status(500).json({ error: err.message });
  }
};
