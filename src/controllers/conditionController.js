import * as conditionServices from "../services/conditionServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";


export const createCondition = async (req, res) => {
    try {
        const condition = await conditionServices.createCondition(req.body);
        res.status(201).json(condition);
        req.activityLogger(ACTIVITY_TYPES.CONDITION_CREATED, { conditionId: condition.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getConditions = async (req, res) => {
    try {
        const conditions = await conditionServices.getConditions();
        res.json(conditions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCondition = async (req, res) => {
    try {
        const condition = await conditionServices.deleteCondition(req.params.id);
        res.json(condition);
        req.activityLogger(ACTIVITY_TYPES.CONDITION_DELETED, { conditionId: Number(req.params.id) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCondition = async (req, res) => {
    try {
        const condition = await conditionServices.updateCondtion(req.params.id, req.body);
        res.json(condition);
        req.activityLogger(ACTIVITY_TYPES.CONDITION_UPDATED, { conditionId: Number(req.params.id) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

