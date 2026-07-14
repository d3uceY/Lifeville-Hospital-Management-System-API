import type { Request, Response } from "express";
import { listRoles } from "../services/rolesService.js";

export async function getRolesController(req: Request, res: Response) {
    try {
        const roles = await listRoles();
        return res.status(200).json({ success: true, data: roles });
    } catch (error) {
        console.error("getRolesController error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch roles" });
    }
}
