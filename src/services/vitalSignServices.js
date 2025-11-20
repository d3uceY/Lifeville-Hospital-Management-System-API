import { query } from "../../drizzle-db.js";

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

  const result = await query(
    `INSERT INTO vital_signs (
       patient_id, recorded_at, temperature, 
       blood_pressure_systolic, blood_pressure_diastolic, 
       weight, height, pulse_rate, spo2, recorded_by, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW()) 
     RETURNING *;`,
    [
      patientId,
      date,
      temperature,
      systolicBloodPressure,
      diastolicBloodPressure,
      weight,
      height,
      heartRate,
      spo2,
      recordedBy
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


export const getVitalSignsByPatientId = async (patientId) => {
  const result = await query(
    `SELECT * FROM vital_signs WHERE patient_id = $1 ORDER BY created_at DESC;`,
    [patientId]
  );

  return result.rows;
};


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
      weight, height, heartRate, spo2, recordedBy, updatedBy, vitalSignId
    ]
  );

  return result.rows[0];
};
