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
import diagnosesRoutes from './diagnosesRoutes.js'
import prescriptionRoutes from './prescriptionRoutes.js'
import procedureRoutes from './procedureRoutes.js'
import doctorNoteRoutes from './doctorNoteRoutes.js'
import nurseNoteRoutes from './nurseNoteRoutes.js'
import summaryRoutes from './summaryRoutes.js'
import statsRoutes from './statsRoutes.js'
import patientVisitsRoutes from './patientVisitsRoutes.js'
import notificationRoutes from './notificationRoutes.js';
import billingRoutes from './billingRoutes.js';
import rolesRoutes from './rolesRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import aiRoutes from './aiRoutes.js';
import icdRoutes from './icdRoutes.js';
import activityLogRoutes from './activityLogRoutes.js';
import insuranceRoutes from './insuranceRoutes.js';
import patientInsuranceRoutes from './patientInsuranceRoutes.js';
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
router.use("/api", diagnosesRoutes);
router.use("/api", prescriptionRoutes);
router.use("/api", procedureRoutes);
router.use("/api", doctorNoteRoutes);
router.use("/api", nurseNoteRoutes);
router.use("/api", summaryRoutes);
router.use("/api", statsRoutes);
router.use("/api", patientVisitsRoutes);
router.use("/api", notificationRoutes);
router.use("/api", billingRoutes);
router.use("/api", rolesRoutes);
router.use("/api", settingsRoutes);
router.use("/api", aiRoutes);
router.use("/api", icdRoutes);
router.use("/api", activityLogRoutes);
router.use("/api", insuranceRoutes);
router.use("/api", patientInsuranceRoutes);

export default router;