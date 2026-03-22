import { db } from "../../drizzle-db.js";
import { patientVisits, patients, users } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql, and, between, isNull } from "drizzle-orm";
import * as billingService from "./billingService.js";
import { SERVICE_CATEGORIES } from "../constants/domain.js";

/**
 * Creates an outpatient visit, auto-bills a consultation fee, and returns the visit enriched with
 * patient and doctor names.
 * @param {object} patientVisitData
 * @returns {Promise<object>}
 */
export const createPatientVisit = async (patientVisitData) => {
    const { patientId, doctorId, recordedBy, purpose } = patientVisitData;

    // ── Guard: reject if the patient already has an ongoing visit ─────────
    const [ongoingVisit] = await db
        .select({ id: patientVisits.id })
        .from(patientVisits)
        .where(
            and(
                eq(patientVisits.patientId, patientId),
                isNull(patientVisits.checkOutTime)
            )
        )
        .limit(1);

    if (ongoingVisit) {
        const err = new Error("Patient already has an ongoing visit. Please check out the current visit before recording a new one.");
        err.code = "ONGOING_VISIT_EXISTS";
        throw err;
    }

    const now = new Date();
    const [rows] = await db.insert(patientVisits).values({
        patientId: patientId,
        doctorId: doctorId,
        recordedBy: recordedBy,
        purpose,
        visitType: "outpatient",
        checkInTime: now,
    }).returning();

    const patientData = await db.select({
        first_name: patients.firstName,
        surname: patients.surname,
    }).from(patients).where(eq(patients.patientId, patientId));

    const [doctorData] = await db.select({
        name: users.name,
    }).from(users).where(eq(users.id, doctorId));

    // ── Auto-billing: consultation fee for outpatient visit ────────────────
    try {
        const consultationPrice = await billingService.getServicePrice("Consultation Fee");
        await billingService.addItem({
            visitId: rows.id,
            description: `Consultation: ${purpose}`,
            category: SERVICE_CATEGORIES.CONSULTATION,
            quantity: 1,
            unitPrice: consultationPrice,
            billingType: "credit",
            createdBy: patientVisitData.createdBy || null,
        });
    } catch (billingErr) {
        console.error("Billing error (patient visit):", billingErr.message);
    }

    return {
        ...rows,
        first_name: patientData[0].first_name,
        surname: patientData[0].surname,
        doctor_name: doctorData.name,
    };
};


/**
 * Returns filtered, paginated patient visits joined with patient data.
 * @param {number} [page=1]
 * @param {number} [pageSize=10]
 * @param {{ firstName?: string, surname?: string, phoneNumber?: string, hospitalNumber?: string, startDate?: string, endDate?: string }} [filters={}]
 * @returns {Promise<{ data: object[], totalItems: number, totalPages: number, currentPage: number, pageSize: number, skipped: number }>}
 */
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
            filters.push(between(patientVisits.checkInTime, start, end));
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
            visitType: patientVisits.visitType,
            checkInTime: patientVisits.checkInTime,
            checkOutTime: patientVisits.checkOutTime,
            admissionId: patientVisits.admissionId,
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
        .orderBy(desc(patientVisits.checkInTime))
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
        visit_type: row.visitType,
        check_in_time: row.checkInTime,
        check_out_time: row.checkOutTime,
        admission_id: row.admissionId,
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


/** Returns all visits for a patient joined with patient and doctor data.
 * @param {number} patientId
 * @returns {Promise<object[]>}
 */
export const getPatientVisitsByPatientId = async (patientId) => {
    const rows = await db
        .select({
            id: patientVisits.id,
            doctor_id: patientVisits.doctorId,
            patient_id: patientVisits.patientId,
            recorded_by: patientVisits.recordedBy,
            purpose: patientVisits.purpose,
            visit_type: patientVisits.visitType,
            check_in_time: patientVisits.checkInTime,
            check_out_time: patientVisits.checkOutTime,
            admission_id: patientVisits.admissionId,
            created_at: patientVisits.createdAt,
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
        .orderBy(desc(patientVisits.checkInTime));
    return rows;
};


/**
 * Checks out an outpatient visit by setting check_out_time.
 * Inpatient visits can only be checked out via the discharge flow.
 * @param {number} visitId
 * @returns {Promise<object>}
 */
export const checkOutPatientVisit = async (visitId) => {
    const [visit] = await db
        .select()
        .from(patientVisits)
        .where(eq(patientVisits.id, visitId));

    if (!visit) {
        const err = new Error("Visit not found");
        err.code = "VISIT_NOT_FOUND";
        throw err;
    }

    if (visit.visitType !== "outpatient") {
        const err = new Error("Inpatient visits can only be checked out via the discharge process");
        err.code = "INPATIENT_CHECKOUT_NOT_ALLOWED";
        throw err;
    }

    if (visit.checkOutTime) {
        const err = new Error("Patient has already been checked out");
        err.code = "ALREADY_CHECKED_OUT";
        throw err;
    }

    const [updated] = await db
        .update(patientVisits)
        .set({ checkOutTime: new Date() })
        .where(eq(patientVisits.id, visitId))
        .returning();

    return updated;
};