import { db } from "../../drizzle-db.js";
import { deathRecords, patients } from "../../drizzle/migrations/schema.js";
import { eq, desc, and, ilike, or, sql, count } from "drizzle-orm";

const DEATH_SELECT_FIELDS = {
  id: deathRecords.id,
  patientId: deathRecords.patientId,
  deathDate: deathRecords.deathDate,
  guardian: deathRecords.guardian,
  report: deathRecords.report,
  patientFirstName: patients.firstName,
  patientSurname: patients.surname,
  hospitalNumber: patients.hospitalNumber,
  nextOfKin: patients.nextOfKin,
  relationship: patients.relationship,
  sex: patients.sex,
};

// Get paginated death records with patient info
export async function getDeathRecords({ page = 1, pageSize = 10, search = "", sex = "" } = {}) {
  const offset = (page - 1) * pageSize;
  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(patients.firstName, `%${search}%`),
        ilike(patients.surname, `%${search}%`),
        ilike(sql`CAST(${patients.hospitalNumber} AS TEXT)`, `%${search}%`)
      )
    );
  }
  if (sex) conditions.push(eq(patients.sex, sex));

  const where = conditions.length ? and(...conditions) : undefined;

  const [data, countResult] = await Promise.all([
    db
      .select(DEATH_SELECT_FIELDS)
      .from(deathRecords)
      .innerJoin(patients, eq(deathRecords.patientId, patients.patientId))
      .where(where)
      .orderBy(desc(deathRecords.deathDate))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(deathRecords)
      .innerJoin(patients, eq(deathRecords.patientId, patients.patientId))
      .where(where),
  ]);

  const totalItems = Number(countResult[0].count);
  return {
    data,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
    page: Number(page),
    pageSize: Number(pageSize),
  };
}

// Create a new death record
export async function createDeathRecord(deathData) {
  const { patientId, deathDate, guardian, report } = deathData;

  // Check for existing record
  const existing = await db
    .select()
    .from(deathRecords)
    .where(eq(deathRecords.patientId, patientId));

  if (existing.length > 0) {
    const err = new Error("This death record already exists");
    err.code = "DUPLICATE_DEATH_RECORD";
    throw err;
  }

  const [newRecord] = await db
    .insert(deathRecords)
    .values({
      patientId: patientId,
      deathDate: deathDate,
      guardian,
      report,
    })
    .returning();

  return newRecord;
}

// Delete a death record
export async function deleteDeathRecord(id) {
  const [deleted] = await db
    .delete(deathRecords)
    .where(eq(deathRecords.id, id))
    .returning();

  return deleted;
}

// Update a death record
export async function updateDeathRecord(id, deathData) {
  const { patientId, deathDate, guardian, report } = deathData;

  const [updated] = await db
    .update(deathRecords)
    .set({
      patientId: patientId,
      deathDate: deathDate,
      guardian,
      report,
    })
    .where(eq(deathRecords.id, id))
    .returning();

  return updated;
}
