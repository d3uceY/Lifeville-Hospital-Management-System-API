import { db } from "../../drizzle-db.js";
import { mediaContent } from "../../drizzle/migrations/schema.js";
import { eq } from "drizzle-orm";

/** Inserts a new media_content record and returns it.
 * @param {{ key: string, url: string, contentType: string, metadata?: object }} params
 * @returns {Promise<object>}
 */
export const insertMediaContent = async ({ key, url, contentType, metadata = null }) => {
  const [record] = await db
    .insert(mediaContent)
    .values({ key, url, contentType, metadata, type: "cloud" })
    .returning();

  return record;
};

/** Fetches a single media_content record by ID.
 * @param {number} id
 * @returns {Promise<object|undefined>}
 */
export const getMediaContentById = async (id) => {
  const [record] = await db
    .select()
    .from(mediaContent)
    .where(eq(mediaContent.id, id));

  return record;
};

/** Updates the key, url, and contentType of an existing media_content record.
 * @param {number} id
 * @param {{ key: string, url: string, contentType: string }} params
 * @returns {Promise<object>}
 */
export const updateMediaContent = async (id, { key, url, contentType }) => {
  const [record] = await db
    .update(mediaContent)
    .set({ key, url, contentType })
    .where(eq(mediaContent.id, id))
    .returning();

  return record;
};

/** Deletes a media_content record by ID (FK ON DELETE SET NULL handles any referencing rows).
 * @param {number} id
 * @returns {Promise<object>} The deleted record
 */
export const deleteMediaContentById = async (id) => {
  const [record] = await db
    .delete(mediaContent)
    .where(eq(mediaContent.id, id))
    .returning();

  return record;
};
