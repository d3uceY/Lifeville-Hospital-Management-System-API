import type { Request, Response, NextFunction } from "express";

export const authorize = (allowed: string[] = []) => (req: Request, res: Response, next: NextFunction) => {
  if (req.userRole && allowed.includes(req.userRole)) {
    return next();
  }
  res.status(403).json({ error: "Forbidden" });
};
