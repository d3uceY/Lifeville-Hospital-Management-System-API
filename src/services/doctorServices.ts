// import query connection
import { query } from "../../drizzle-db.js";

// ─── In-memory cache ────────────────────────────────────────────────────────
let doctorsCache: unknown[] | null = null;
export const invalidateDoctorsCache = () => { doctorsCache = null; };
// ────────────────────────────────────────────────────────────────────────────

export const getDoctors = async () => {
  if (doctorsCache) return doctorsCache;
  const { rows } = await query("SELECT id, role, name, email FROM users where role = 'doctor'");
  doctorsCache = rows;
  return rows;
};

export const viewDoctor = async (doctorId: number | string) => {
  const { rows } = await query(`SELECT id, role, name, email FROM users WHERE id = $1`, [
    doctorId,
  ]);
  return rows[0];
};

export const deleteDoctor = async (doctorId: number | string) => {
  const { rowCount } = await query("DELETE FROM doctors WHERE doctor_id = $1", [
    doctorId,
  ]);
  invalidateDoctorsCache();
  return (rowCount ?? 0) > 0;
};

export const createDoctor = async (doctorData: { firstName: string; lastName: string; specialty: string }) => {
  const { firstName, lastName, specialty } = doctorData;

  const { rows } = await query(
    `INSERT INTO doctors (
       first_name, last_name, specialty
     ) VALUES ($1, $2, $3)
     RETURNING *;`,
    [firstName, lastName, specialty]
  );

  invalidateDoctorsCache();
  return rows[0];
};

export const updateDoctor = async (doctorData: { firstName: string; lastName: string; specialty: string; doctorId: number }) => {
  const { firstName, lastName, specialty, doctorId } = doctorData;

  const { rows } = await query(
    `UPDATE doctors 
       SET first_name = $1, last_name = $2, specialty = $3
       WHERE doctor_id = $4
       RETURNING *;`,
    [firstName, lastName, specialty, doctorId]
  );

  invalidateDoctorsCache();
  return rows[0];
};
