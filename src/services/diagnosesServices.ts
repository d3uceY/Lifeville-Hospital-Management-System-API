import { db } from "../../drizzle-db.js";
import { diagnoses, patients } from "../../drizzle/migrations/schema.js";
import { eq, desc } from "drizzle-orm";
import { getOrCreateVisit } from "../utils/visitGuard.js";

/** Shared explicit snake_case select fields for diagnoses queries */
const DIAGNOSES_SELECT = {
  diagnosis_id: diagnoses.diagnosisId,
  patient_id: diagnoses.patientId,
  recorded_by: diagnoses.recordedBy,
  condition: diagnoses.condition,
  notes: diagnoses.notes,
  diagnosis_date: diagnoses.diagnosisDate,
  updated_by: diagnoses.updatedBy,
  updated_at: diagnoses.updatedAt,
  visit_id: diagnoses.visitId,
  first_name: patients.firstName,
  surname: patients.surname,
  hospital_number: patients.hospitalNumber,
};

// CREATE diagnosis
/** Creates a diagnosis record, enforcing that an ongoing visit exists for the patient.
 * Condition must be a jsonb object of { icdCode: description } pairs.
 * @param {object} diagnosisData
 * @returns {Promise<object>}
 */
export async function createDiagnosis(diagnosisData) {
  const { patient_id, recorded_by, condition, notes } = diagnosisData;

  const visit = await getOrCreateVisit(patient_id, diagnosisData.visitInfo ?? null);

  const [newDiagnosis] = await db
    .insert(diagnoses)
    .values({
      patientId: patient_id,
      recordedBy: recorded_by,
      condition,
      notes,
      visitId: visit.id,
    })
    .returning();

  // Get patient details for notification
  const [patient] = await db.select({
    first_name: patients.firstName,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patientId, patient_id));

  return {
    diagnosis_id: newDiagnosis.diagnosisId,
    patient_id: newDiagnosis.patientId,
    recorded_by: newDiagnosis.recordedBy,
    condition: newDiagnosis.condition,
    notes: newDiagnosis.notes,
    diagnosis_date: newDiagnosis.diagnosisDate,
    visit_id: newDiagnosis.visitId,
    first_name: patient.first_name,
    surname: patient.surname,
  };
}

// GET all diagnoses for a patient (joined with patient info)
/** Returns all diagnoses for a patient with patient info, ordered by date descending.
 * @param {number} patientId
 * @returns {Promise<object[]>}
 */
export async function getDiagnosesByPatientId(patientId) {
  return await db
    .select(DIAGNOSES_SELECT)
    .from(diagnoses)
    .innerJoin(patients, eq(diagnoses.patientId, patients.patientId))
    .where(eq(diagnoses.patientId, patientId))
    .orderBy(desc(diagnoses.diagnosisDate));
}

// GET single diagnosis by ID (joined with patient info)
/** Fetches one diagnosis by ID joined with patient info.
 * @param {number} diagnosisId
 * @returns {Promise<object>}
 */
export async function getDiagnosisById(diagnosisId) {
  const [result] = await db
    .select(DIAGNOSES_SELECT)
    .from(diagnoses)
    .innerJoin(patients, eq(diagnoses.patientId, patients.patientId))
    .where(eq(diagnoses.diagnosisId, diagnosisId));

  return result;
}

// UPDATE diagnosis
/** Updates condition (jsonb), notes, and updatedBy/updatedAt on a diagnosis.
 * @param {number} diagnosisId
 * @param {{ condition?: object, notes?: string, updated_by?: string }} updateData
 * @returns {Promise<object>}
 */
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

  return {
    diagnosis_id: updated.diagnosisId,
    patient_id: updated.patientId,
    recorded_by: updated.recordedBy,
    condition: updated.condition,
    notes: updated.notes,
    diagnosis_date: updated.diagnosisDate,
    updated_by: updated.updatedBy,
    updated_at: updated.updatedAt,
    visit_id: updated.visitId,
  };
}

// DELETE diagnosis
/** Deletes a diagnosis by ID and returns the deleted row.
 * @param {number} diagnosisId
 * @returns {Promise<object>}
 */
export async function deleteDiagnosis(diagnosisId) {
  const [deleted] = await db
    .delete(diagnoses)
    .where(eq(diagnoses.diagnosisId, diagnosisId))
    .returning();

  return {
    diagnosis_id: deleted.diagnosisId,
    patient_id: deleted.patientId,
    condition: deleted.condition,
  };
}
