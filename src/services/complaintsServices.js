import { db } from "../../drizzle-db.js";
import { patients, complaints, patientVisits } from "../../drizzle/migrations/schema.js";
import { eq, desc, isNull, and } from "drizzle-orm";

// Get all complaints
/** Returns all complaints from the database.
 * @returns {Promise<object[]>}
 */
export const getComplaints = async () => {
    return await db.select().from(complaints);
};

// Get complaints for a specific patient, joined with patient info
/** Returns all complaints for a patient joined with patient name.
 * @param {number} patientId
 * @returns {Promise<object[]>}
 */
export const getComplaintsByPatientId = async (patientId) => {
    return await db
        .select({
            ...complaints,
            first_name: patients.firstName,
            surname: patients.surname,
        })
        .from(complaints)
        .innerJoin(patients, eq(complaints.patientId, patients.patientId))
        .where(eq(complaints.patientId, patientId))
        .orderBy(desc(complaints.createdAt));
};

// Create new complaint
/** Inserts a new complaint and returns it enriched with patient name details.
 * @param {object} complaint
 * @returns {Promise<object>}
 */
export const createComplaint = async (complaint) => {
    // Require an ongoing (not yet checked-out) visit
    const [ongoingVisit] = await db
        .select({ id: patientVisits.id })
        .from(patientVisits)
        .where(
            and(
                eq(patientVisits.patientId, complaint.patientId),
                isNull(patientVisits.checkOutTime)
            )
        )
        .orderBy(desc(patientVisits.checkInTime))
        .limit(1);

    if (!ongoingVisit) {
        const err = new Error("No ongoing visit found for this patient. Please check in the patient before recording a complaint.");
        err.status = 400;
        throw err;
    }

    const [newComplaint] = await db
        .insert(complaints)
        .values({
            patientId: complaint.patientId,
            complaint: complaint.complaint,
            recordedBy: complaint.recordedBy,
            createdAt: new Date(),
            visitId: ongoingVisit.id,
        })
        .returning();

    // Get patient details for notification
    const patient = await db.select({
        first_name: patients.firstName,
        surname: patients.surname,
    }).from(patients).where(eq(patients.patientId, complaint.patientId));

    return {
        ...newComplaint,
        first_name: patient[0].first_name,
        surname: patient[0].surname,
    };
};
