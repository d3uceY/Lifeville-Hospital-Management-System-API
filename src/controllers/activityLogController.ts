import type { Request, Response } from "express";
import { getActivityLogs } from "../services/activityLogService.js";

export async function getActivityLogsController(req: Request, res: Response) {
    try {
        const { page = 1, pageSize = 25, userId, activityType, startDate, endDate } = req.query;

        const result = await getActivityLogs({
            page: Number(page),
            pageSize: Number(pageSize),
            userId: userId ? Number(userId) : undefined,
            activityType: activityType || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        });

        res.status(200).json(result);
    } catch (err) {
        console.error("getActivityLogsController:", err);
        res.status(500).json({ error: err.message });
    }
}
