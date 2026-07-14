import express from "express";
import * as insuranceProviderController from "../controllers/insuranceProviderController.js";
import * as insurancePlanController from "../controllers/insurancePlanController.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const router = express.Router();

// Roles allowed to manage (create/update/delete) insurance configuration
const MANAGE_ROLES = [ROLES.SUPERADMIN, ROLES.RECEPTIONIST, ROLES.ACCOUNTANT];

// ── Insurance Providers ────────────────────────────────────────────────────────
router.get("/insurance-providers/search", authenticate, insuranceProviderController.searchInsuranceProviders);
router.get("/insurance-providers", authenticate, insuranceProviderController.getInsuranceProviders);
router.post("/insurance-providers", authenticate, authorize(MANAGE_ROLES), insuranceProviderController.createInsuranceProvider);
router.put("/insurance-providers/:id", authenticate, authorize(MANAGE_ROLES), insuranceProviderController.updateInsuranceProvider);
router.delete("/insurance-providers/:id", authenticate, authorize([ROLES.SUPERADMIN]), insuranceProviderController.deleteInsuranceProvider);

// ── Insurance Plans (nested under a provider) ─────────────────────────────────
router.get("/insurance-providers/:providerId/plans", authenticate, insurancePlanController.getPlansByProviderId);
router.post("/insurance-plans", authenticate, authorize(MANAGE_ROLES), insurancePlanController.createInsurancePlan);
router.put("/insurance-plans/:id", authenticate, authorize(MANAGE_ROLES), insurancePlanController.updateInsurancePlan);
router.delete("/insurance-plans/:id", authenticate, authorize([ROLES.SUPERADMIN]), insurancePlanController.deleteInsurancePlan);

export default router;
