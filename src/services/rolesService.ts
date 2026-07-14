import { query } from "../../drizzle-db.js";

let rolesCache: { id: number; name: string; label: string }[] | null = null;

/** Clears the in-memory roles cache, forcing the next call to `listRoles` to re-query the database. */
export function invalidateRolesCache() {
    rolesCache = null;
}

/**
 * Returns all roles ordered by ID, using an in-memory cache to avoid repeat queries.
 * @returns {Promise<Array<{ id: number, name: string, label: string }>>}
 */
export async function listRoles() {
    if (rolesCache) return rolesCache;
    const { rows } = await query(
        `SELECT id, name, label FROM roles ORDER BY id ASC`
    );
    rolesCache = rows;
    return rows;
}
