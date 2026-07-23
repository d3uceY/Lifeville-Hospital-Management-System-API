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
export async function getPatientInsuranceByPatientId(patientId: number) {
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
export async function createPatientInsurance(data: { patient_id: number; provider_id: number; plan_id?: number; member_number: string; policy_number?: string; is_primary?: boolean; status?: string; start_date?: string; end_date?: string }) {
  // Enforce single primary: unset all other primary records for this patient
  if (data.is_primary !== false) {
    await db
      .update(patientInsurance)
      .set({ isPrimary: false })
      .where(eq(patientInsurance.patientId, data.patient_id));
  }

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
export async function getPatientInsuranceById(id: number) {
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
export async function updatePatientInsurance(id: number, data: { provider_id?: number; plan_id?: number; member_number?: string; policy_number?: string; is_primary?: boolean; status?: string; start_date?: string; end_date?: string }) {
  // Enforce single primary: if setting this record as primary, unset all others for the same patient
  if (data.is_primary) {
    const [existing] = await db
      .select({ patientId: patientInsurance.patientId })
      .from(patientInsurance)
      .where(eq(patientInsurance.id, id))
      .limit(1);
    if (existing?.patientId) {
      await db
        .update(patientInsurance)
        .set({ isPrimary: false })
        .where(eq(patientInsurance.patientId, existing.patientId));
    }
  }

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
      updatedAt: new Date() as unknown as string,
    })
    .where(eq(patientInsurance.id, id));

  return await getPatientInsuranceById(id);
}

/**
 * Deletes a patient's insurance record.
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function deletePatientInsurance(id: number) {
  const [deleted] = await db
    .delete(patientInsurance)
    .where(eq(patientInsurance.id, id))
    .returning();

  return { id: deleted.id, patient_id: deleted.patientId };
}
