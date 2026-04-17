

import { priorityLevels, NOTIFICATION_TYPES } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import * as inpatientServices from "../services/inpatientAdmissionsServices.js";
import { addNotification } from "../services/notificationServices.js";

/**
 * GET /inpatients
 * Fetch all inpatient admission records (joined with patient data)
 */
export const getInpatientAdmissions = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = "", sex = "" } = req.query;
    const admissions = await inpatientServices.getInpatientAdmissions({
      page: Number(page),
      pageSize: Number(pageSize),
      search,
      sex,
    });
    res.status(200).json(admissions);
  } catch (err) {
    console.error("error fetching inpatient admissions:", err);
    res.status(500).json({ message: "internal server error" });
  }
};

/**
 * GET /inpatients/:patientId
 * Fetch all inpatient admission records (joined with patient data)
 */
export const getInpatientAdmissionsByPatientId = async (req, res) => {
  try {
    const patientId = req.params.patientId;
    const admissions = await inpatientServices.getInpatientAdmissionsByPatientId(patientId);
    res.status(200).json(admissions);
  } catch (err) {
    console.error("error fetching inpatient admissions:", err);
    res.status(500).json({ message: `Internal Server Error: ${err}` });
  }
};

/**
 * POST /inpatients
 * Create a new inpatient admission
 */
export const createInpatientAdmission = async (req, res) => {
  try {
    const admissionData = req.body;
    const newAdmission = await inpatientServices.createInpatientAdmission(admissionData);
    if (!newAdmission) {
      return res.status(400).json({ message: "Failed to create inpatient admission" });
    }

    // notification to superadmin, doctor and receptionist
    try {

      // Jsonb data
      const data = {
        first_name: newAdmission.firstName,
        surname: newAdmission.surname,
        patient_id: newAdmission.patientId,
        priority: priorityLevels.normal,
      }
      await addNotification({
        recipientRoles: NOTIFICATION_ROLES.ADMISSION,
        type: NOTIFICATION_TYPES.INPATIENT,
        title: "Patient Admitted",
        message: `Patient ${newAdmission.firstName} ${newAdmission.surname} has been admitted`,
        data,
      });

    } catch (error) {
      console.error(error);
    }

    const io = req.app.get("socketio");
    io.emit("notification", {
      recipientRoles: NOTIFICATION_ROLES.ADMISSION,
      message: `Patient Admitted by ${newAdmission.doctorName}`,
      description: `Patient: ${newAdmission.firstName} ${newAdmission.surname}`
    });

    res.status(200).json({ newAdmission, message: "Admission created successfully" });
  } catch (err) {
    console.error("error creating inpatient admission:", err);
    res.status(500).json({ message: `${err}` });
  }
};

/**
 * GET /inpatients/:id
 * View a single inpatient admission record
 */
export const viewInpatientAdmission = async (req, res) => {
  try {
    const admissionId = req.params.id;
    const admission = await inpatientServices.viewInpatientAdmission(admissionId);
    if (!admission) {
      return res.status(404).json({ message: "Admission not found" });
    }
    res.status(200).json(admission);
  } catch (err) {
    console.error("error fetching inpatient admission:", err);
    res.status(500).json({ message: "internal server error" });
  }
};

/**
 * PUT /inpatients/:id
 * Update an existing inpatient admission
 */
export const updateInpatientAdmission = async (req, res) => {
  try {
    const admissionId = req.params.id;
    const admissionData = req.body;
    const updatedAdmission = await inpatientServices.updateInpatientAdmission(admissionId, admissionData);
    if (!updatedAdmission) {
      return res.status(404).json({ message: "Admission not found" });
    }
    res.status(200).json({ updatedAdmission, message: "Admission updated successfully" });
  } catch (err) {
    console.error("error updating inpatient admission:", err);
    res.status(500).json({ message: "internal server error" });
  }
};

/**
 * DELETE /inpatients/:id
 * Delete an inpatient admission
 */
export const deleteInpatientAdmission = async (req, res) => {
  try {
    const admissionId = req.params.id;
    const deleted = await inpatientServices.deleteInpatientAdmission(admissionId);
    if (!deleted) {
      return res.status(404).json({ message: "Admission not found or already deleted" });
    }
    res.status(200).json({ deleted, message: "Admission deleted successfully" });
  } catch (err) {
    console.error("error deleting inpatient admission:", err);
    res.status(500).json({ message: "internal server error" });
  }
};



/**
 * POST /inpatients/
 * Discharge an inpatient admission
 */
export const dischargeInpatientAdmission = async (req, res) => {
  try {
    const dischargeData = req.body;
    const discharged = await inpatientServices.dischargeInpatientAdmission(dischargeData);

    if (!discharged) {
      return res.status(404).json({ message: "Admission not found or already discharged" });
    }

    // notification
    try {

      // Jsonb data
      const data = {
        first_name: discharged.firstName,
        surname: discharged.surname,
        patient_id: discharged.patientId,
        priority: priorityLevels.normal,
      }
      await addNotification({
        recipientRoles: NOTIFICATION_ROLES.ALL_STAFF,
        type: NOTIFICATION_TYPES.INPATIENT_DISCHARGED,
        title: "Patient Discharged",
        message: `Patient ${discharged.firstName} ${discharged.surname} has been discharged`,
        data,
      });

    } catch (error) {
      console.error(error);
    }

    const io = req.app.get("socketio");
    io.emit("notification", {
      recipientRoles: NOTIFICATION_ROLES.ALL_STAFF,
      message: `Patient Discharged by ${dischargeData.recorded_by}`,
      description: `Patient: ${discharged.firstName} ${discharged.surname}`
    });

    res.status(200).json({ discharged, message: "Admission discharged successfully" });
  } catch (err) {
    console.error("error discharging inpatient admission:", err);
    res.status(500).json({ message: `${err}` });
  }
};

export const getDischargeSummaryByAdmissionId = async (req, res) => {
  try {
    const admissionId = req.params.id;
    const dischargeSummary = await inpatientServices.getDischargeSummaryByAdmissionId(admissionId);
    if (!dischargeSummary) {
      return res.status(404).json({ message: "Discharge summary not found" });
    }
    res.status(200).json(dischargeSummary);
  } catch (err) {
    console.error("error fetching discharge summary:", err);
    res.status(500).json({ message: "internal server error" });
  }
};

/**
 * GET /inpatients/:id/latest-diagnosis
 * Fetches the latest diagnosis condition for the visit linked to an admission.
 */
export const getLatestDiagnosisForAdmission = async (req, res) => {
  try {
    const admissionId = Number(req.params.id);
    const result = await inpatientServices.getLatestDiagnosisForAdmission(admissionId);
    res.status(200).json(result);
  } catch (err) {
    console.error("error fetching latest diagnosis for admission:", err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Internal server error" });
  }
};