import express from "express";
import * as labTestControllers from "../controllers/labTestControllers.js";
import { uploadNone } from "../middleware/upload.js";

const router = express.Router();

//Lab Test Types
router.get("/lab-tests/lab-test-types/", labTestControllers.getLabTestTypes);
router.post("/lab-tests/lab-test-type", labTestControllers.createLabTestType);
router.put("/lab-tests/lab-test-type/:id", labTestControllers.updateLabTestType);
router.delete("/lab-tests/lab-test-type/:id", labTestControllers.deleteLabTestType);

//Lab Tests
router.get("/lab-tests", labTestControllers.getLabTests);
router.post("/lab-tests", labTestControllers.createLabTest);
router.get("/lab-tests/:id", labTestControllers.getLabTestById);
router.get("/lab-tests/patient/:patientId", labTestControllers.getLabTestsByPatientId);
router.get("/lab-tests/laboratory/paginated", labTestControllers.getPaginatedLabTests);
router.put("/lab-tests/:id", uploadNone, labTestControllers.updateLabTest);
router.delete("/lab-tests/:id/delete", labTestControllers.deleteLabTest);


export default router;