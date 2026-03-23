import { db } from "../../drizzle-db.js";
import { diagnoses, labTests, vitalSigns, inpatientAdmissions, users, patientVisits, patients } from "../../drizzle/migrations/schema.js";
import { eq, desc, isNull } from "drizzle-orm";


/**
 * Returns all 5 summary datasets for the patient dashboard in a single call.
 * Each dataset is limited to the most recent N records.
 */
export const getPatientDashboardSummary = async (patientId) => {
    const id = Number(patientId);

    const [admissionsResult, diagnosesResult, labTestsResult, vitalSignsResult, visitsResult] = await Promise.all([
        db.select({
            admissionDate: inpatientAdmissions.admissionDate,
            consultantDoctorName: users.name,
            dischargeCondition: inpatientAdmissions.dischargeCondition,
        })
            .from(inpatientAdmissions)
            .innerJoin(users, eq(inpatientAdmissions.consultantDoctorId, users.id))
            .where(eq(inpatientAdmissions.patientId, id))
            .orderBy(desc(inpatientAdmissions.createdAt))
            .limit(8),

        db.select({
            diagnosisDate: diagnoses.diagnosisDate,
            consultantDoctorName: diagnoses.recordedBy,
            condition: diagnoses.condition,
        })
            .from(diagnoses)
            .where(eq(diagnoses.patientId, id))
            .orderBy(desc(diagnoses.diagnosisDate))
            .limit(8),

        db.select({
            testDate: labTests.createdAt,
            consultantDoctorName: labTests.prescribedBy,
            testType: labTests.testType,
            status: labTests.status,
        })
            .from(labTests)
            .where(eq(labTests.patientId, id))
            .orderBy(desc(labTests.createdAt))
            .limit(8),

        db.select()
            .from(vitalSigns)
            .where(eq(vitalSigns.patientId, id))
            .orderBy(desc(vitalSigns.createdAt))
            .limit(3),

        db.select({
            id: patientVisits.id,
            checkInTime: patientVisits.checkInTime,
            checkOutTime: patientVisits.checkOutTime,
            visitType: patientVisits.visitType,
            purpose: patientVisits.purpose,
            doctorName: users.name,
        })
            .from(patientVisits)
            .leftJoin(users, eq(patientVisits.doctorId, users.id))
            .where(eq(patientVisits.patientId, id))
            .orderBy(desc(patientVisits.checkInTime))
            .limit(8),
    ]);

    return {
        admissions: admissionsResult,
        diagnoses: diagnosesResult,
        labTests: labTestsResult,
        vitalSigns: vitalSignsResult,
        visits: visitsResult,
    };
};


export const getAdmissionSummaryByPatientId = async (patientId) => {
    const result = await db.select({
        admissionDate: inpatientAdmissions.createdAt,
        consultantDoctorName: users.name,
        dischargeCondition: inpatientAdmissions.dischargeCondition,
    }).from(inpatientAdmissions)
        .innerJoin(users, eq(inpatientAdmissions.consultantDoctorId, users.id))
        .where(eq(inpatientAdmissions.patientId, patientId))
        .orderBy(desc(inpatientAdmissions.createdAt))
        .limit(8);

    return result;
}

export const getDiagnosisSummaryByPatientId = async (patientId) => {

    const result = await db.select({
        diagnosisDate: diagnoses.diagnosisDate,
        consultantDoctorName: diagnoses.recordedBy,
        condition: diagnoses.condition,
    }).from(diagnoses)
        .where(eq(diagnoses.patientId, patientId))
        .orderBy(desc(diagnoses.diagnosisDate))
        .limit(8);
    return result;
}

export const getLabTestSummaryByPatientId = async (patientId) => {
    const result = await db.select({
        testDate: labTests.createdAt,
        consultantDoctorName: labTests.prescribedBy,
        testType: labTests.testType,
        status: labTests.status,
    }).from(labTests)
        .where(eq(labTests.patientId, patientId))
        .orderBy(desc(labTests.createdAt))
        .limit(8);
    return result;
}

export const getVitalSignSummaryByPatientId = async (patientId) => {
    const result = await db.select()
        .from(vitalSigns)
        .where(eq(vitalSigns.patientId, patientId))
        .orderBy(desc(vitalSigns.createdAt))
        .limit(3);

    return result;
}