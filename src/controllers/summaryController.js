import * as summaryServices from "../services/summaryServices.js";

export const getPatientDashboardSummary = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await summaryServices.getPatientDashboardSummary(patientId);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get patient dashboard summary" });
    }
}

export const getAdmissionSummaryByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await summaryServices.getAdmissionSummaryByPatientId(patientId);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get admission summary" });
    }
}

export const getDiagnosisSummaryByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await summaryServices.getDiagnosisSummaryByPatientId(patientId);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get diagnosis summary" });
    }
}

export const getLabTestSummaryByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await summaryServices.getLabTestSummaryByPatientId(patientId);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get lab test summary" });
    }
}

export const getVitalSignSummaryByPatientId = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await summaryServices.getVitalSignSummaryByPatientId(patientId);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to get vital sign summary" });
    }
}
