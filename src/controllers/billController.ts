import type { Request, Response } from "express";
import * as billService from "../services/billServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";


export const createBill = async (req: Request, res: Response) => {
    try {
        const billData = req.body;
        const newBill = await billService.createBill(billData);
        res.status(201).json({ newBill, message: "Bill created" });
        req.activityLogger(ACTIVITY_TYPES.BILL_CREATED, { billId: newBill.id });
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}

export const getBillByPatientId = async (req: Request, res: Response) => {
    try {
        const patientId = req.params.id;
        const bills = await billService.getBillByPatientId(patientId);
        res.status(200).json(bills);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}

export const getPaginatedBills = async (req: Request, res: Response) => {
    try {
        const { page, pageSize, billNumber, status, issuedBy, patientId } = req.query;
        const bills = await billService.getPaginatedBills(page, pageSize, { billNumber, status, issuedBy, patientId });
        res.status(200).json(bills);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}

export const deleteBill = async (req: Request, res: Response) => {
    try {
        const billId = req.params.id;
        const deletedBill = await billService.deleteBill(billId);
        res.status(200).json({ deletedBill, message: "Bill deleted" });
        req.activityLogger(ACTIVITY_TYPES.BILL_DELETED, { billId: Number(req.params.id) });
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}


export const getBillById = async (req: Request, res: Response) => {
    try {
        const billId = req.params.id;
        const bill = await billService.getBillById(billId);
        res.status(200).json(bill);
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: err.message });
    }
}

export const updateBillPayment = async (req: Request, res: Response) => {
    try {
        const billId = req.params.id;
        const updatedBill = await billService.updateBillPayment(billId, req.body);
        if (!updatedBill) return res.status(404).json({ error: "Bill not found" });
        res.status(200).json({ updatedBill, message: "Bill updated" });
        req.activityLogger(ACTIVITY_TYPES.BILL_UPDATED, { billId: Number(req.params.id) });
    } catch (err) {
        console.error(err)
        res.status(err.status || 500).json({ error: err.message });
    }
}
