import { eq, desc, and, ilike, or, sql, count } from "drizzle-orm";
import { db } from "../../drizzle-db.js";
import { inpatientAdmissions, patients, users, dischargeSummary } from "../../drizzle/migrations/schema.js";
import * as billingService from "./billingService.js";
import { SERVICE_CATEGORIES } from "../constants/domain.js";

const INPATIENT_SELECT_FIELDS = {
  id: inpatientAdmissions.id,
  patientId: inpatientAdmissions.patientId,
  symptomTypes: inpatientAdmissions.symptomTypes,
  symptomDescription: inpatientAdmissions.symptomDescription,
  note: inpatientAdmissions.note,
  previousMedicalIssue: inpatientAdmissions.previousMedicalIssue,
  admissionDate: inpatientAdmissions.admissionDate,
  consultantDoctorId: inpatientAdmissions.consultantDoctorId,
  bedGroup: inpatientAdmissions.bedGroup,
  bedNumber: inpatientAdmissions.bedNumber,
  createdAt: inpatientAdmissions.createdAt,
  updatedAt: inpatientAdmissions.updatedAt,
  dischargeCondition: inpatientAdmissions.dischargeCondition,
  hospitalNumber: patients.hospitalNumber,
  firstName: patients.firstName,
  otherNames: patients.otherNames,
  surname: patients.surname,
  sex: patients.sex,
  dateOfBirth: patients.dateOfBirth,
  phoneNumber: patients.phoneNumber,
  consultant_doctor_name: users.name,
};

/**
 * Fetch paginated inpatient admission records (joined with patient data)
 */
export const getInpatientAdmissions = async ({ page = 1, pageSize = 10, search = "", sex = "" } = {}) => {
  const offset = (page - 1) * pageSize;
  const conditions = [eq(inpatientAdmissions.dischargeCondition, "on admission")];

  if (search) {
    conditions.push(
      or(
        ilike(patients.firstName, `%${search}%`),
        ilike(patients.surname, `%${search}%`),
        ilike(sql`CAST(${patients.hospitalNumber} AS TEXT)`, `%${search}%`),
        ilike(patients.phoneNumber, `%${search}%`)
      )
    );
  }
  if (sex) conditions.push(eq(patients.sex, sex));

  const where = and(...conditions);

  const [data, countResult] = await Promise.all([
    db
      .select(INPATIENT_SELECT_FIELDS)
      .from(inpatientAdmissions)
      .innerJoin(patients, eq(inpatientAdmissions.patientId, patients.patientId))
      .leftJoin(users, eq(inpatientAdmissions.consultantDoctorId, users.id))
      .where(where)
      .orderBy(desc(inpatientAdmissions.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: count() })
      .from(inpatientAdmissions)
      .innerJoin(patients, eq(inpatientAdmissions.patientId, patients.patientId))
      .where(where),
  ]);

  const totalItems = Number(countResult[0].count);
  return {
    data,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
    page: Number(page),
    pageSize: Number(pageSize),
  };
};



export const getInpatientAdmissionsByPatientId = async (patientId) => {
  return await db
    .select({
      // inpatient_admissions fields
      id: inpatientAdmissions.id,
      patientId: inpatientAdmissions.patientId,
      symptomTypes: inpatientAdmissions.symptomTypes,
      symptomDescription: inpatientAdmissions.symptomDescription,
      note: inpatientAdmissions.note,
      endDate: inpatientAdmissions.endDate,
      previousMedicalIssue: inpatientAdmissions.previousMedicalIssue,
      admissionDate: inpatientAdmissions.admissionDate,
      consultantDoctorId: inpatientAdmissions.consultantDoctorId,
      bedGroup: inpatientAdmissions.bedGroup,
      bedNumber: inpatientAdmissions.bedNumber,
      createdAt: inpatientAdmissions.createdAt,
      updatedAt: inpatientAdmissions.updatedAt,
      dischargeCondition: inpatientAdmissions.dischargeCondition,
      // patients fields
      hospitalNumber: patients.hospitalNumber,
      firstName: patients.firstName,
      otherNames: patients.otherNames,
      surname: patients.surname,
      sex: patients.sex,
      dateOfBirth: patients.dateOfBirth,
      phoneNumber: patients.phoneNumber,
      // users fields
      consultant_doctor_name: users.name,
    })
    .from(inpatientAdmissions)
    .innerJoin(patients, eq(inpatientAdmissions.patientId, patients.patientId))
    .leftJoin(users, eq(inpatientAdmissions.consultantDoctorId, users.id))
    .where(eq(inpatientAdmissions.patientId, patientId))
    .orderBy(desc(inpatientAdmissions.createdAt));
};




/**
 * Fetch one inpatient admission by its ID (joined with patient data)
 */
export const viewInpatientAdmission = async (admissionId) => {
  const [admission] = await db
    .select({
      // inpatient_admissions fields
      id: inpatientAdmissions.id,
      patientId: inpatientAdmissions.patientId,
      symptomTypes: inpatientAdmissions.symptomTypes,
      symptomDescription: inpatientAdmissions.symptomDescription,
      note: inpatientAdmissions.note,
      previousMedicalIssue: inpatientAdmissions.previousMedicalIssue,
      admissionDate: inpatientAdmissions.admissionDate,
      consultantDoctorId: inpatientAdmissions.consultantDoctorId,
      bedGroup: inpatientAdmissions.bedGroup,
      bedNumber: inpatientAdmissions.bedNumber,
      createdAt: inpatientAdmissions.createdAt,
      updatedAt: inpatientAdmissions.updatedAt,
      // patients fields
      hospitalNumber: patients.hospitalNumber,
      firstName: patients.firstName,
      otherNames: patients.otherNames,
      surname: patients.surname,
      sex: patients.sex,
      maritalStatus: patients.maritalStatus,
      dateOfBirth: patients.dateOfBirth,
      phoneNumber: patients.phoneNumber,
      address: patients.address,
      occupation: patients.occupation,
      placeOfWorkAddress: patients.placeOfWorkAddress,
      religion: patients.religion,
      nationality: patients.nationality,
      nextOfKin: patients.nextOfKin,
      relationship: patients.relationship,
      nextOfKinPhone: patients.nextOfKinPhone,
      nextOfKinAddress: patients.nextOfKinAddress,
      pastSurgicalHistory: patients.pastSurgicalHistory,
      familyHistory: patients.familyHistory,
      socialHistory: patients.socialHistory,
      drugHistory: patients.drugHistory,
      allergies: patients.allergies,
      dietaryRestrictions: patients.dietaryRestrictions,
      dietAllergiesToDrugs: patients.dietAllergiesToDrugs,
      pastMedicalHistory: patients.pastMedicalHistory,
      patientType: patients.patientType,
      // users fields
      consultantDoctorName: users.name,
    })
    .from(inpatientAdmissions)
    .innerJoin(patients, eq(inpatientAdmissions.patientId, patients.patientId))
    .leftJoin(users, eq(inpatientAdmissions.consultantDoctorId, users.id))
    .where(eq(inpatientAdmissions.id, admissionId));

  return admission || null;
};

/**
 * Create a new inpatient admission
 */
export const createInpatientAdmission = async (admissionData) => {
  const {
    patientId,
    symptomTypes, // array of strings
    symptomsDescription,
    note,
    previousMedicalIssue,
    admissionDate, // JS Date or ISO string
    consultantDoctorId,
    bedGroup,
    bedNumber,
  } = admissionData;

  try {
    const admitted = await db
      .select()
      .from(inpatientAdmissions)
      .where(
        and(
          eq(inpatientAdmissions.patientId, patientId),
          eq(inpatientAdmissions.dischargeCondition, "on admission")
        )
      );

    if (admitted.length > 0) {
      throw new Error("Patient is already admitted");
    }
  } catch (err) {
    console.error("error fetching inpatient admissions:", err);
    throw err;
  }

  const [updatedPatient] = await db.update(patients).set({
    patientType: "INPATIENT",
  }).where(eq(patients.patientId, patientId)).returning();

  const [newAdmission] = await db
    .insert(inpatientAdmissions)
    .values({
      patientId: patientId,
      symptomTypes: symptomTypes,
      symptomDescription: symptomsDescription,
      note,
      previousMedicalIssue: previousMedicalIssue,
      admissionDate: admissionDate,
      consultantDoctorId: consultantDoctorId,
      bedGroup: bedGroup,
      bedNumber: bedNumber,
    })
    .returning();

  const [doctorName] = await db.select({
    doctor_name: users.name,
  })
    .from(users)
    .where(eq(users.id, consultantDoctorId));

  // ── Auto-billing: admission fee at point of admission ──────────────────────
  try {
    const admissionFeePrice = await billingService.getServicePrice("Admission Fee");
    const consultationPrice = await billingService.getServicePrice("Consultation Fee");

    // Create invoice for this admission + add one-time charges
    await billingService.addItem({
      admissionId: newAdmission.id,
      description: "Admission Fee",
      category: SERVICE_CATEGORIES.SERVICE,
      quantity: 1,
      unitPrice: admissionFeePrice,
      billingType: "credit",
      createdBy: admissionData.createdBy || null,
    });
    await billingService.addItem({
      admissionId: newAdmission.id,
      description: "Consultation Fee",
      category: SERVICE_CATEGORIES.CONSULTATION,
      quantity: 1,
      unitPrice: consultationPrice,
      billingType: "credit",
      createdBy: admissionData.createdBy || null,
    });
  } catch (billingErr) {
    console.error("Billing error (admission):", billingErr.message);
  }

  return {
    ...newAdmission,
    doctorName: doctorName.doctor_name,
    firstName: updatedPatient.firstName,
    surname: updatedPatient.surname,
  };
};

/**
 * Update an existing inpatient admission by its ID
 */
export const updateInpatientAdmission = async (admissionId, admissionData) => {
  // Ensure admission exists
  const [existing] = await db
    .select()
    .from(inpatientAdmissions)
    .where(eq(inpatientAdmissions.id, admissionId));

  if (!existing) {
    const err = new Error("Inpatient admission not found");
    err.code = "ADMISSION_NOT_FOUND";
    throw err;
  }

  const {
    patientId,
    symptomTypes,
    symptomsDescription,
    note,
    previousMedicalIssue,
    admissionDate,
    consultantDoctorId,
    bedGroup,
    bedNumber,
  } = admissionData;

  const updateData = {
    ...(patientId !== undefined && { patientId: patientId }),
    ...(symptomTypes !== undefined && { symptomTypes: symptomTypes }),
    ...(symptomsDescription !== undefined && { symptomDescription: symptomsDescription }),
    ...(note !== undefined && { note }),
    ...(previousMedicalIssue !== undefined && { previousMedicalIssue: previousMedicalIssue }),
    ...(admissionDate !== undefined && { admissionDate: admissionDate }),
    ...(consultantDoctorId !== undefined && { consultantDoctorId: consultantDoctorId }),
    ...(bedGroup !== undefined && { bedGroup: bedGroup }),
    ...(bedNumber !== undefined && { bedNumber: bedNumber }),
  };

  const [updatedAdmission] = await db
    .update(inpatientAdmissions)
    .set(updateData)
    .where(eq(inpatientAdmissions.id, admissionId))
    .returning();

  return updatedAdmission;
};

/**
 * Delete an inpatient admission by its ID
 */
export const deleteInpatientAdmission = async (admissionId) => {
  const [deletedAdmission] = await db
    .delete(inpatientAdmissions)
    .where(eq(inpatientAdmissions.id, admissionId))
    .returning();

  if (deletedAdmission.dischargeCondition == "on admission") {
    await db.update(patients).set({
      patientType: "OUTPATIENT",
    }).where(eq(patients.patientId, deletedAdmission.patientId));
  }

  await db.delete(dischargeSummary)
    .where(eq(dischargeSummary.admissionId, admissionId));


  return !!deletedAdmission;
};


/**
 * Discharge an inpatient admission by its ID
 */

export const dischargeInpatientAdmission = async (dischargeData) => {
  const {
    patient_id,
    admission_id,
    recorded_by,
    final_diagnosis,
    diagnosis_details,
    treatment_given,
    outcome,
    condition,
    discharge_date_time,
    follow_up,
    doctor_id } = dischargeData;


  const [existing] = await db.select().from(inpatientAdmissions).where(eq(inpatientAdmissions.id, admission_id));

  // check if inpatient admission exists
  if (!existing) {
    const err = new Error("Inpatient admission not found");
    err.code = "ADMISSION_NOT_FOUND";
    throw err;
  }


  // check if patient in admission has already been discharged
  const [dischargeExist] = await db.select().from(dischargeSummary).where(eq(dischargeSummary.admissionId, admission_id))
  if (dischargeExist) {
    const err = new Error("Patient has already been discharged")
    throw err;
  }

  // create new discharge summary
  const [newDischarge] = await db.insert(dischargeSummary).values({
    patientId: patient_id,
    admissionId: admission_id,
    recordedBy: recorded_by,
    finalDiagnosis: final_diagnosis,
    diagnosisDetails: diagnosis_details,
    treatmentGiven: treatment_given,
    outcome,
    condition,
    dischargeDateTime: new Date(discharge_date_time),
    followUp: follow_up,
    doctorId: doctor_id
  }).returning();

  if (!newDischarge) {
    const err = new Error("Discharge not created");
    err.code = "DISCHARGE_NOT_CREATED";
    throw err;
  }


  // update inpatient admission
  try {
    await db.update(inpatientAdmissions).set({
      dischargeCondition: condition,
      endDate: new Date(discharge_date_time)
    }).where(eq(inpatientAdmissions.id, admission_id));
  } catch (err) {
    console.error("Error updating inpatient admission:", err);
    throw err;
  }

  // update patient type
  try {
    const [dischargedPatient] = await db.update(patients).set({

      patientType: "OUTPATIENT",
    }).where(eq(patients.patientId, patient_id)).returning();
    return dischargedPatient;

  } catch (err) {
    console.error("Error updating patient type:", err);
    throw err;
  }

}

export const getDischargeSummaryByAdmissionId = async (admissionId) => {
  const result = await db.select(
    {
      ...dischargeSummary,
      doctor_name: users.name
    }
  )
    .from(dischargeSummary)
    .innerJoin(users, eq(dischargeSummary.doctorId, users.id))
    .where(eq(dischargeSummary.admissionId, admissionId));

  if (result.length > 0) {
    return result;
  } else {
    return [];
  }
}