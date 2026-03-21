import { query } from "../../drizzle-db.js";

let rolesCache = null;

export function invalidateRolesCache() {
    rolesCache = null;
}

export async function listRoles() {
    if (rolesCache) return rolesCache;
    const { rows } = await query(
        `SELECT id, name, label FROM roles ORDER BY id ASC`
    );
    rolesCache = rows;
    return rows;
}
