import type { Request, Response } from "express";
import * as insurancePlanServices from "../services/insurancePlanServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

/** GET /insurance-providers/:providerId/plans */
export const getPlansByProviderId = async (req: Request, res: Response) => {
    try {
        const plans = await insurancePlanServices.getPlansByProviderId(req.params.providerId);
        res.json(plans);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createInsurancePlan = async (req: Request, res: Response) => {
    try {
        const plan = await insurancePlanServices.createInsurancePlan(req.body);
        res.status(201).json(plan);
        req.activityLogger(ACTIVITY_TYPES.INSURANCE_PLAN_CREATED, { planId: plan.id, providerId: plan.provider_id });
    } catch (error) {
        const statusCode = error.code === "23505" ? 409 : (error.status || 500);
        res.status(statusCode).json({ error: error.code === "23505" ? "This provider already has a plan with that name" : error.message });
    }
};

export const updateInsurancePlan = async (req: Request, res: Response) => {
    try {
        const plan = await insurancePlanServices.updateInsurancePlan(req.params.id, req.body);
        res.json(plan);
        req.activityLogger(ACTIVITY_TYPES.INSURANCE_PLAN_UPDATED, { planId: Number(req.params.id) });
    } catch (error) {
        const statusCode = error.code === "23505" ? 409 : (error.status || 500);
        res.status(statusCode).json({ error: error.code === "23505" ? "This provider already has a plan with that name" : error.message });
    }
};

export const deleteInsurancePlan = async (req: Request, res: Response) => {
    try {
        const plan = await insurancePlanServices.deleteInsurancePlan(req.params.id);
        res.json(plan);
        req.activityLogger(ACTIVITY_TYPES.INSURANCE_PLAN_DELETED, { planId: Number(req.params.id) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
