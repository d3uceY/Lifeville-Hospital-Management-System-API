// services/bedServices.js
import { query } from "../../drizzle-db.js";

// ─── In-memory cache ────────────────────────────────────────────────────────
let bedTypesCache: unknown[] | null = null;
export const invalidateBedTypesCache = () => { bedTypesCache = null; };
let bedGroupsCache: unknown[] | null = null;
export const invalidateBedGroupsCache = () => { bedGroupsCache = null; };
let bedsCache: unknown[] | null = null;
export const invalidateBedsCache = () => { bedsCache = null; };
// ────────────────────────────────────────────────────────────────────────────

//
// BED TYPES
//

/**
 * Fetch all bed types
 */
export const getBedTypes = async () => {
  if (bedTypesCache) return bedTypesCache;
  const { rows } = await query(`
    SELECT id, type_name, created_at, updated_at
    FROM bed_types
    ORDER BY type_name;
  `);
  bedTypesCache = rows;
  return rows;
};

/**
 * Create a new bed type
 */
export const createBedType = async (typeData: { typeName: string }) => {
  const { typeName } = typeData;
  const { rows } = await query(
    `
    INSERT INTO bed_types (type_name)
    VALUES ($1)
    RETURNING id, type_name, created_at, updated_at;
    `,
    [typeName]
  );
  invalidateBedTypesCache();
  return rows[0];
};

/**
 * Update an existing bed type
 */
export const updateBedType = async (typeId: number | string, typeData: { typeName: string }) => {
  const { typeName } = typeData;
  const { rows } = await query(
    `
    UPDATE bed_types
       SET type_name  = $1,
           updated_at = now()
     WHERE id = $2
     RETURNING id, type_name, created_at, updated_at;
    `,
    [typeName, typeId]
  );
  invalidateBedTypesCache();
  invalidateBedsCache();
  return rows[0] || null;
};

/**
 * Delete a bed type
 */
export const deleteBedType = async (typeId: number | string) => {
  const { rows } = await query(
    `
    DELETE FROM bed_types
     WHERE id = $1
     RETURNING id;
    `,
    [typeId]
  );
  invalidateBedTypesCache();
  invalidateBedsCache();
  return rows.length > 0;
};

//
// BED GROUPS
//

/**
 * Fetch all bed groups
 */
export const getBedGroups = async () => {
  if (bedGroupsCache) return bedGroupsCache;
  const { rows } = await query(`
    SELECT id, group_name, created_at, updated_at
    FROM bed_groups
    ORDER BY group_name;
  `);
  bedGroupsCache = rows;
  return rows;
};

/**
 * Create a new bed group
 */
export const createBedGroup = async (groupData: { groupName: string }) => {
  const { groupName } = groupData;
  const { rows } = await query(
    `
    INSERT INTO bed_groups (group_name)
    VALUES ($1)
    RETURNING id, group_name, created_at, updated_at;
    `,
    [groupName]
  );
  invalidateBedGroupsCache();
  return rows[0];
};

/**
 * Update an existing bed group
 */
export const updateBedGroup = async (groupId: number | string, groupData: { groupName: string }) => {
  const { groupName } = groupData;
  const { rows } = await query(
    `
    UPDATE bed_groups
       SET group_name = $1,
           updated_at = now()
     WHERE id = $2
     RETURNING id, group_name, created_at, updated_at;
    `,
    [groupName, groupId]
  );
  invalidateBedGroupsCache();
  invalidateBedsCache();
  return rows[0] || null;
};

/**
 * Delete a bed group
 */
export const deleteBedGroup = async (groupId: number | string) => {
  const { rows } = await query(
    `
    DELETE FROM bed_groups
     WHERE id = $1
     RETURNING id;
    `,
    [groupId]
  );
  return rows.length > 0;
};

//
// BEDS
//

/**
 * Fetch all beds
 */
export const getBeds = async () => {
  if (bedsCache) return bedsCache;
  const { rows } = await query(`
    SELECT
      b.id,
      b.bed_name,
      b.used,
      b.bed_type_id,
      bt.type_name AS bed_type,
      b.bed_group_id,
      bg.group_name AS bed_group,
      b.created_at,
      b.updated_at
    FROM beds b
    JOIN bed_types bt ON b.bed_type_id = bt.id
    JOIN bed_groups bg ON b.bed_group_id = bg.id
    ORDER BY bg.group_name, b.bed_name;
  `);
  bedsCache = rows;
  return rows;
};

/**
 * Fetch one bed by ID
 */
export const viewBed = async (bedId: number | string) => {
  const { rows } = await query(
    `
    SELECT
      b.id,
      b.bed_name,
      b.used,
      b.bed_type_id,
      bt.type_name AS bed_type,
      b.bed_group_id,
      bg.group_name AS bed_group,
      b.created_at,
      b.updated_at
    FROM beds b
    JOIN bed_types bt ON b.bed_type_id = bt.id
    JOIN bed_groups bg ON b.bed_group_id = bg.id
    WHERE b.id = $1
    LIMIT 1;
    `,
    [bedId]
  );
  return rows[0] || null;
};

/**
 * Create a new bed
 */
export const createBed = async (bedData: { bedName: string; used?: boolean; bedTypeId: number; bedGroupId: number }) => {
  const { bedName, used = false, bedTypeId, bedGroupId } = bedData;
  const { rows } = await query(
    `
    INSERT INTO beds (bed_name, used, bed_type_id, bed_group_id)
    VALUES ($1, $2, $3, $4)
    RETURNING id, bed_name, used, bed_type_id, bed_group_id, created_at, updated_at;
    `,
    [bedName, used, bedTypeId, bedGroupId]
  );
  invalidateBedsCache();
  return rows[0];
};

/**
 * Update an existing bed
 */
export const updateBed = async (bedId: number | string, bedData: { bedName: string; inUse: boolean; bedTypeId: number; bedGroupId: number }) => {
  const { bedName, inUse, bedTypeId, bedGroupId } = bedData;
  const { rows } = await query(
    `
    UPDATE beds
       SET bed_name      = $1,
           used          = $2,
           bed_type_id   = $3,
           bed_group_id  = $4,
           updated_at    = now()
     WHERE id = $5
     RETURNING id, bed_name, used, bed_type_id, bed_group_id, created_at, updated_at;
    `,
    [bedName, inUse, bedTypeId, bedGroupId, bedId]
  );
  invalidateBedsCache();
  return rows[0] || null;
};

/**
 * Delete a bed
 */
export const deleteBed = async (bedId: number | string) => {
  const { rows } = await query(
    `
    DELETE FROM beds
     WHERE id = $1
     RETURNING id;
    `,
    [bedId]
  );
  invalidateBedsCache();
  return rows.length > 0;
};
