import { db } from "../../drizzle-db.js";
import { patients, complaints } from "../../drizzle/migrations/schema.js";
import { eq, desc } from "drizzle-orm";
import { getOrCreateVisit } from "../utils/visitGuard.js";
import type { VisitInfo } from "../utils/visitGuard.js";

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
export const getComplaintsByPatientId = async (patientId: number) => {
    return await db
        .select()
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
export const createComplaint = async (complaint: { patientId: number; complaint: string; recordedBy: string; visitInfo?: Record<string, unknown> | null }) => {
    const visit = await getOrCreateVisit(complaint.patientId, complaint.visitInfo as VisitInfo | null ?? null);

    const [newComplaint] = await db
        .insert(complaints)
        .values({
            patientId: complaint.patientId,
            complaint: complaint.complaint,
            recordedBy: complaint.recordedBy,
            createdAt: new Date() as unknown as string,
            visitId: visit.id,
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
