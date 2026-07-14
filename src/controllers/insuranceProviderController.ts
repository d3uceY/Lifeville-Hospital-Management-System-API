import type { Request, Response } from "express";
import * as insuranceProviderServices from "../services/insuranceProviderServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";
import { isHttpError } from "../lib/errors.js";

/** GET /insurance-providers/search?q= — debounced combobox search (500ms client-side) */
export const searchInsuranceProviders = async (req: Request, res: Response) => {
    try {
        const results = await insuranceProviderServices.searchInsuranceProviders(String(req.query.q ?? ""));
        res.json({ query: req.query.q ?? "", count: results.length, results });
    } catch (error) {
        res.status(500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};

/** GET /insurance-providers — paginated list for the configuration table */
export const getInsuranceProviders = async (req: Request, res: Response) => {
    try {
        const { page = 1, pageSize = 10, search } = req.query;
        const result = await insuranceProviderServices.getPaginatedInsuranceProviders({
            page: Number(page),
            pageSize: Number(pageSize),
            search: search ? String(search) : undefined,
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};

export const createInsuranceProvider = async (req: Request, res: Response) => {
    try {
        const provider = await insuranceProviderServices.createInsuranceProvider(req.body);
        res.status(201).json(provider);
        req.activityLogger(ACTIVITY_TYPES.INSURANCE_PROVIDER_CREATED, { providerId: provider.id, name: provider.name });
    } catch (error) {
        const statusCode = isHttpError(error) && (error as { code?: string }).code === "23505" ? 409 : (isHttpError(error) ? error.status : 500);
        const msg = isHttpError(error) && (error as { code?: string }).code === "23505" ? "A provider with this name already exists" : (isHttpError(error) ? error.message : "Server error");
        res.status(statusCode).json({ error: msg });
    }
};

export const updateInsuranceProvider = async (req: Request, res: Response) => {
    try {
        const provider = await insuranceProviderServices.updateInsuranceProvider(Number(req.params.id), req.body);
        res.json(provider);
        req.activityLogger(ACTIVITY_TYPES.INSURANCE_PROVIDER_UPDATED, { providerId: Number(req.params.id) });
    } catch (error) {
        const statusCode = isHttpError(error) && (error as { code?: string }).code === "23505" ? 409 : (isHttpError(error) ? error.status : 500);
        const msg = isHttpError(error) && (error as { code?: string }).code === "23505" ? "A provider with this name already exists" : (isHttpError(error) ? error.message : "Server error");
        res.status(statusCode).json({ error: msg });
    }
};

export const deleteInsuranceProvider = async (req: Request, res: Response) => {
    try {
        const provider = await insuranceProviderServices.deleteInsuranceProvider(Number(req.params.id));
        res.json(provider);
        req.activityLogger(ACTIVITY_TYPES.INSURANCE_PROVIDER_DELETED, { providerId: Number(req.params.id) });
    } catch (error) {
        res.status(500).json({ error: isHttpError(error) ? error.message : "Server error" });
    }
};
