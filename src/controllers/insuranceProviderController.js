import * as insuranceProviderServices from "../services/insuranceProviderServices.js";
import { ACTIVITY_TYPES } from "../constants/activityTypes.js";

/** GET /insurance-providers/search?q= — debounced combobox search (500ms client-side) */
export const searchInsuranceProviders = async (req, res) => {
    try {
        const results = await insuranceProviderServices.searchInsuranceProviders(req.query.q);
        res.json({ query: req.query.q ?? "", count: results.length, results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/** GET /insurance-providers — paginated list for the configuration table */
export const getInsuranceProviders = async (req, res) => {
    try {
        const { page = 1, pageSize = 10, search } = req.query;
        const result = await insuranceProviderServices.getPaginatedInsuranceProviders({
            page: Number(page),
            pageSize: Number(pageSize),
            search: search || undefined,
        });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createInsuranceProvider = async (req, res) => {
    try {
        const provider = await insuranceProviderServices.createInsuranceProvider(req.body);
        res.status(201).json(provider);
        req.activityLogger(ACTIVITY_TYPES.INSURANCE_PROVIDER_CREATED, { providerId: provider.id, name: provider.name });
    } catch (error) {
        const statusCode = error.code === "23505" ? 409 : (error.status || 500);
        res.status(statusCode).json({ error: error.code === "23505" ? "A provider with this name already exists" : error.message });
    }
};

export const updateInsuranceProvider = async (req, res) => {
    try {
        const provider = await insuranceProviderServices.updateInsuranceProvider(req.params.id, req.body);
        res.json(provider);
        req.activityLogger(ACTIVITY_TYPES.INSURANCE_PROVIDER_UPDATED, { providerId: Number(req.params.id) });
    } catch (error) {
        const statusCode = error.code === "23505" ? 409 : (error.status || 500);
        res.status(statusCode).json({ error: error.code === "23505" ? "A provider with this name already exists" : error.message });
    }
};

export const deleteInsuranceProvider = async (req, res) => {
    try {
        const provider = await insuranceProviderServices.deleteInsuranceProvider(req.params.id);
        res.json(provider);
        req.activityLogger(ACTIVITY_TYPES.INSURANCE_PROVIDER_DELETED, { providerId: Number(req.params.id) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
