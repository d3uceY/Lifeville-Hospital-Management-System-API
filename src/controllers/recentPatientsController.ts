import type { Request, Response } from "express";
import { recordRecentPatient, getRecentPatients } from "../services/recentPatientsCache.js";
import * as patientVisitsServices from "../services/patientVisitsServices.js";

/**
 * POST /api/patients/recent-viewed
 * Records that the authenticated user viewed a patient.
 * Body: { patientId, surname, first_name, sex, hospitalNumber }
 */
export const recordRecentViewed = (req: Request, res: Response) => {
  try {
    const { patientId, surname, first_name, sex, hospitalNumber } = req.body;
    if (!patientId) return res.status(400).json({ error: "patientId is required" });

    recordRecentPatient((req as any).userId, { patientId, surname, first_name, sex, hospitalNumber });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error recording recent patient:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/patients/recent-viewed
 * Returns the last 5 recently viewed patients for the authenticated user.
 */
export const getRecentViewed = (req: Request, res: Response) => {
  try {
    const recent = getRecentPatients((req as any).userId);
    res.status(200).json(recent);
  } catch (err) {
    console.error("Error fetching recent patients:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * GET /api/patient-visits/recent
 * Returns the last 5 unique patient visits across the hospital.
 */
export const getRecentVisits = async (req: Request, res: Response) => {
  try {
    const visits = await patientVisitsServices.getRecentUniqueVisits(5);
    res.status(200).json(visits);
  } catch (err) {
    console.error("Error fetching recent visits:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
