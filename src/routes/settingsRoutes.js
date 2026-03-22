import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import {
  getCurrenciesController,
  getAllSettingsController,
  updateAllSettingsController,
} from "../controllers/settingsController.js";
import { ROLES } from "../constants/domain.js";

const router = express.Router();

// Currencies — no auth needed (static data)
router.get("/settings/currencies", getCurrenciesController);

// All settings: single GET + single PUT
router.get("/settings", authenticate, getAllSettingsController);
router.put("/settings", authenticate, authorize([ROLES.SUPERADMIN]), updateAllSettingsController);

export default router;
