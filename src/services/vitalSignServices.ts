import { HttpError } from "../lib/errors.js";
import { query } from "../../drizzle-db.js";
import { db } from "../../drizzle-db.js";
import { getOrCreateVisit } from "../utils/visitGuard.js";

/** Inserts a vital sign record and returns it enriched with patient details.
 * @param {object} vitalSignData
 * @returns {Promise<object>}
 */
export const createVitalSign = async (vitalSignData) => {
  const {
    date,
    patientId,
    temperature,
    systolicBloodPressure,
    diastolicBloodPressure,
    weight,
    height,
    heartRate,
    spo2,
    recordedBy,
  } = vitalSignData;

  if (!patientId) {
    const err = new Error("patientId is required to record vital signs.");
    err.status = 400;
    throw err;
  }

  const visit = await getOrCreateVisit(patientId, vitalSignData.visitInfo ?? null);

  const result = await query(
    `INSERT INTO vital_signs (
       patient_id, recorded_at, temperature, 
       blood_pressure_systolic, blood_pressure_diastolic, 
       weight, height, pulse_rate, spo2, recorded_by, created_at, visit_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), $11) 
     RETURNING *;`,
    [
      patientId,
      date,
      temperature,
      systolicBloodPressure,
      diastolicBloodPressure,
      weight,
      height ? Math.round(height * 100) : 0, // this is to prevent the not null constraint error, but ideally we should handle this better
      heartRate,
      spo2,
      recordedBy,
      visit.id,
    ]
  );

  const vitalSign = result.rows[0];

  // Get patient details for notification
  const patientResult = await query(
    `SELECT first_name, surname FROM patients WHERE patient_id = $1;`,
    [patientId]
  );

  return {
    ...vitalSign,
    first_name: patientResult.rows[0].first_name,
    surname: patientResult.rows[0].surname,
  };
};


/** Returns all vital signs for a patient ordered by most recent.
 * @param {number} patientId
 * @returns {Promise<object[]>}
 */
export const getVitalSignsByPatientId = async (patientId) => {
  const result = await query(
    `SELECT * FROM vital_signs WHERE patient_id = $1 ORDER BY created_at DESC;`,
    [patientId]
  );

  return result.rows;
};


/** Updates all fields of a vital sign record by ID.
 * @param {object} vitalSignData
 * @param {number} vitalSignId
 * @returns {Promise<object>}
 */
export const updateVitalSign = async (vitalSignData, vitalSignId) => {
  const {
    date,
    patientId,
    temperature,
    systolicBloodPressure,
    diastolicBloodPressure,
    weight,
    height,
    heartRate,
    spo2,
    recordedBy,
    updatedBy,
  } = vitalSignData;


  const result = await query(
    `UPDATE vital_signs 
     SET patient_id = $1, recorded_at = $2, temperature = $3, 
       blood_pressure_systolic = $4, blood_pressure_diastolic = $5, 
       weight = $6, height = $7, pulse_rate = $8, spo2 = $9, 
       recorded_by = $10, updated_by = $11, updated_at = NOW()
     WHERE id = $12 
     RETURNING *;`,
    [
      patientId, date, temperature, systolicBloodPressure, diastolicBloodPressure,
      weight, height ? Math.round(height * 100) : null, heartRate, spo2, recordedBy, updatedBy, vitalSignId
    ]
  );

  return result.rows[0];
};
