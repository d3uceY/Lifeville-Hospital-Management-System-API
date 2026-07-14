import type { Request, Response } from "express";
import * as conditionServices from "../services/conditionServices.js";


export const createCondition = async (req: Request, res: Response) => {
    try {
        const condition = await conditionServices.createCondition(req.body);
        res.status(201).json(condition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getConditions = async (req: Request, res: Response) => {
    try {
        const conditions = await conditionServices.getConditions();
        res.json(conditions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCondition = async (req: Request, res: Response) => {
    try {
        const condition = await conditionServices.deleteCondition(req.params.id);
        res.json(condition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCondition = async (req: Request, res: Response) => {
    try {
        const condition = await conditionServices.updateCondtion(req.params.id, req.body);
        res.json(condition);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

