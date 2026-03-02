import { db } from "../../drizzle-db.js";
import { diagnoses, labTests, vitalSigns, inpatientAdmissions, users } from "../../drizzle/migrations/schema.js";
import { eq, desc } from "drizzle-orm";


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