import * as statsServices from "../services/statsServices.js";

export const getPatientStatusDistribution = async (req, res) => {
    try {
        const data = await statsServices.getPatientStatusDistribution();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch patient status distribution" });
    }
};

export const getStaffRolesDistribution = async (req, res) => {
    try {
        const data = await statsServices.getStaffRolesDistribution();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch staff roles distribution" });
    }
};

export const getAppointmentStatusDistribution = async (req, res) => {
    try {
        const data = await statsServices.getAppointmentStatusDistribution();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch appointment status distribution" });
    }
};

export const getAppointmensToday = async (req, res) => {
    try {
        const data = await statsServices.getAppointmensToday();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch appointments today" });
    }
};

export const getLabTestPending = async (req, res) => {
    try {
        const data = await statsServices.getLabTestPending();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch lab test pending" });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const data = await statsServices.getDashboardStats();
        res.status(200).json(data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
};

