import { db } from "../../drizzle-db.js";
import { conditions } from "../../drizzle/migrations/schema.js";
import { eq } from "drizzle-orm";

// ─── In-memory cache ────────────────────────────────────────────────────────
let conditionsCache = null;
/** Clears the in-memory conditions cache, forcing the next call to `getConditions` to re-query the database. */
export const invalidateConditionsCache = () => { conditionsCache = null; };
// ────────────────────────────────────────────────────────────────────────────

// Create condition
/** Inserts a new condition by name, invalidates the conditions cache, and returns the new row.
 * @param {{ name: string }} conditionData
 * @returns {Promise<object>}
 */
export async function createCondition(conditionData) {
  const [newCondition] = await db
    .insert(conditions)
    .values({
      name: conditionData.name,
    })
    .returning();

  invalidateConditionsCache();
  return newCondition;
}

// Get all conditions
/** Returns all conditions ordered by name (in-memory cached).
 * @returns {Promise<object[]>}
 */
export async function getConditions() {
  if (conditionsCache) return conditionsCache;
  const result = await db.select().from(conditions);
  conditionsCache = result;
  return result;
}

// Delete condition
/** Deletes a condition by ID, invalidates the cache, and returns the deleted row.
 * @param {number} conditionId
 * @returns {Promise<object>}
 */
export async function deleteCondition(conditionId) {
  const [deleted] = await db
    .delete(conditions)
    .where(eq(conditions.conditionId, conditionId))
    .returning();

  invalidateConditionsCache();
  return deleted;
}

// Update condition
/** Updates a condition's name, invalidates the cache, and returns the updated row.
 * @param {number} conditionId
 * @param {{ name: string }} conditionData
 * @returns {Promise<object>}
 */
export async function updateCondition(conditionId, conditionData) {
  const [updated] = await db
    .update(conditions)
    .set({
      name: conditionData.name,
    })
    .where(eq(conditions.conditionId, conditionId))
    .returning();

  invalidateConditionsCache();
  return updated;
}
