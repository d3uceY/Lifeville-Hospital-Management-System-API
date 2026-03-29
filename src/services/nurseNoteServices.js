import { db } from "../../drizzle-db.js";
import { nursesNotes, patients, patientVisits } from "../../drizzle/migrations/schema.js";
import { eq, desc, isNull, and } from "drizzle-orm";

// Get all nurse's notes for a patient
/** Returns all nurse notes for a patient joined with patient name.
 * @param {number} patientId
 * @returns {Promise<object[]>}
 */
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
/** Inserts a nurse note and returns it enriched with patient details.
 * @param {object} noteData
 * @returns {Promise<object>}
 */
export const createNurseNote = async (noteData) => {
  const { patientId, note, recordedBy } = noteData;

  // Require an ongoing (not yet checked-out) visit
  const [ongoingVisit] = await db
    .select({ id: patientVisits.id })
    .from(patientVisits)
    .where(
      and(
        eq(patientVisits.patientId, patientId),
        isNull(patientVisits.checkOutTime)
      )
    )
    .orderBy(desc(patientVisits.checkInTime))
    .limit(1);

  if (!ongoingVisit) {
    const err = new Error("No ongoing visit found for this patient. Please check in the patient before adding a nurse note.");
    err.status = 400;
    throw err;
  }

  const [newNote] = await db
    .insert(nursesNotes)
    .values({
      patientId: patientId,
      note,
      recordedBy: recordedBy,
      createdAt: new Date(),
      visitId: ongoingVisit.id,
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
/** Updates the note text, `updatedBy`, and `updatedAt` for a nurse note.
 * @param {number} noteId
 * @param {number} updatedBy - ID of the user making the update
 * @param {string} newNote - New note content
 * @returns {Promise<object>}
 */
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
/** Deletes a nurse note by ID and returns the deleted row.
 * @param {number} noteId
 * @returns {Promise<object>}
 */
export const deleteNurseNote = async (noteId) => {
  const [deleted] = await db
    .delete(nursesNotes)
    .where(eq(nursesNotes.id, noteId))
    .returning();

  return deleted; // will return deleted row if schema allows
};
