import express from "express";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import {
  getCurrenciesController,
  getAllSettingsController,
  updateAllSettingsController,
  getEmailController,
  upsertEmailController,
  getStorageController,
  upsertStorageController,
} from "../controllers/settingsController.js";
import { ROLES } from "../constants/domain.js";


const router = express.Router();

// Currencies — no auth needed (static data)
router.get("/settings/currencies", getCurrenciesController);

// All settings: single GET + single PUT
router.get("/settings", authenticate, getAllSettingsController);
router.put("/settings", authenticate, authorize([ROLES.SUPERADMIN]), updateAllSettingsController);

// Email (SMTP) — superadmin only
router.get("/settings/email", authenticate, authorize([ROLES.SUPERADMIN]), getEmailController);
router.put("/settings/email", authenticate, authorize([ROLES.SUPERADMIN]), upsertEmailController);

// Storage (Cloudinary) — superadmin only
router.get("/settings/storage", authenticate, authorize([ROLES.SUPERADMIN]), getStorageController);
router.put("/settings/storage", authenticate, authorize([ROLES.SUPERADMIN]), upsertStorageController);

export default router;
