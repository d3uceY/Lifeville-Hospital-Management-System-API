import { query } from "../../drizzle-db.js";
import { db } from "../../drizzle-db.js";
import { physicalExaminations, patients, users } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql } from "drizzle-orm";
import { getOrCreateVisit } from "../utils/visitGuard.js";
import type { VisitInfo } from "../utils/visitGuard.js";

/** Inserts a full physical examination record and returns it enriched with patient details.
 * @param {object} examData
 * @returns {Promise<object>}
 */
export const createPhysicalExamination = async (examData: { patient_id: number; recorded_by: string; general_appearance?: string; heent?: string; cardiovascular?: string; respiration?: string; gastrointestinal?: string; gynecology_obstetrics?: string; musculoskeletal?: string; neurological?: string; skin?: string; findings?: string; genitourinary?: string; visitInfo?: Record<string, unknown> | null }) => {
    const {
        patient_id,
        recorded_by,
        general_appearance,
        heent,
        cardiovascular,
        respiration,
        gastrointestinal,
        gynecology_obstetrics,
        musculoskeletal,
        neurological,
        skin,
        findings,
        genitourinary
    } = examData;

    // Require an ongoing (not yet checked-out) visit
    const visit = await getOrCreateVisit(patient_id, examData.visitInfo as VisitInfo | null ?? null);

    const { rows } = await query(
        `INSERT INTO physical_examinations (
            patient_id,
            recorded_by,
            created_at,
            general_appearance,
            heent,
            cardiovascular,
            respiration,
            gastrointestinal,
            gynecology_obstetrics,
            musculoskeletal,
            neurological,
            skin,
            findings,
            genitourinary,
            visit_id
        ) VALUES (
            $1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING *`,
        [
            patient_id,
            recorded_by,
            general_appearance,
            heent,
            cardiovascular,
            respiration,
            gastrointestinal,
            gynecology_obstetrics,
            musculoskeletal,
            neurological,
            skin,
            findings,
            genitourinary,
            visit.id,
        ]
    );

    const examination = rows[0];

    // Get patient details for notification
    const patientResult = await query(
        `SELECT first_name, surname FROM patients WHERE patient_id = $1;`,
        [patient_id]
    );

    return {
        ...examination,
        first_name: patientResult.rows[0].first_name,
        surname: patientResult.rows[0].surname,
    };
};


/** Returns all physical examinations for a patient joined with patient info.
 * @param {number} patientId
 * @returns {Promise<object[]>}
 */
export const getPhysicalExaminationsByPatientId = async (patientId: number) => {
    const rows = await db
      .select({
        ...(physicalExaminations as unknown as Parameters<typeof db.select>[0]),
        first_name: patients.firstName,
        surname: patients.surname,
        hospitalNumber: patients.hospitalNumber,
      } as Parameters<typeof db.select>[0])
      .from(physicalExaminations)
      .innerJoin(
        patients,
        eq(physicalExaminations.patientId, patients.patientId)
      )
      .where(eq(physicalExaminations.patientId, patientId))
      .orderBy(desc(physicalExaminations.createdAt));
  
    return rows;
  };
  