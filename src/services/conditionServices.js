import { db } from "../../drizzle-db.js";
import { conditions } from "../../drizzle/migrations/schema.js";
import { eq } from "drizzle-orm";

// Create condition
export async function createCondition(conditionData) {
  const [newCondition] = await db
    .insert(conditions)
    .values({
      name: conditionData.name,
    })
    .returning();

  return newCondition;
}

// Get all conditions
export async function getConditions() {
  return await db.select().from(conditions);
}

// Delete condition
export async function deleteCondition(conditionId) {
  const [deleted] = await db
    .delete(conditions)
    .where(eq(conditions.conditionId, conditionId))
    .returning();

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

  return updated;
}
