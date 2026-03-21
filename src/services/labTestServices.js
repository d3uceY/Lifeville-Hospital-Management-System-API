import { db } from "../../drizzle-db.js";
import { labTests, labTestTypes, patients } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql, and, between } from "drizzle-orm";
import { uploadToCloudinary } from "../utils/uploadImage.js";
import deleteImage from "../utils/deleteImage.js";
import * as billingService from "./billingService.js";
import { SERVICE_CATEGORIES } from "../constants/domain.js";

/** Returns all lab tests from the database.
 * @returns {Promise<object[]>}
 */
export const getLabTests = async () => {
  return db.select().from(labTests);
};

/** Returns all lab tests for a patient with patient name and hospital number.
 * @param {number} patientId
 * @returns {Promise<object[]>}
 */
export const getLabTestsByPatientId = async (patientId) => {
  return db
    .select({
      ...labTests,
      first_name: patients.firstName,
      surname: patients.surname,
      hospital_number: patients.hospitalNumber,
    })
    .from(labTests)
    .innerJoin(patients, eq(patients.patientId, labTests.patientId))
    .where(eq(labTests.patientId, patientId))
    .orderBy(desc(labTests.createdAt));
};

/** Fetches one lab test by ID.
 * @param {number} id
 * @returns {Promise<object>}
 */
export const getLabTestById = async (id) => {
  return db
    .select()
    .from(labTests)
    .where(eq(labTests.id, id))
    .then(res => res[0]);
};

/**
 * Creates a lab test with status `"to do"` and auto-bills if an `admissionId` or `visitId` is provided.
 * @param {object} labTest
 * @returns {Promise<object>} The new lab test enriched with patient name
 */
export const createLabTest = async (labTest) => {
  const [newTest] = await db.insert(labTests).values({
    patientId: labTest.patientId,
    testType: labTest.testType,
    comments: labTest.comments,
    prescribedBy: labTest.prescribedBy,
    status: 'to do',
  }).returning();

  // get patient details for notification
  const patient = await db.select({
    first_name: patients.firstName,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patientId, labTest.patientId));

  // ── Auto-billing: add a bill item for this lab test ──────────────────────
  if (labTest.admissionId || labTest.visitId) {
    try {
      const labPrice = await billingService.getServicePrice("Lab Test");
      await billingService.addItem({
        admissionId: labTest.admissionId ? Number(labTest.admissionId) : null,
        visitId: labTest.visitId ? Number(labTest.visitId) : null,
        description: `Lab Test: ${labTest.testType}`,
        category: SERVICE_CATEGORIES.LAB,
        quantity: 1,
        unitPrice: labTest.unitPrice ? Number(labTest.unitPrice) : labPrice,
        billingType: "credit",
        createdBy: labTest.createdBy || null,
      });
    } catch (billingErr) {
      // Non-fatal: billing failure should not block lab test creation
      console.error("Billing error (lab test):", billingErr.message);
    }
  }

  return {
    ...newTest,
    first_name: patient[0].first_name,
    surname: patient[0].surname,
  };
};

/**
 * Updates status, results, comments, and optionally replaces Cloudinary images for a lab test.
 * @param {number} id
 * @param {object} formRequest
 * @param {object[]} [files=[]] - Uploaded files (Cloudinary handles storage)
 * @returns {Promise<object>} The updated lab test enriched with patient name
 */
export const updateLabTest = async (id, formRequest, files = []) => {
  // Get the existing lab test

  if (!formRequest.status || !formRequest.results) {
    throw new Error('Status and results are required');
  }

  const existingLabTest = await db
    .select()
    .from(labTests)
    .where(eq(labTests.id, id))
    .then(res => res[0]);

  if (!existingLabTest) {
    throw new Error('Lab test not found');
  }

  let imageUrls = existingLabTest.images || [];

  // Handle image upload if user uploaded new images
  if (files && files.length > 0) {
    // If images already exist in db, delete them from cloudinary
    if (imageUrls.length > 0) {
      for (const imageUrl of imageUrls) {
        try {
          await deleteImage(imageUrl);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
    }

    // Upload new images to cloudinary and store in array
    imageUrls = [];
    for (const file of files) {
      try {
        const uploadedUrl = await uploadToCloudinary(file.buffer, 'lab-test-docs');
        imageUrls.push(uploadedUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image');
      }
    }
  }

  // Update lab test in db
  const updateData = {
    status: formRequest.status,
    results: formRequest.results,
    images: imageUrls,
    updatedAt: new Date()
  };

  const [updated] = await db.update(labTests)
    .set(updateData)
    .where(eq(labTests.id, id))
    .returning();

  // Get patient details for response
  const patient = await db.select({
    first_name: patients.firstName,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patientId, updated.patientId));

  return {
    ...updated,
    first_name: patient[0].first_name,
    surname: patient[0].surname,
  };
};


/** Deletes a lab test by ID and removes associated Cloudinary images.
 * @param {number} id
 * @returns {Promise<object>} The deleted lab test row
 */
export const deleteLabTest = async (id) => {
  const existingLabTest = await db
    .select()
    .from(labTests)
    .where(eq(labTests.id, id))
    .then(res => res[0]);

  for (const imageUrl of existingLabTest.images || []) {
    try {
      await deleteImage(imageUrl);
    } catch (error) {
      console.error('Error deleting old image:', error);
    }
  }

  const [deleted] = await db.delete(labTests)
    .where(eq(labTests.id, id))
    .returning();

  return deleted;
};





/**
 * Returns filtered, paginated lab tests joined with patient data.
 * @param {number} [page=1]
 * @param {number} [pageSize=10]
 * @param {{ firstName?: string, surname?: string, hospitalNumber?: string, testType?: string, status?: string, startDate?: string, endDate?: string }} [filters={}]
 * @returns {Promise<{ data: object[], totalItems: number, totalPages: number, currentPage: number, pageSize: number, skipped: number }>}
 */
export const getPaginatedLabTests = async (
  page = 1,
  pageSize = 10,
  { firstName, surname, hospitalNumber, testType, status, startDate, endDate } = {}
) => {
  const pageNumber = Number(page);
  const pageSizeNumber = Number(pageSize);
  const offset = (pageNumber - 1) * pageSizeNumber;

  const normalize = (val) =>
    typeof val === "string" && val.trim() !== "" && val !== "undefined" ? val.trim() : null;

  const filters = [];

  if (normalize(firstName)) {
    filters.push(ilike(patients.firstName, `%${normalize(firstName)}%`));
  }
  if (normalize(surname)) {
    filters.push(ilike(patients.surname, `%${normalize(surname)}%`));
  }
  if (normalize(hospitalNumber)) {
    filters.push(ilike(patients.hospitalNumber, `%${normalize(hospitalNumber)}%`));
  }
  if (normalize(testType)) {
    filters.push(ilike(labTests.testType, `%${normalize(testType)}%`));
  }
  if (normalize(status)) {
    filters.push(ilike(labTests.status, `%${normalize(status)}%`));
  }
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start) && !isNaN(end)) {
      filters.push(between(labTests.createdAt, start, end));
    }
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(labTests)
    .innerJoin(patients, eq(labTests.patientId, patients.patientId))
    .where(where ?? sql`true`);

  const totalItems = Number(total);
  const totalPages = Math.ceil(totalItems / pageSizeNumber);

  const rows = await db
    .select({
      lab_test_id: labTests.id,
      patient_id: labTests.patientId,
      test_type: labTests.testType,
      status: labTests.status,
      results: labTests.results,
      comments: labTests.comments,
      prescribed_by: labTests.prescribedBy,
      created_at: labTests.createdAt,
      updated_at: labTests.updatedAt,
      first_name: patients.firstName,
      surname: patients.surname,
      hospital_number: patients.hospitalNumber,
      images: labTests.images
    })
    .from(labTests)
    .innerJoin(patients, eq(labTests.patientId, patients.patientId))
    .where(where ?? sql`true`)
    .orderBy(desc(labTests.createdAt))
    .limit(pageSizeNumber)
    .offset(offset);

  const labTestData = rows.map((row) => ({
    ...row,
    patient_full_name: `${row.first_name ?? ""} ${row.surname ?? ""}`.trim(),
  }));

  return {
    data: labTestData,
    totalItems,
    totalPages,
    currentPage: page,
    pageSize,
    skipped: offset,
  };
};





// Lab Test Types
// ─── In-memory cache ────────────────────────────────────────────────────────
let labTestTypesCache = null;
/** Clears the in-memory lab test types cache, forcing the next call to re-query the database. */
export const invalidateLabTestTypesCache = () => { labTestTypesCache = null; };
// ────────────────────────────────────────────────────────────────────────────

/** Returns all lab test types (in-memory cached).
 * @returns {Promise<object[]>}
 */
export const getLabTestTypes = async () => {
  if (labTestTypesCache) return labTestTypesCache;
  const result = await db.select().from(labTestTypes);
  labTestTypesCache = result;
  return result;
};

/** Inserts a new lab test type and invalidates the types cache.
 * @param {object} labTestType
 * @returns {Promise<object>}
 */
export const createLabTestType = async (labTestType) => {
  const [newType] = await db.insert(labTestTypes).values(labTestType).returning();
  invalidateLabTestTypesCache();
  return newType;
};

/** Updates a lab test type by ID and invalidates the types cache.
 * @param {number} id
 * @param {object} labTestType
 * @returns {Promise<object>}
 */
export const updateLabTestType = async (id, labTestType) => {
  const [updated] = await db.update(labTestTypes)
    .set(labTestType)
    .where(eq(labTestTypes.id, id))
    .returning();

  invalidateLabTestTypesCache();
  return updated;
};

/** Deletes a lab test type by ID and invalidates the types cache.
 * @param {number} id
 * @returns {Promise<object>}
 */
export const deleteLabTestType = async (id) => {
  const [deleted] = await db.delete(labTestTypes)
    .where(eq(labTestTypes.id, id))
    .returning();

  invalidateLabTestTypesCache();
  return deleted;
};
