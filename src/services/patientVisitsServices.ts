import { HttpError } from "../lib/errors.js";
import { db } from "../../drizzle-db.js";
import { patientVisits, patients, users, vitalSigns, diagnoses, prescriptions, labTests, complaints, nursesNotes, doctorsNotes, physicalExaminations, procedures, patientInsurance, insuranceProviders } from "../../drizzle/migrations/schema.js";
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
    } catch (billingErr: unknown) {
        console.error("Billing error (patient visit):", (billingErr instanceof Error ? billingErr.message : String(billingErr)));
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
    { search, startDate, endDate } = {}
) => {
    const pageNumber = Number(page);
    const pageSizeNumber = Number(pageSize);
    const offset = (pageNumber - 1) * pageSizeNumber;

    const normalize = (val) =>
        typeof val === "string" && val.trim() !== "" ? val.trim() : null;

    const filters = [];


    if (normalize(search)) {
        filters.push(or(
            ilike(patients.firstName, `%${normalize(search)}%`),
            ilike(patients.surname, `%${normalize(search)}%`),
            ilike(patients.phoneNumber, `%${normalize(search)}%`),
            ilike(patients.hospitalNumber, `%${normalize(search)}%`),
        ));
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
            provider_name: insuranceProviders.name,
            insurance_status: patientInsurance.status,
        })
        .from(patientVisits)
        .leftJoin(patients, eq(patientVisits.patientId, patients.patientId))
        .leftJoin(
            patientInsurance,
            and(
                eq(patientInsurance.patientId, patients.patientId),
                eq(patientInsurance.isPrimary, true),
                eq(patientInsurance.status, "Active")
            )
        )
        .leftJoin(insuranceProviders, eq(patientInsurance.providerId, insuranceProviders.id))
        .where(where ?? sql`true`)
        .orderBy(sql`${patientVisits.checkOutTime} IS NULL DESC`, desc(patientVisits.checkInTime))
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
        insurance_provider: row.provider_name ?? null,
        insurance_status: row.insurance_status ?? null,
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
/**
 * Returns a summary of all clinical activity recorded against a specific visit.
 * Each key contains a lightweight array of records tied to that visit_id.
 * @param {number} visitId
 * @returns {Promise<object>}
 */
export async function getVisitSummary(visitId) {
  const id = Number(visitId);

  const [
    vitalsList,
    diagnosesList,
    prescriptionsList,
    labTestsList,
    complaintsList,
    nurseNotesList,
    doctorNotesList,
    physicalExamsList,
    proceduresList,
  ] = await Promise.all([
    db.select({
      id: vitalSigns.id,
      temperature: vitalSigns.temperature,
      bloodPressureSystolic: vitalSigns.bloodPressureSystolic,
      bloodPressureDiastolic: vitalSigns.bloodPressureDiastolic,
      pulseRate: vitalSigns.pulseRate,
      spo2: vitalSigns.spo2,
      weight: vitalSigns.weight,
      height: vitalSigns.height,
      recordedBy: vitalSigns.recordedBy,
      createdAt: vitalSigns.createdAt,
    }).from(vitalSigns).where(eq(vitalSigns.visitId, id)).orderBy(asc(vitalSigns.createdAt)),

    db.select({
      diagnosisId: diagnoses.diagnosisId,
      condition: diagnoses.condition,
      notes: diagnoses.notes,
      diagnosisDate: diagnoses.diagnosisDate,
      recordedBy: diagnoses.recordedBy,
    }).from(diagnoses).where(eq(diagnoses.visitId, id)).orderBy(asc(diagnoses.diagnosisDate)),

    db.select({
      prescriptionId: prescriptions.prescriptionId,
      prescribedBy: prescriptions.prescribedBy,
      prescriptionDate: prescriptions.prescriptionDate,
      status: prescriptions.status,
      notes: prescriptions.notes,
    }).from(prescriptions).where(eq(prescriptions.visitId, id)).orderBy(asc(prescriptions.prescriptionDate)),

    db.select({
      id: labTests.id,
      testType: labTests.testType,
      status: labTests.status,
      prescribedBy: labTests.prescribedBy,
      createdAt: labTests.createdAt,
    }).from(labTests).where(eq(labTests.visitId, id)).orderBy(asc(labTests.createdAt)),

    db.select({
      id: complaints.id,
      complaint: complaints.complaint,
      createdAt: complaints.createdAt,
      recordedBy: complaints.recordedBy,
    }).from(complaints).where(eq(complaints.visitId, id)).orderBy(asc(complaints.createdAt)),

    db.select({
      id: nursesNotes.id,
      note: nursesNotes.note,
      createdAt: nursesNotes.createdAt,
      recordedBy: nursesNotes.recordedBy,
    }).from(nursesNotes).where(eq(nursesNotes.visitId, id)).orderBy(asc(nursesNotes.createdAt)),

    db.select({
      id: doctorsNotes.id,
      note: doctorsNotes.note,
      createdAt: doctorsNotes.createdAt,
      recordedBy: doctorsNotes.recordedBy,
    }).from(doctorsNotes).where(eq(doctorsNotes.visitId, id)).orderBy(asc(doctorsNotes.createdAt)),

    db.select({
      id: physicalExaminations.id,
      findings: physicalExaminations.findings,
      recordedBy: physicalExaminations.recordedBy,
      createdAt: physicalExaminations.createdAt,
    }).from(physicalExaminations).where(eq(physicalExaminations.visitId, id)).orderBy(asc(physicalExaminations.createdAt)),

    db.select({
      id: procedures.id,
      procedureName: procedures.procedureName,
      performedAt: procedures.performedAt,
      comments: procedures.comments,
      recordedBy: procedures.recordedBy,
      createdAt: procedures.createdAt,
    }).from(procedures).where(eq(procedures.visitId, id)).orderBy(asc(procedures.createdAt)),
  ]);

  return {
    vitals: vitalsList,
    diagnoses: diagnosesList,
    prescriptions: prescriptionsList,
    labTests: labTestsList,
    complaints: complaintsList,
    nurseNotes: nurseNotesList,
    doctorNotes: doctorNotesList,
    physicalExaminations: physicalExamsList,
    procedures: proceduresList,
  };
}

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

    const [patientData] = await db
        .select({ first_name: patients.firstName, surname: patients.surname })
        .from(patients)
        .where(eq(patients.patientId, updated.patientId));

    return {
        ...updated,
        first_name: patientData?.first_name,
        surname: patientData?.surname,
    };
};

/**
 * Returns the last N unique patient visits (most recent per patient).
 * Used for the "Recent Visits" dashboard widget.
 */
export const getRecentUniqueVisits = async (limit: number = 5) => {
    const rows = await db
        .select({
            visitId: patientVisits.id,
            patientId: patientVisits.patientId,
            checkInTime: patientVisits.checkInTime,
            firstName: patients.firstName,
            surname: patients.surname,
            sex: patients.sex,
            hospitalNumber: patients.hospitalNumber,
        })
        .from(patientVisits)
        .leftJoin(patients, eq(patientVisits.patientId, patients.patientId))
        .orderBy(desc(patientVisits.checkInTime))
        .limit(limit * 3); // fetch extra to deduplicate

    const seen = new Set<number>();
    const unique: Array<{
        patientId: number;
        first_name: string | null;
        surname: string | null;
        sex: string | null;
        hospitalNumber: number | null;
        lastVisit: string | null;
    }> = [];
    for (const row of rows) {
        if (seen.has(row.patientId)) continue;
        seen.add(row.patientId);
        unique.push({
            patientId: row.patientId,
            first_name: row.firstName,
            surname: row.surname,
            sex: row.sex,
            hospitalNumber: row.hospitalNumber,
            lastVisit: row.checkInTime,
        });
        if (unique.length >= limit) break;
    }

    return unique;
};