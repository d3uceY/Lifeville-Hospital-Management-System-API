import express from "express";
import * as labTestControllers from "../controllers/labTestControllers.js";
import { uploadOptionalMultiple } from "../middleware/upload.js";
import { authenticate } from "../middleware/auth.js";
const router = express.Router();

//Lab Test Types
router.get("/lab-tests/lab-test-types/", authenticate, labTestControllers.getLabTestTypes);
router.post("/lab-tests/lab-test-type", authenticate, labTestControllers.createLabTestType);
router.put("/lab-tests/lab-test-type/:id", authenticate, labTestControllers.updateLabTestType);
router.delete("/lab-tests/lab-test-type/:id", authenticate, labTestControllers.deleteLabTestType);

//Lab Tests
router.get("/lab-tests", authenticate, labTestControllers.getLabTests);
router.post("/lab-tests", authenticate, labTestControllers.createLabTest);
router.get("/lab-tests/:id", authenticate, labTestControllers.getLabTestById);
router.get("/lab-tests/patient/:patientId", authenticate, labTestControllers.getLabTestsByPatientId);
router.get("/lab-tests/laboratory/paginated", authenticate, labTestControllers.getPaginatedLabTests);
router.put("/lab-tests/:id", authenticate, uploadOptionalMultiple('images', 5), labTestControllers.updateLabTest);
router.delete("/lab-tests/:id/delete", authenticate, labTestControllers.deleteLabTest);

export default router;