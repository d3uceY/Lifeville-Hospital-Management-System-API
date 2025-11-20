import { db } from "../../drizzle-db.js";
import { nursesNotes, patients } from "../../drizzle/migrations/schema.js";
import { eq, desc } from "drizzle-orm";

// Get all nurse's notes for a patient
export const getNurseNotesByPatientId = async (patientId) => {
  return db
    .select({
      id: nursesNotes.id,
      note: nursesNotes.note,
      recorded_by: nursesNotes.recorded_by,
      updated_by: nursesNotes.updated_by,
      created_at: nursesNotes.created_at,
      updated_at: nursesNotes.updated_at,
      surname: patients.surname,
      first_name: patients.first_name,
    })
    .from(nursesNotes)
    .innerJoin(patients, eq(nursesNotes.patient_id, patients.patient_id))
    .where(eq(nursesNotes.patient_id, patientId))
    .orderBy(desc(nursesNotes.created_at));
};

// Create nurse note
export const createNurseNote = async (noteData) => {
  const { patientId, note, recordedBy } = noteData;

  const [newNote] = await db
    .insert(nursesNotes)
    .values({
      patient_id: patientId,
      note,
      recorded_by: recordedBy,
      created_at: new Date(), // if your schema uses default now(), you can omit
    })
    .returning();

  // Get patient details for notification
  const patient = await db.select({
    first_name: patients.first_name,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patient_id, patientId));

  return {
    ...newNote,
    first_name: patient[0].first_name,
    surname: patient[0].surname,
  };
};

// Update nurse note
export const updateNurseNote = async (noteId, updatedBy, newNote) => {
  const [updated] = await db
    .update(nursesNotes)
    .set({
      note: newNote,
      updated_by: updatedBy,
      updated_at: new Date(),
    })
    .where(eq(nursesNotes.id, noteId))
    .returning();

  return updated;
};

// Delete nurse note
export const deleteNurseNote = async (noteId) => {
  const [deleted] = await db
    .delete(nursesNotes)
    .where(eq(nursesNotes.id, noteId))
    .returning();

  return deleted; // will return deleted row if schema allows
};
