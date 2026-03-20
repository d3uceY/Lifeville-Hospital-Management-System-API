import { query } from "../../drizzle-db.js";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../../drizzle-db.js";
import { prescriptionItems, prescriptions } from "../../drizzle/migrations/schema.js";

// CREATE prescription
export const createPrescription = async (prescriptionData) => {
    const {
        patient_id,
        prescribed_by,
        notes,
        items // array of { drug_name, dosage, frequency, duration, instructions }
    } = prescriptionData;

    // Insert into prescriptions table
    const { rows } = await query(
        `INSERT INTO prescriptions (
            patient_id,
            prescribed_by,
            notes,
            status
        ) VALUES ($1, $2, $3, 'Active')
        RETURNING *`,
        [patient_id, prescribed_by, notes]
    );

    const prescription = rows[0];

    // Insert prescription items
    for (const item of items) {
        await query(
            `INSERT INTO prescription_items (
                prescription_id,
                drug_name,
                dosage,
                frequency,
                duration,
                instructions
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                prescription.prescription_id,
                item.drug_name,
                item.dosage,
                item.frequency,
                item.duration,
                item.instructions
            ]
        );
    }

    return prescription;
};


// GET prescriptions for a patient
export const getPrescriptions = async (patient_id) => {
    const { rows } = await query(
      `SELECT 
          p.prescription_id,
          p.patient_id,
          p.prescribed_by,
          p.notes,
          p.status,
          p.updated_by,
          pa.hospital_number,
          p.updated_at,
          p.prescription_date,
          json_agg(
              json_build_object(
                  'drug_name', pi.drug_name,
                  'dosage', pi.dosage,
                  'frequency', pi.frequency,
                  'duration', pi.duration,
                  'instructions', pi.instructions
              )
          ) AS items
      FROM prescriptions p
      LEFT JOIN prescription_items pi 
          ON p.prescription_id = pi.prescription_id
      LEFT JOIN patients pa
          ON p.patient_id = pa.patient_id
      WHERE p.patient_id = $1
      GROUP BY 
          p.prescription_id,
          p.patient_id,
          p.prescribed_by,
          p.notes,
          p.status,
          p.updated_by,
          pa.hospital_number,
          p.updated_at,
          p.prescription_date
      ORDER BY p.prescription_date DESC`,
      [patient_id]
    );
  
    return rows;
  };
  
  
export const deletePrescription = async (prescriptionId) => {
    const deletedPrescription = db.delete(prescriptions).where(eq(prescriptions.prescriptionId, prescriptionId)).returning();
    return deletedPrescription;
};


export const updatePrescriptionStatus = async (prescriptionId, newStatus, updatedBy) => {
    const result = await query(
        `UPDATE prescriptions
         SET status = $1,
             updated_by = $2,
             updated_at = NOW()
         WHERE prescription_id = $3
         RETURNING *;`,
        [newStatus, updatedBy, prescriptionId]
    );

    return result.rows[0];
};