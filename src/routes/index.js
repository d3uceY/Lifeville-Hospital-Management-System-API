import express from "express";

//ROUTES
import patientRoutes from "./patientRoutes.js";
import vitalSignsRoutes from "./vitalSignsRoutes.js";
import doctorRoutes from "./doctorRoutes.js";
import appointmentRoutes from "./appointmentRoutes.js";
import deathRoutes from "./deathRoutes.js";
import birthRoutes from "./birthRoutes.js"
import symptomsRoutes from "./symptomsRoutes.js";
import inpatientAdmissionsRoutes from "./inpatientAdmissionsRoutes.js";
import bedRoutes from "./bedRoutes.js";
import userRoutes from './userRoutes.js'
import billRoutes from './billRoutes.js'
import labTestRoutes from './labTestRoutes.js'
import complaintsRoutes from './complaintsRouter.js'
import physicalExaminationsRoutes from './physicalExaminationsRoutes.js'
import conditionRoutes from './conditionRoutes.js'
import diagnosesRoutes from './diagnosesRoutes.js'
import prescriptionRoutes from './prescriptionRoutes.js'
import procedureRoutes from './procedureRoutes.js'
import doctorNoteRoutes from './doctorNoteRoutes.js'
import nurseNoteRoutes from './nurseNoteRoutes.js'
import summaryRoutes from './summaryRoutes.js'
import statsRoutes from './statsRoutes.js'
import patientVisitsRoutes from './patientVisitsRoutes.js'
import notificationRoutes from './notificationRoutes.js'

const router = express.Router();

router.use("/api", patientRoutes);
router.use("/api", vitalSignsRoutes);
router.use("/api", doctorRoutes);
router.use("/api", appointmentRoutes);
router.use("/api", deathRoutes);
router.use("/api", birthRoutes);
router.use("/api", symptomsRoutes);
router.use("/api", inpatientAdmissionsRoutes);
router.use("/api", bedRoutes);
router.use("/api", userRoutes);
router.use("/api", billRoutes);
router.use("/api", labTestRoutes);
router.use("/api", complaintsRoutes);
router.use("/api", physicalExaminationsRoutes);
router.use("/api", conditionRoutes);
router.use("/api", diagnosesRoutes);
router.use("/api", prescriptionRoutes);
router.use("/api", procedureRoutes);
router.use("/api", doctorNoteRoutes);
router.use("/api", nurseNoteRoutes);
router.use("/api", summaryRoutes);
router.use("/api", statsRoutes);
router.use("/api", patientVisitsRoutes);
router.use("/api", notificationRoutes);

export default router;