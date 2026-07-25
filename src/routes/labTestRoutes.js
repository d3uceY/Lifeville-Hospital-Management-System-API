import express from "express";
import * as labTestControllers from "../controllers/labTestControllers.js";
import { uploadOptionalMultiple } from "../middleware/upload.js";
import { authenticate } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { ROLES } from "../constants/domain.js";

const LAB_EDIT = [ROLES.SUPERADMIN, ROLES.LAB, ROLES.DOCTOR];

const router = express.Router();

//Lab Test Types
router.get("/lab-tests/lab-test-types/", authenticate, labTestControllers.getLabTestTypes);
router.post("/lab-tests/lab-test-type", authenticate, authorize(LAB_EDIT), labTestControllers.createLabTestType);
router.put("/lab-tests/lab-test-type/:id", authenticate, authorize(LAB_EDIT), labTestControllers.updateLabTestType);
router.delete("/lab-tests/lab-test-type/:id", authenticate, authorize(LAB_EDIT), labTestControllers.deleteLabTestType);

//Lab Tests
router.get("/lab-tests", authenticate, labTestControllers.getLabTests);
router.post("/lab-tests", authenticate, authorize(LAB_EDIT), labTestControllers.createLabTest);
router.get("/lab-tests/:id", authenticate, labTestControllers.getLabTestById);
router.get("/lab-tests/patient/:patientId", authenticate, labTestControllers.getLabTestsByPatientId);
router.get("/lab-tests/laboratory/paginated", authenticate, labTestControllers.getPaginatedLabTests);
router.put("/lab-tests/:id", authenticate, authorize(LAB_EDIT), uploadOptionalMultiple('images', 5), labTestControllers.updateLabTest);
router.delete("/lab-tests/:id/delete", authenticate, authorize(LAB_EDIT), labTestControllers.deleteLabTest);
router.delete("/lab-tests/:labTestId/files/:mediaContentId", authenticate, authorize(LAB_EDIT), labTestControllers.deleteLabTestFile);

export default router;