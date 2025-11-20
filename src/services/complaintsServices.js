import { db } from "../../drizzle-db.js";
import { patients, complaints } from "../../drizzle/migrations/schema.js";
import { eq, desc } from "drizzle-orm";

// Get all complaints
export const getComplaints = async () => {
    return await db.select().from(complaints);
};

// Get complaints for a specific patient, joined with patient info
export const getComplaintsByPatientId = async (patientId) => {
    return await db
        .select({
            ...complaints,
            first_name: patients.first_name,
            surname: patients.surname,
        })
        .from(complaints)
        .innerJoin(patients, eq(complaints.patient_id, patients.patient_id))
        .where(eq(complaints.patient_id, patientId))
        .orderBy(desc(complaints.created_at));
};

// Create new complaint
export const createComplaint = async (complaint) => {
    const [newComplaint] = await db
        .insert(complaints)
        .values({
            patient_id: complaint.patientId,
            complaint: complaint.complaint,
            recorded_by: complaint.recordedBy,
            created_at: new Date(),
        })
        .returning();

    // Get patient details for notification
    const patient = await db.select({
        first_name: patients.first_name,
        surname: patients.surname,
    }).from(patients).where(eq(patients.patient_id, complaint.patientId));

    return {
        ...newComplaint,
        first_name: patient[0].first_name,
        surname: patient[0].surname,
    };
};
