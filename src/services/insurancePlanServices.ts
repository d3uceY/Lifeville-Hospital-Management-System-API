import { db } from "../../drizzle-db.js";
import { insurancePlans } from "../../drizzle/migrations/schema.js";
import { eq } from "drizzle-orm";

/** Explicit snake_case select fields for insurance plan queries */
const PLAN_SELECT = {
  id: insurancePlans.id,
  provider_id: insurancePlans.providerId,
  name: insurancePlans.name,
  description: insurancePlans.description,
  is_active: insurancePlans.isActive,
  created_at: insurancePlans.createdAt,
};

/**
 * Returns all plans belonging to a provider (a provider can offer several).
 * @param {number} providerId
 * @returns {Promise<object[]>}
 */
export async function getPlansByProviderId(providerId: number) {
  return await db
    .select(PLAN_SELECT)
    .from(insurancePlans)
    .where(eq(insurancePlans.providerId, providerId))
    .orderBy(insurancePlans.name);
}

/**
 * Creates a new plan under a provider.
 * @param {{ provider_id: number, name: string, description?: string, is_active?: boolean }} data
 * @returns {Promise<object>}
 */
export async function createInsurancePlan(data: { provider_id: number; name: string; description?: string; is_active?: boolean }) {
  const [created] = await db
    .insert(insurancePlans)
    .values({
      providerId: data.provider_id,
      name: data.name,
      description: data.description,
      isActive: data.is_active ?? true,
    })
    .returning();

  return {
    id: created.id,
    provider_id: created.providerId,
    name: created.name,
    description: created.description,
    is_active: created.isActive,
    created_at: created.createdAt,
  };
}

/**
 * Updates an existing plan.
 * @param {number} id
 * @param {{ name?: string, description?: string, is_active?: boolean }} data
 * @returns {Promise<object>}
 */
export async function updateInsurancePlan(id: number, data: { name?: string; description?: string; is_active?: boolean }) {
  const [updated] = await db
    .update(insurancePlans)
    .set({
      name: data.name,
      description: data.description,
      isActive: data.is_active,
    })
    .where(eq(insurancePlans.id, id))
    .returning();

  return {
    id: updated.id,
    provider_id: updated.providerId,
    name: updated.name,
    description: updated.description,
    is_active: updated.isActive,
    created_at: updated.createdAt,
  };
}

/**
 * Deletes a plan.
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function deleteInsurancePlan(id: number) {
  const [deleted] = await db
    .delete(insurancePlans)
    .where(eq(insurancePlans.id, id))
    .returning();

  return { id: deleted.id, provider_id: deleted.providerId, name: deleted.name };
}
