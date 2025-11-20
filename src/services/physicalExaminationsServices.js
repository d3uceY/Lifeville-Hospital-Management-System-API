import { query } from "../../drizzle-db.js";
import { db } from "../../drizzle-db.js";
import { physicalExaminations, patients, users } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql } from "drizzle-orm";

export const createPhysicalExamination = async (examData) => {
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
            genitourinary
        ) VALUES (
            $1, $2, NOW(), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
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
            genitourinary
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


export const getPhysicalExaminationsByPatientId = async (patientId) => {
    const rows = await db
      .select({
        ...physicalExaminations, // expands into all physical_examinations columns
        first_name: patients.first_name,
        surname: patients.surname,
        hospital_number: patients.hospital_number,
      })
      .from(physicalExaminations)
      .innerJoin(
        patients,
        eq(physicalExaminations.patient_id, patients.patient_id)
      )
      .where(eq(physicalExaminations.patient_id, patientId))
      .orderBy(desc(physicalExaminations.created_at));
  
    return rows;
  };
  