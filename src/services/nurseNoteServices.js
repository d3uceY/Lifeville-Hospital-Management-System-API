import { db } from "../../drizzle-db.js";
import { nursesNotes, patients } from "../../drizzle/migrations/schema.js";
import { eq, desc } from "drizzle-orm";

// Get all nurse's notes for a patient
export const getNurseNotesByPatientId = async (patientId) => {
  return db
    .select({
      id: nursesNotes.id,
      note: nursesNotes.note,
      recordedBy: nursesNotes.recordedBy,
      updatedBy: nursesNotes.updatedBy,
      createdAt: nursesNotes.createdAt,
      updatedAt: nursesNotes.updatedAt,
      surname: patients.surname,
      first_name: patients.firstName,
    })
    .from(nursesNotes)
    .innerJoin(patients, eq(nursesNotes.patientId, patients.patientId))
    .where(eq(nursesNotes.patientId, patientId))
    .orderBy(desc(nursesNotes.createdAt));
};

// Create nurse note
export const createNurseNote = async (noteData) => {
  const { patientId, note, recordedBy } = noteData;

  const [newNote] = await db
    .insert(nursesNotes)
    .values({
      patientId: patientId,
      note,
      recordedBy: recordedBy,
      createdAt: new Date(),
    })
    .returning();

  // Get patient details for notification
  const patient = await db.select({
    first_name: patients.firstName,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patientId, patientId));

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
      updatedBy: updatedBy,
      updatedAt: new Date(),
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
