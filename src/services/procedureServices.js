import { query } from "../../drizzle-db.js";
import { db } from "../../drizzle-db.js";
import { patientVisits } from "../../drizzle/migrations/schema.js";
import { eq, desc, isNull, and } from "drizzle-orm";
import * as billingService from "./billingService.js";
import { SERVICE_CATEGORIES } from "../constants/domain.js";

export async function addProcedure({ patient_id, recorded_by, procedure_name, comments, performed_at, service_id = null, admission_id = null, visit_id = null }) {
    // Require an ongoing (not yet checked-out) visit
    const [ongoingVisit] = await db
        .select({ id: patientVisits.id })
        .from(patientVisits)
        .where(
            and(
                eq(patientVisits.patientId, patient_id),
                isNull(patientVisits.checkOutTime)
            )
        )
        .orderBy(desc(patientVisits.checkInTime))
        .limit(1);

    if (!ongoingVisit) {
        const err = new Error("No ongoing visit found for this patient. Please check in the patient before recording a procedure.");
        err.status = 400;
        throw err;
    }

    let unit_price = null;
    if (service_id) {
        try {
            unit_price = await billingService.getServicePriceById(Number(service_id));
        } catch (err) {
            console.error("Failed to fetch service price:", err.message);
        }
    }

    const { rows } = await query(
        `INSERT INTO procedures (patient_id, recorded_by, procedure_name, comments, performed_at, service_id, unit_price, visit_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [patient_id, recorded_by, procedure_name, comments, performed_at, service_id, unit_price, ongoingVisit.id]
    );
    const procedure = rows[0];

    // Auto-billing: link to active admission or visit if provided
    if ((admission_id || visit_id) && unit_price) {
        try {
            await billingService.addItem({
                admissionId: admission_id ? Number(admission_id) : null,
                visitId: visit_id ? Number(visit_id) : null,
                serviceId: service_id ? Number(service_id) : null,
                description: `Procedure: ${procedure_name}`,
                category: SERVICE_CATEGORIES.SERVICE,
                quantity: 1,
                unitPrice: Number(unit_price),
                billingType: "credit",
            });
        } catch (billingErr) {
            console.error("Billing error (procedure):", billingErr.message);
        }
    }

    return procedure;
}

export async function getProceduresByPatientId(patient_id) {
    const { rows } = await query(
        `SELECT pr.*, p.surname, p.first_name FROM procedures pr
         INNER JOIN patients p ON pr.patient_id = p.patient_id
         WHERE pr.patient_id = $1
         ORDER BY pr.created_at DESC`,
        [patient_id]
    );
    return rows;
}