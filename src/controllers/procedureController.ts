import type { Request, Response } from "express";
import * as procedureServices from "../services/procedureServices.js";

export async function addProcedureController(req: Request, res: Response) {
    try {
        const procedure = await procedureServices.addProcedure(req.body);
        res.json(procedure);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message, code: err.code });
    }
}

export async function getProceduresByPatientIdController(req: Request, res: Response) {
    try {
        const procedures = await procedureServices.getProceduresByPatientId(req.params.patient_id);
        res.json(procedures);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
