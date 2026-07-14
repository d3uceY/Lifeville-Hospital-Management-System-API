import type { Request, Response } from "express";
import * as conditionServices from "../services/conditionServices.js";
import { isHttpError } from "../lib/errors.js";


export const createCondition = async (req: Request, res: Response) => {
    try {
        const condition = await conditionServices.createCondition(req.body);
        res.status(201).json(condition);
    } catch (error) {
        res.status(500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};

export const getConditions = async (req: Request, res: Response) => {
    try {
        const conditions = await conditionServices.getConditions();
        res.json(conditions);
    } catch (error) {
        res.status(500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};

export const deleteCondition = async (req: Request, res: Response) => {
    try {
        const condition = await conditionServices.deleteCondition(Number(req.params.id));
        res.json(condition);
    } catch (error) {
        res.status(500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};

export const updateCondition = async (req: Request, res: Response) => {
    try {
        const condition = await conditionServices.updateCondition(Number(req.params.id), req.body);
        res.json(condition);
    } catch (error) {
        res.status(500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};

