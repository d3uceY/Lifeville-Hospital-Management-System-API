import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../constants/config.js";

export function authenticateRefresh(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.refresh_token;
    if (!token) return res.sendStatus(401);
    try {
        const payload = jwt.verify(token, config.auth.jwtRefreshKey);
        req.userId = payload.sub;
        return next();
    } catch {
        return res.sendStatus(401);
    }
}
