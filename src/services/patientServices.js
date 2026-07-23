// drizzlePatients.js
import { db } from "../../drizzle-db.js";
import { patients, mediaContent, patientInsurance, insuranceProviders } from "../../drizzle/migrations/schema.js";
import { desc, eq, and } from "drizzle-orm";

// ─── In-memory cache ───────────────────────────────────────────────────────
let patientsCache = null;

/** Clears the in-memory patients cache, forcing the next call to `getPatients` to re-query the database. */
export const invalidatePatientsCache = () => {
  patientsCache = null;
};
// ───────────────────────────────────────────────────────────────────────────

/** Returns all patients with basic identifying fields (in-memory cached).
 * @returns {Promise<object[]>}
 */
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
      provider_name: insuranceProviders.name,
    })
    .from(patients)
    .leftJoin(
      patientInsurance,
      and(
        eq(patientInsurance.patientId, patients.patientId),
        eq(patientInsurance.isPrimary, true),
        eq(patientInsurance.status, "Active")
      )
    )
    .leftJoin(insuranceProviders, eq(patientInsurance.providerId, insuranceProviders.id));

  patientsCache = result;
  return result;
};

/** Returns `patientId`, names, and hospital number for all patients — useful for select/combobox lookups.
 * @returns {Promise<object[]>}
 */
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

/**
 * Checks whether a given hospital number already exists.
 * Uses the in-memory cache when populated; otherwise queries the database.
 * @param {number} hospitalNumber
 * @returns {Promise<boolean>}
 */
export const checkHospitalNumberExists = async (hospitalNumber) => {
  const num = Number(hospitalNumber);
  if (patientsCache) {
    return patientsCache.some(p => Number(p.hospitalNumber) === num);
  }
  const [existing] = await db
    .select({ hospitalNumber: patients.hospitalNumber })
    .from(patients)
    .where(eq(patients.hospitalNumber, num))
    .limit(1);
  return !!existing;
};

/**
 * Creates a new full patient record, auto-incrementing `hospitalNumber` if not provided.
 * @param {object} patientData
 * @returns {Promise<object>} The newly inserted patient row
 */
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


/** Fetches all columns for a single patient by ID, plus the profile image URL if one exists.
 * @param {number} patientId
 * @returns {Promise<object>}
 */
export const viewPatient = async (patientId) => {
  const [patient] = await db
    .select({
      patientId: patients.patientId,
      date: patients.date,
      hospitalNumber: patients.hospitalNumber,
      firstName: patients.firstName,
      otherNames: patients.otherNames,
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
      surname: patients.surname,
      patientType: patients.patientType,
      isInpatient: patients.isInpatient,
      mediaId: patients.mediaId,
      profileImageUrl: mediaContent.url,
    })
    .from(patients)
    .leftJoin(mediaContent, eq(patients.mediaId, mediaContent.id))
    .where(eq(patients.patientId, patientId));

  return patient;
};

/** Partially updates a patient — only fields that are provided are merged into the existing record.
 * @param {number} patientId
 * @param {object} patientData
 * @returns {Promise<object>} The updated patient row
 */
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

/** Deletes a patient by ID, invalidates the patients cache, and returns the deleted row.
 * @param {number} patientId
 * @returns {Promise<object>}
 */
export const deletePatient = async (patientId) => {
  const [deletedPatient] = await db
    .delete(patients)
    .where(eq(patients.patientId, patientId))
    .returning();

  invalidatePatientsCache();
  return deletedPatient;
};
