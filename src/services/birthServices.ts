// import query connection
import { query } from "../../drizzle-db.js";

export const getBirthRecords = async ({ page = 1, pageSize = 10, search = "", gender = "" }: { page?: number; pageSize?: number; search?: string; gender?: string } = {}) => {
  const offset = (page - 1) * pageSize;
  const filterParams = [];
  const conditions = [];
  let paramIndex = 1;

  if (search) {
    filterParams.push(`%${search}%`);
    conditions.push(
      `(child_name ILIKE $${paramIndex} OR mother_name ILIKE $${paramIndex} OR father_name ILIKE $${paramIndex})`
    );
    paramIndex++;
  }

  if (gender) {
    filterParams.push(gender);
    conditions.push(`gender = $${paramIndex}`);
    paramIndex++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const dataParams = [...filterParams, pageSize, offset];

  const [{ rows }, { rows: countRows }] = await Promise.all([
    query(
      `SELECT * FROM birth_records ${where} ORDER BY birth_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      dataParams
    ),
    query(`SELECT COUNT(*) FROM birth_records ${where}`, filterParams),
  ]);

  return {
    data: rows,
    totalItems: Number(countRows[0].count),
    totalPages: Math.ceil(Number(countRows[0].count) / pageSize),
    page: Number(page),
    pageSize: Number(pageSize),
  };
};

export const updateBirthRecord = async (birthId: number | string, birthData: { childName: string; gender: string; birthDate: string; motherName: string; fatherName?: string; weight?: string; phoneNumber?: string; address?: string; report?: string }) => {
  const {
    childName,
    gender,
    birthDate,
    motherName,
    fatherName,
    weight,
    phoneNumber,
    address,
    report,
  } = birthData;

  const { rows } = await query(
    `UPDATE birth_records
       SET
         child_name   = $1,
         gender       = $2,
         birth_date   = $3,
         mother_name  = $4,
         father_name  = $5,
         weight       = $6,
         phone_number = $7,
         address      = $8,
         report       = $9,
         updated_at   = now()
       WHERE birth_id = $10
       RETURNING *;`,
    [
      childName,
      gender,
      birthDate,
      motherName,
      fatherName,
      weight,
      phoneNumber,
      address,
      report,
      birthId,
    ]
  );

  return rows[0];
};

export const createBirthRecord = async (birthData: { childName: string; gender: string; birthDate: string; motherName: string; fatherName?: string; weight?: string; phoneNumber?: string; address?: string; report?: string }) => {
  const {
    childName,
    gender,
    birthDate,
    motherName,
    fatherName,
    weight,
    phoneNumber,
    address,
    report,
  } = birthData;

  const { rows } = await query(
    `INSERT INTO birth_records (
          child_name,
          gender,
          birth_date,
          mother_name,
          father_name,
          weight,
          phone_number,
          address,
          report
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *;`,
    [
      childName,
      gender,
      birthDate,
      motherName,
      fatherName,
      weight,
      phoneNumber,
      address,
      report,
    ]
  );

  return rows[0];
};

export const deleteBirthRecord = async (birthId: number | string) => {
  const { rows } = await query(
    `DELETE FROM birth_records
       WHERE birth_id = $1
       RETURNING *;`,
    [birthId]
  );

  return rows.length > 0;
};
