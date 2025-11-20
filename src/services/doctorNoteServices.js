import { query } from "../../drizzle-db.js";


export const getDoctorNotesByPatientId = async (patientId) => {
    const { rows } = await query(
      `SELECT dn.id, dn.note, dn.recorded_by, dn.updated_by, 
              dn.created_at, dn.updated_at,
              p.surname, p.first_name
       FROM doctors_notes dn
       JOIN patients p ON dn.patient_id = p.patient_id
       WHERE dn.patient_id = $1
       ORDER BY dn.created_at DESC`,
      [patientId]
    );
  
    return rows;
  };
  
export const createDoctorNote = async (noteData) => {
    const { patientId, note, recordedBy } = noteData;

    const result = await query(
        `INSERT INTO doctors_notes (patient_id, note, recorded_by, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *;`,
        [patientId, note, recordedBy]
    );

    const doctorNote = result.rows[0];

    // Get patient details for notification
    const patientResult = await query(
        `SELECT first_name, surname FROM patients WHERE patient_id = $1;`,
        [patientId]
    );

    return {
        ...doctorNote,
        first_name: patientResult.rows[0].first_name,
        surname: patientResult.rows[0].surname,
    };
};

export const updateDoctorNote = async (updatedNoteData, noteId) => {
    const {note, updatedBy} = updatedNoteData;
    const result = await query(
        `UPDATE doctors_notes
       SET note = $1,
           updated_by = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *;`,
        [note, updatedBy, noteId]
    );

    return result.rows[0];
};


export const deleteDoctorNote = async (noteId) => {
    const result = await query(
        `DELETE FROM doctors_notes
       WHERE id = $1
       RETURNING *;`,
        [noteId]
    );
    return result.rows[0];
};
