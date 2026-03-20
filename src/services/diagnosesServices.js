import { db } from "../../drizzle-db.js";
import { diagnoses, patients } from "../../drizzle/migrations/schema.js";
import { eq, desc } from "drizzle-orm";

// CREATE diagnosis
export async function createDiagnosis(diagnosisData) {
  const { patient_id, recorded_by, condition, notes } = diagnosisData;

  const [newDiagnosis] = await db
    .insert(diagnoses)
    .values({
      patientId: patient_id,
      recordedBy: recorded_by,
      condition,
      notes,
    })
    .returning();

  // Get patient details for notification
  const patient = await db.select({
    first_name: patients.firstName,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patientId, patient_id));

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
      diagnosisId: diagnoses.diagnosisId,
      patientId: diagnoses.patientId,
      recordedBy: diagnoses.recordedBy,
      condition: diagnoses.condition,
      notes: diagnoses.notes,
      diagnosisDate: diagnoses.diagnosisDate,
      updatedBy: diagnoses.updatedBy,
      updatedAt: diagnoses.updatedAt,
      first_name: patients.firstName,
      surname: patients.surname,
      hospitalNumber: patients.hospitalNumber,
    })
    .from(diagnoses)
    .innerJoin(patients, eq(diagnoses.patientId, patients.patientId))
    .where(eq(diagnoses.patientId, patientId))
    .orderBy(desc(diagnoses.diagnosisDate));
}

// GET single diagnosis by ID (joined with patient info)
export async function getDiagnosisById(diagnosisId) {
  const [result] = await db
    .select({
      diagnosisId: diagnoses.diagnosisId,
      patientId: diagnoses.patientId,
      recordedBy: diagnoses.recordedBy,
      condition: diagnoses.condition,
      notes: diagnoses.notes,
      diagnosisDate: diagnoses.diagnosisDate,
      updatedBy: diagnoses.updatedBy,
      updatedAt: diagnoses.updatedAt,
      first_name: patients.firstName,
      surname: patients.surname,
      hospitalNumber: patients.hospitalNumber,
    })
    .from(diagnoses)
    .innerJoin(patients, eq(diagnoses.patientId, patients.patientId))
    .where(eq(diagnoses.diagnosisId, diagnosisId));

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
      updatedBy: updated_by,
      updatedAt: new Date(),
    })
    .where(eq(diagnoses.diagnosisId, diagnosisId))
    .returning();

  return updated;
}

// DELETE diagnosis
export async function deleteDiagnosis(diagnosisId) {
  const [deleted] = await db
    .delete(diagnoses)
    .where(eq(diagnoses.diagnosisId, diagnosisId))
    .returning();

  return deleted;
}
