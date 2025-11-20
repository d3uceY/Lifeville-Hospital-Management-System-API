import { db } from "../../drizzle-db.js";
import { diagnoses, patients } from "../../drizzle/migrations/schema.js";
import { eq, desc } from "drizzle-orm";

// CREATE diagnosis
export async function createDiagnosis(diagnosisData) {
  const { patient_id, recorded_by, condition, notes } = diagnosisData;

  const [newDiagnosis] = await db
    .insert(diagnoses)
    .values({
      patient_id,
      recorded_by,
      condition,
      notes,
    })
    .returning();

  // Get patient details for notification
  const patient = await db.select({
    first_name: patients.first_name,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patient_id, patient_id));

  return {
    ...newDiagnosis,
    first_name: patient[0].first_name,
    surname: patient[0].surname,
  };
}

// GET all diagnoses for a patient (joined with patient info)
export async function getDiagnosesByPatientId(patientId) {
  return await db
    .select({
      diagnosis_id: diagnoses.diagnosis_id,
      patient_id: diagnoses.patient_id,
      recorded_by: diagnoses.recorded_by,
      condition: diagnoses.condition,
      notes: diagnoses.notes,
      diagnosis_date: diagnoses.diagnosis_date,
      updated_by: diagnoses.updated_by,
      updated_at: diagnoses.updated_at,
      first_name: patients.first_name,
      surname: patients.surname,
      hospital_number: patients.hospital_number,
    })
    .from(diagnoses)
    .innerJoin(patients, eq(diagnoses.patient_id, patients.patient_id))
    .where(eq(diagnoses.patient_id, patientId))
    .orderBy(desc(diagnoses.diagnosis_date));
}

// GET single diagnosis by ID (joined with patient info)
export async function getDiagnosisById(diagnosisId) {
  const [result] = await db
    .select({
      diagnosis_id: diagnoses.diagnosis_id,
      patient_id: diagnoses.patient_id,
      recorded_by: diagnoses.recorded_by,
      condition: diagnoses.condition,
      notes: diagnoses.notes,
      diagnosis_date: diagnoses.diagnosis_date,
      updated_by: diagnoses.updated_by,
      updated_at: diagnoses.updated_at,
      first_name: patients.first_name,
      surname: patients.surname,
      hospital_number: patients.hospital_number,
    })
    .from(diagnoses)
    .innerJoin(patients, eq(diagnoses.patient_id, patients.patient_id))
    .where(eq(diagnoses.diagnosis_id, diagnosisId));

  return result;
}

// UPDATE diagnosis
export async function updateDiagnosis(diagnosisId, updateData) {
  const { condition, notes, updated_by } = updateData;

  const [updated] = await db
    .update(diagnoses)
    .set({
      condition,
      notes,
      updated_by,
      updated_at: new Date(),
    })
    .where(eq(diagnoses.diagnosis_id, diagnosisId))
    .returning();

  return updated;
}

// DELETE diagnosis
export async function deleteDiagnosis(diagnosisId) {
  const [deleted] = await db
    .delete(diagnoses)
    .where(eq(diagnoses.diagnosis_id, diagnosisId))
    .returning();

  return deleted;
}
