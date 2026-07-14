import { db } from "../../drizzle-db.js";
import { insuranceProviders } from "../../drizzle/migrations/schema.js";
import { eq, desc, ilike, and, sql } from "drizzle-orm";

/** Explicit snake_case select fields for insurance provider queries */
const PROVIDER_SELECT = {
  id: insuranceProviders.id,
  name: insuranceProviders.name,
  phone: insuranceProviders.phone,
  email: insuranceProviders.email,
  address: insuranceProviders.address,
  website: insuranceProviders.website,
  is_active: insuranceProviders.isActive,
  created_at: insuranceProviders.createdAt,
  updated_at: insuranceProviders.updatedAt,
};

/**
 * Quick name-based lookup used by the debounced search combobox (e.g. patient
 * registration form). Only returns active providers, capped at 20 results.
 *
 * @param {string} q
 * @returns {Promise<object[]>}
 */
export async function searchInsuranceProviders(q) {
  const term = (q ?? "").trim();
  if (!term) return [];

  return await db
    .select(PROVIDER_SELECT)
    .from(insuranceProviders)
    .where(and(ilike(insuranceProviders.name, `%${term}%`), eq(insuranceProviders.isActive, true)))
    .orderBy(insuranceProviders.name)
    .limit(20);
}

/**
 * Retrieves a paginated list of insurance providers for the configuration table.
 *
 * @param {{ page?: number, pageSize?: number, search?: string }} options
 */
export async function getPaginatedInsuranceProviders({ page = 1, pageSize = 10, search } = {}) {
  const offset = (page - 1) * pageSize;
  const where = search?.trim() ? ilike(insuranceProviders.name, `%${search.trim()}%`) : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select(PROVIDER_SELECT)
      .from(insuranceProviders)
      .where(where)
      .orderBy(desc(insuranceProviders.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: sql`cast(count(*) as int)` })
      .from(insuranceProviders)
      .where(where),
  ]);

  const total = Number(countRows[0]?.value ?? 0);

  return {
    data: rows,
    totalItems: total,
    totalPages: Math.ceil(total / pageSize),
    page,
    pageSize,
  };
}

/**
 * Creates a new insurance provider.
 * @param {{ name: string, phone?: string, email?: string, address?: string, website?: string, is_active?: boolean }} data
 * @returns {Promise<object>}
 */
export async function createInsuranceProvider(data) {
  const [created] = await db
    .insert(insuranceProviders)
    .values({
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      website: data.website,
      isActive: data.is_active ?? true,
    })
    .returning();

  return {
    id: created.id,
    name: created.name,
    phone: created.phone,
    email: created.email,
    address: created.address,
    website: created.website,
    is_active: created.isActive,
    created_at: created.createdAt,
    updated_at: created.updatedAt,
  };
}

/**
 * Updates an existing insurance provider.
 * @param {number} id
 * @param {{ name?: string, phone?: string, email?: string, address?: string, website?: string, is_active?: boolean }} data
 * @returns {Promise<object>}
 */
export async function updateInsuranceProvider(id, data) {
  const [updated] = await db
    .update(insuranceProviders)
    .set({
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      website: data.website,
      isActive: data.is_active,
      updatedAt: new Date(),
    })
    .where(eq(insuranceProviders.id, id))
    .returning();

  return {
    id: updated.id,
    name: updated.name,
    phone: updated.phone,
    email: updated.email,
    address: updated.address,
    website: updated.website,
    is_active: updated.isActive,
    created_at: updated.createdAt,
    updated_at: updated.updatedAt,
  };
}

/**
 * Deletes an insurance provider (cascades to its plans).
 * @param {number} id
 * @returns {Promise<object>}
 */
export async function deleteInsuranceProvider(id) {
  const [deleted] = await db
    .delete(insuranceProviders)
    .where(eq(insuranceProviders.id, id))
    .returning();

  return { id: deleted.id, name: deleted.name };
}
