import { query } from "../../drizzle-db.js";

export async function addProcedure({ patient_id, recorded_by, procedure_name, comments, performed_at, service_id = null, unit_price = null }) {
    const { rows } = await query(
        `INSERT INTO procedures (patient_id, recorded_by, procedure_name, comments, performed_at, service_id, unit_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [patient_id, recorded_by, procedure_name, comments, performed_at, service_id, unit_price]
    );
    return rows[0];
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