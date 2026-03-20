import { db } from "../../drizzle-db.js";
import { conditions } from "../../drizzle/migrations/schema.js";
import { eq } from "drizzle-orm";

// ─── In-memory cache ────────────────────────────────────────────────────────
let conditionsCache = null;
export const invalidateConditionsCache = () => { conditionsCache = null; };
// ────────────────────────────────────────────────────────────────────────────

// Create condition
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
export async function getConditions() {
  if (conditionsCache) return conditionsCache;
  const result = await db.select().from(conditions);
  conditionsCache = result;
  return result;
}

// Delete condition
export async function deleteCondition(conditionId) {
  const [deleted] = await db
    .delete(conditions)
    .where(eq(conditions.conditionId, conditionId))
    .returning();

  invalidateConditionsCache();
  return deleted;
}

// Update condition
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
