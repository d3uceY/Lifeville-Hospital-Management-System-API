// drizzlePatients.js
import { db } from "../../drizzle-db.js";
import { patients } from "../../drizzle/migrations/schema.js";
import { desc, eq } from "drizzle-orm";

// ─── In-memory cache ───────────────────────────────────────────────────────
let patientsCache = null;

export const invalidatePatientsCache = () => {
  patientsCache = null;
};
// ───────────────────────────────────────────────────────────────────────────

export const getPatients = async () => {
  if (patientsCache) return patientsCache;

  const result = await db
    .select({
      surname: patients.surname,
      first_name: patients.firstName,
      patientId: patients.patientId,
      hospitalNumber: patients.hospitalNumber,
      sex: patients.sex,
      dateOfBirth: patients.dateOfBirth,
      phoneNumber: patients.phoneNumber,
    })
    .from(patients);

  patientsCache = result;
  return result;
};

export const getPatientNameId = async () => {
  return await db
    .select({
      patientId: patients.patientId,
      first_name: patients.firstName,
      surname: patients.surname,
      hospitalNumber: patients.hospitalNumber,
    })
    .from(patients);
};

// alias but same as above
export const getPatientNameAndId = getPatientNameId;

export const createPatient = async (patientData) => {
  const {
    hospitalNumber,
    date,
    surname,
    firstName,
    otherNames,
    sex,
    maritalStatus,
    dateOfBirth,
    phoneNumber,
    address,
    occupation,
    placeOfWorkAddress,
    religion,
    nationality,
    nextOfKin,
    relationship,
    nextOfKinPhoneNumber,
    addressOfNextOfKin,
    pastMedicalHistory,
    pastSurgicalHistory,
    familyHistory,
    socialHistory,
    drugHistory,
    allergies,
    dietaryRestrictions,
    dietAllergies,
  } = patientData;

  // Get the last patient to determine the new hospital number
  let newHospitalNumber; // default starting number
  if (!hospitalNumber) {
    const [lastPatient] = await db
      .select({ hospitalNumber: patients.hospitalNumber })
      .from(patients)
      .orderBy(desc(patients.hospitalNumber))
      .limit(1);

    if (lastPatient) {
      newHospitalNumber = 1;
      // Ensure it's an integer before incrementing
      newHospitalNumber = Number(lastPatient.hospitalNumber) + 1;
    }
  }


  // Insert new patient with the generated hospital number if hospitalNumber is not provided
  const [newPatient] = await db
    .insert(patients)
    .values({
      date,
      hospitalNumber: hospitalNumber || newHospitalNumber,
      surname,
      firstName: firstName,
      otherNames: otherNames,
      sex,
      maritalStatus: maritalStatus,
      dateOfBirth: dateOfBirth,
      phoneNumber: phoneNumber,
      address,
      occupation,
      placeOfWorkAddress: placeOfWorkAddress,
      religion,
      nationality,
      nextOfKin: nextOfKin,
      relationship,
      nextOfKinPhone: nextOfKinPhoneNumber,
      nextOfKinAddress: addressOfNextOfKin,
      pastMedicalHistory: pastMedicalHistory,
      pastSurgicalHistory: pastSurgicalHistory,
      familyHistory: familyHistory,
      socialHistory: socialHistory,
      drugHistory: drugHistory,
      allergies,
      dietaryRestrictions: dietaryRestrictions,
      dietAllergiesToDrugs: dietAllergies,
    })
    .returning();

  invalidatePatientsCache();
  return newPatient;
};


export const viewPatient = async (patientId) => {
  const [patient] = await db
    .select()
    .from(patients)
    .where(eq(patients.patientId, patientId));

  return patient;
};

export const updatePatient = async (patientId, patientData) => {
  // Ensure patient exists
  const [existing] = await db
    .select()
    .from(patients)
    .where(eq(patients.patientId, patientId));

  if (!existing) {
    const err = new Error("Patient not found");
    err.code = "PATIENT_NOT_FOUND";
    throw err;
  }


  const {
    date,
    hospitalNumber,
    surname,
    firstName,
    otherNames,
    sex,
    maritalStatus,
    dateOfBirth,
    phoneNumber,
    address,
    occupation,
    placeOfWorkAddress,
    religion,
    nationality,
    nextOfKin,
    relationship,
    nextOfKinPhoneNumber,
    addressOfNextOfKin,
    pastMedicalHistory,
    pastSurgicalHistory,
    familyHistory,
    socialHistory,
    drugHistory,
    allergies,
    dietaryRestrictions,
    dietAllergies,
  } = patientData;

  const updateData = {
    ...(date !== undefined && { date }),
    ...(hospitalNumber !== undefined && { hospitalNumber }),
    ...(surname !== undefined && { surname }),
    ...(firstName !== undefined && { firstName }),
    ...(otherNames !== undefined && { otherNames }),
    ...(sex !== undefined && { sex }),
    ...(maritalStatus !== undefined && { maritalStatus }),
    ...(dateOfBirth !== undefined && { dateOfBirth }),
    ...(phoneNumber !== undefined && { phoneNumber }),
    ...(address !== undefined && { address }),
    ...(occupation !== undefined && { occupation }),
    ...(placeOfWorkAddress !== undefined && { placeOfWorkAddress }),
    ...(religion !== undefined && { religion }),
    ...(nationality !== undefined && { nationality }),
    ...(nextOfKin !== undefined && { nextOfKin }),
    ...(relationship !== undefined && { relationship }),
    ...(nextOfKinPhoneNumber !== undefined && { nextOfKinPhone: nextOfKinPhoneNumber }),
    ...(addressOfNextOfKin !== undefined && { nextOfKinAddress: addressOfNextOfKin }),
    ...(pastMedicalHistory !== undefined && { pastMedicalHistory }),
    ...(pastSurgicalHistory !== undefined && { pastSurgicalHistory }),
    ...(familyHistory !== undefined && { familyHistory }),
    ...(socialHistory !== undefined && { socialHistory }),
    ...(drugHistory !== undefined && { drugHistory }),
    ...(allergies !== undefined && { allergies }),
    ...(dietaryRestrictions !== undefined && { dietaryRestrictions }),
    ...(dietAllergies !== undefined && { dietAllergiesToDrugs: dietAllergies }),
  };

  // Update
  const [updatedPatient] = await db
    .update(patients)
    .set(updateData)
    .where(eq(patients.patientId, patientId))
    .returning();

  invalidatePatientsCache();
  return updatedPatient;
};

export const deletePatient = async (patientId) => {
  const [deletedPatient] = await db
    .delete(patients)
    .where(eq(patients.patientId, patientId))
    .returning();

  invalidatePatientsCache();
  return deletedPatient;
};
