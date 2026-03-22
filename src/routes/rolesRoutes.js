import express from "express";
import { getRolesController } from "../controllers/rolesController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/roles", authenticate, getRolesController);

export default router;
