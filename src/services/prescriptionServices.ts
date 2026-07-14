import { query } from "../../drizzle-db.js";
import { eq, desc, and, isNull } from "drizzle-orm";
import { db } from "../../drizzle-db.js";
import { prescriptions } from "../../drizzle/migrations/schema.js";
import * as billingService from "./billingService.js";
import { SERVICE_CATEGORIES } from "../constants/domain.js";
import { getOrCreateVisit } from "../utils/visitGuard.js";

// CREATE prescription
/**
 * Creates a prescription header and its line items, auto-billing each drug to the linked admission
 * or visit invoice using ID-first price lookup.
 * @param {object} prescriptionData
 * @returns {Promise<object>} The created prescription row
 */
export const createPrescription = async (prescriptionData) => {
    const {
        patient_id,
        prescribed_by,
        notes,
        items, // array of { drug_name, dosage, frequency, duration, instructions, unit_price? }
        admission_id,
        visit_id,
        visitInfo,
    } = prescriptionData;

    const visit = await getOrCreateVisit(patient_id, visitInfo ?? null);

    // Insert into prescriptions table
    const { rows } = await query(
        `INSERT INTO prescriptions (
            patient_id,
            prescribed_by,
            notes,
            status,
            visit_id
        ) VALUES ($1, $2, $3, 'Active', $4)
        RETURNING *`,
        [patient_id, prescribed_by, notes, visit.id]
    );

    const prescription = rows[0];

    for (const item of items) {
        await query(
            `INSERT INTO prescription_items (
                prescription_id,
                drug_name,
                dosage,
                frequency,
                duration,
                instructions,
                service_id,
                unit_price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                prescription.prescription_id,
                item.drug_name,
                item.dosage || "",
                item.frequency || "",
                item.duration || "",
                item.instructions || null,
                item.service_id || null,
                item.unit_price != null ? Number(item.unit_price) : null,
            ]
        );

        // ── Auto-billing: one bill item per drug ───────────────────────────
        if (admission_id || visit_id) {
            try {
                // Prefer service table (by ID) → argument unit_price → name lookup → skip
                const itemPrice = item.service_id
                    ? await billingService.getServicePriceById(Number(item.service_id)).catch(() => null)
                    : item.unit_price != null
                        ? Number(item.unit_price)
                        : await billingService.getServicePrice(item.drug_name).catch(() => null);

                if (itemPrice == null) continue; // price unknown — skip billing

                await billingService.addItem({
                    admissionId: admission_id ? Number(admission_id) : null,
                    visitId: visit_id ? Number(visit_id) : null,
                    serviceId: item.service_id ? Number(item.service_id) : null,
                    description: `Drug: ${item.drug_name} (${item.dosage}, ${item.frequency})`,
                    category: SERVICE_CATEGORIES.DRUG,
                    quantity: 1,
                    unitPrice: itemPrice,
                    billingType: "credit",
                    createdBy: prescriptionData.created_by || null,
                });
            } catch (billingErr: unknown) {
                console.error("Billing error (prescription):", (billingErr instanceof Error ? billingErr.message : String(billingErr)));
            }
        }
    }

    return prescription;
};


// GET prescriptions for a patient
/** Returns all prescriptions for a patient with items aggregated as a JSON array.
 * @param {number} patient_id
 * @returns {Promise<object[]>}
 */
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


/** Deletes a prescription and all its line items by ID.
 * @param {number} prescriptionId
 * @returns {Promise<object>}
 */
export const deletePrescription = async (prescriptionId) => {
    const deletedPrescription = db.delete(prescriptions).where(eq(prescriptions.prescriptionId, prescriptionId)).returning();
    return deletedPrescription;
};


/** Updates the status, `updatedBy`, and `updatedAt` of a prescription.
 * @param {number} prescriptionId
 * @param {string} newStatus
 * @param {number} updatedBy - ID of the user making the update
 * @returns {Promise<object>}
 */
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