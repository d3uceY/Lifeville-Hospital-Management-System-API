import { db } from "../../drizzle-db.js";
import { patientVisits, patients, users } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql, and, between } from "drizzle-orm";

export const createPatientVisit = async (patientVisitData) => {
    const { patientId, doctorId, recordedBy, purpose } = patientVisitData;

    const [rows] = await db.insert(patientVisits).values({
        patientId: patientId,
        doctorId: doctorId,
        recordedBy: recordedBy,
        purpose,
        createdAt: new Date(),
    }).returning();

    const patientData = await db.select({
        first_name: patients.firstName,
        surname: patients.surname,
    }).from(patients).where(eq(patients.patientId, patientId));

    const [doctorData] = await db.select({
        name: users.name,
    }).from(users).where(eq(users.id, doctorId));
    return {
        ...rows,
        first_name: patientData[0].first_name,
        surname: patientData[0].surname,
        doctor_name: doctorData.name,
    };
};


export const getPaginatedPatientVisits = async (
    page = 1,
    pageSize = 10,
    { firstName, surname, phoneNumber, hospitalNumber, startDate, endDate } = {}
) => {
    const pageNumber = Number(page);
    const pageSizeNumber = Number(pageSize);
    const offset = (pageNumber - 1) * pageSizeNumber;

    const normalize = (val) =>
        typeof val === "string" && val.trim() !== "" ? val.trim() : null;

    const filters = [];


    if (normalize(firstName)) {
        filters.push(ilike(patients.firstName, `%${normalize(firstName)}%`));
    }
    if (normalize(surname)) {
        filters.push(ilike(patients.surname, `%${normalize(surname)}%`));
    }
    if (normalize(phoneNumber)) {
        filters.push(ilike(patients.phoneNumber, `%${normalize(phoneNumber)}%`));
    }
    if (normalize(hospitalNumber)) {
        filters.push(ilike(patients.hospitalNumber, `%${normalize(hospitalNumber)}%`));
    }

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (!isNaN(start) && !isNaN(end)) {
            filters.push(between(patientVisits.createdAt, start, end));
        }
    }

    const where = filters.length > 0 ? and(...filters) : undefined;

    const [{ total }] = await db
        .select({ total: count() })
        .from(patientVisits)
        .leftJoin(patients, eq(patientVisits.patientId, patients.patientId))
        .where(where ?? sql`true`);

    const totalItems = Number(total);
    const totalPages = Math.ceil(totalItems / pageSizeNumber);

    const rows = await db
        .select({
            visitId: patientVisits.id,
            doctorId: patientVisits.doctorId,
            patientId: patientVisits.patientId,
            recordedBy: patientVisits.recordedBy,
            purpose: patientVisits.purpose,
            createdAt: patientVisits.createdAt,
            firstName: patients.firstName,
            surname: patients.surname,
            otherNames: patients.otherNames,
            phoneNumber: patients.phoneNumber,
            hospitalNumber: patients.hospitalNumber,
        })
        .from(patientVisits)
        .leftJoin(patients, eq(patientVisits.patientId, patients.patientId))
        .where(where ?? sql`true`)
        .orderBy(desc(patientVisits.createdAt))
        .limit(pageSizeNumber)
        .offset(offset);

    const visits = rows.map((row) => ({
        id: row.visitId,
        doctor_id: row.doctorId,
        patient_id: row.patientId,
        surname: row.surname,
        first_name: row.firstName,
        other_names: row.otherNames,
        patient_name: `${row.firstName ?? ""} ${row.surname ?? ""}`.trim(),
        hospital_number: row.hospitalNumber,
        phone_number: row.phoneNumber,
        recorded_by: row.recordedBy,
        purpose: row.purpose,
        created_at: row.createdAt,
    }));

    return {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize,
        skipped: offset,
        data: visits,
    };
};


export const getPatientVisitsByPatientId = async (patientId) => {
    const rows = await db
        .select({
            ...patientVisits,
            patient_first_name: patients.firstName,
            patient_surname: patients.surname,
            hospital_number: patients.hospitalNumber,
            patient_phone_number: patients.phoneNumber,
            doctor_name: users.name,
        })
        .from(patientVisits)
        .innerJoin(patients, eq(patientVisits.patientId, patients.patientId))
        .leftJoin(users, eq(patientVisits.doctorId, users.id))
        .where(eq(patientVisits.patientId, patientId))
        .orderBy(desc(patientVisits.createdAt));
    return rows;
};