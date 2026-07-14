// import query connection
import { query } from "../../drizzle-db.js";

// ─── In-memory cache ────────────────────────────────────────────────────────
let symptomTypesCache: unknown[] | null = null;
export const invalidateSymptomTypesCache = () => { symptomTypesCache = null; };
let symptomHeadsCache: unknown[] | null = null;
export const invalidateSymptomHeadsCache = () => { symptomHeadsCache = null; };
// ────────────────────────────────────────────────────────────────────────────

export const getSymptomTypes = async () => {
  if (symptomTypesCache) return symptomTypesCache;
  const { rows } = await query(`SELECT * FROM symptom_types`);
  symptomTypesCache = rows;
  return rows;
};

export const createSymptomType = async (symptomTypeData: { symptomText: string }) => {
  const { symptomText } = symptomTypeData;

  const { rows } = await query(
    `INSERT INTO symptom_types (symptom_text) VALUES ($1) RETURNING *`,
    [symptomText]
  );
  invalidateSymptomTypesCache();
  return rows[0];
};

export const deleteSymptomType = async (symptomTypeId: number | string) => {
  const { rows } = await query(
    `DELETE FROM symptom_types WHERE symptom_type_id = $1 RETURNING *`,
    [symptomTypeId]
  );
  invalidateSymptomTypesCache();
  return rows.length > 0;
};

export const updateSymptomType = async (symptomTypeId: number | string, symptomTypeData: { symptomText: string }) => {
  const { symptomText } = symptomTypeData;

  const { rows } = await query(
    `UPDATE symptom_types 
        SET symptom_text = $1
        WHERE symptom_type_id = $2
        RETURNING *`,
    [symptomText, symptomTypeId]
  );
  invalidateSymptomTypesCache();
  return rows[0];
};

export const getSymptomHeads = async () => {
  if (symptomHeadsCache) return symptomHeadsCache;
  const { rows } = await query(`
    SELECT 
     sh.*, 
     symptom_types.symptom_text as symptom_type,
     symptom_types.symptom_type_id
     FROM symptom_heads sh
     JOIN symptom_types ON sh.symptom_type_id = symptom_types.symptom_type_id;
    `);
  symptomHeadsCache = rows;
  return rows;
}; 

export const createSymptomHead = async (symptomHeadData: { symptomHeadText: string; symptomTypeId: number; symptomDescription?: string }) => {
  const { symptomHeadText, symptomTypeId, symptomDescription } =
    symptomHeadData;

  const { rows } = await query(
    `INSERT INTO symptom_heads (symptom_head, symptom_type_id, symptom_description)
       VALUES ($1, $2, $3)
       RETURNING *`,
    [symptomHeadText, symptomTypeId, symptomDescription]
  );

  invalidateSymptomHeadsCache();
  return rows[0];
};

export const deleteSymptomHead = async (symptomHeadId: number | string) => {
  const { rows } = await query(
    `DELETE FROM symptom_heads WHERE symptom_head_id = $1 RETURNING *`,
    [symptomHeadId]
  );
  invalidateSymptomHeadsCache();
  return rows.length > 0;
};

export const updateSymptomHead = async (symptomHeadId: number | string, symptomHeadData: { symptomHeadText: string; symptomTypeId: number; symptomDescription?: string }) => {
  const { symptomHeadText, symptomTypeId, symptomDescription } =
    symptomHeadData;

  const { rows } = await query(
    `UPDATE symptom_heads 
        SET symptom_head = $1, symptom_type_id = $2, symptom_description = $3
        WHERE symptom_head_id = $4
        RETURNING *`,
    [symptomHeadText, symptomTypeId, symptomDescription, symptomHeadId]
  );
  invalidateSymptomHeadsCache();
  return rows[0];
};
