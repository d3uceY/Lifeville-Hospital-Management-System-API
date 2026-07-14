import { db } from "../../drizzle-db.js";
import { patientInsurance, insuranceProviders, insurancePlans } from "../../drizzle/migrations/schema.js";
import { eq, desc } from "drizzle-orm";

/** Explicit snake_case select fields for patient insurance queries, joined with provider/plan names */
const PATIENT_INSURANCE_SELECT = {
  id: patientInsurance.id,
  patient_id: patientInsurance.patientId,
  provider_id: patientInsurance.providerId,
  plan_id: patientInsurance.planId,
  member_number: patientInsurance.memberNumber,
  policy_number: patientInsurance.policyNumber,
  is_primary: patientInsurance.isPrimary,
  status: patientInsurance.status,
  start_date: patientInsurance.startDate,
  end_date: patientInsurance.endDate,
  created_at: patientInsurance.createdAt,
  updated_at: patientInsurance.updatedAt,
  provider_name: insuranceProviders.name,
  plan_name: insurancePlans.name,
};

/**
 * Returns all insurance records linked to a patient (primary, secondary, historical…),
 * joined with the provider and plan names for display.
 * @param {number} patientId
 * @returns {Promise<object[]>}
 */
export async function getPatientInsuranceByPatientId(patientId) {
  return await db
    .select(PATIENT_INSURANCE_SELECT)
    .from(patientInsurance)
    .innerJoin(insuranceProviders, eq(patientInsurance.providerId, insuranceProviders.id))
    .leftJoin(insurancePlans, eq(patientInsurance.planId, insurancePlans.id))
    .where(eq(patientInsurance.patientId, patientId))
    .orderBy(desc(patientInsurance.isPrimary), desc(patientInsurance.createdAt));
}

/**
 * Links a patient to an insurance provider/plan.
 * @param {{ patient_id: number, provider_id: number, plan_id?: number, member_number: string,
 *   policy_number?: string, is_primary?: boolean, status?: string, start_date?: string, end_date?: string }} data
 * @returns {Promise<object>}
 */
export async function createPatientInsurance(data) {
  const [created] = await db
    .insert(patientInsurance)
    .values({
      patientId: data.patient_id,
      providerId: data.provider_id,
      planId: data.plan_id ?? null,
      memberNumber: data.member_number,
      policyNumber: data.policy_number,
      isPrimary: data.is_primary ?? true,
      status: data.status ?? "Active",
      startDate: data.start_date || null,
      endDate: data.end_date || null,
    })
    .returning();

  return await getPatientInsuranceById(created.id);
}

/**
 * Fetches a single patient_insurance record by id, joined with provider/plan names.
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function getPatientInsuranceById(id) {
  const [result] = await db
    .select(PATIENT_INSURANCE_SELECT)
    .from(patientInsurance)
    .innerJoin(insuranceProviders, eq(patientInsurance.providerId, insuranceProviders.id))
    .leftJoin(insurancePlans, eq(patientInsurance.planId, insurancePlans.id))
    .where(eq(patientInsurance.id, id));

  return result;
}

/**
 * Updates a patient's insurance record (e.g. status, member/policy numbers, plan).
 * @param {number} id
 * @param {object} data
 * @returns {Promise<object>}
 */
export async function updatePatientInsurance(id, data) {
  await db
    .update(patientInsurance)
    .set({
      providerId: data.provider_id,
      planId: data.plan_id ?? null,
      memberNumber: data.member_number,
      policyNumber: data.policy_number,
      isPrimary: data.is_primary,
      status: data.status,
      startDate: data.start_date || null,
      endDate: data.end_date || null,
      updatedAt: new Date(),
    })
    .where(eq(patientInsurance.id, id));

  return await getPatientInsuranceById(id);
}

/**
 * Deletes a patient's insurance record.
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function deletePatientInsurance(id) {
  const [deleted] = await db
    .delete(patientInsurance)
    .where(eq(patientInsurance.id, id))
    .returning();

  return { id: deleted.id, patient_id: deleted.patientId };
}
