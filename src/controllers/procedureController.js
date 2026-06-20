import * as procedureServices from "../services/procedureServices.js";

export async function addProcedureController(req, res) {
    try {
        const procedure = await procedureServices.addProcedure(req.body);
        res.json(procedure);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message, code: err.code });
    }
}

export async function getProceduresByPatientIdController(req, res) {
    try {
        const procedures = await procedureServices.getProceduresByPatientId(req.params.patient_id);
        res.json(procedures);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
