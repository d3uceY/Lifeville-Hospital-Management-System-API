import { db } from "../../drizzle-db.js";
import { labTests, patients, patientVisits } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql, and, between, isNull } from "drizzle-orm";
import { uploadToCloudinary } from "../utils/uploadImage.js";
import deleteImage from "../utils/deleteImage.js";
import * as billingService from "./billingService.js";
import { SERVICE_CATEGORIES, UPLOAD_SUBFOLDERS } from "../constants/domain.js";
import { getAllSettings } from "./settingsService.js";
import { getOrCreateVisit } from "../utils/visitGuard.js";

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
export const getLabTestsByPatientId = async (patientId: number) => {
  return db
    .select()
    .from(labTests)
    .innerJoin(patients, eq(patients.patientId, labTests.patientId))
    .where(eq(labTests.patientId, patientId))
    .orderBy(desc(labTests.createdAt));
};

/** Fetches one lab test by ID.
 * @param {number} id
 * @returns {Promise<object>}
 */
export const getLabTestById = async (id: number) => {
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
export const createLabTest = async (labTest: Record<string, unknown>) => {
  // Accept testType as either a string (legacy) or array
  const testTypeArray = Array.isArray(labTest.testType)
    ? labTest.testType
    : [labTest.testType];

  const visit = await getOrCreateVisit(labTest.patientId, labTest.visitInfo ?? null);

  const [newTest] = await db.insert(labTests).values({
    patientId: labTest.patientId,
    testType: testTypeArray,
    comments: labTest.comments,
    prescribedBy: labTest.prescribedBy,
    status: 'to do',
    visitId: visit.id,
  }).returning();

  // get patient details for notification
  const patient = await db.select({
    first_name: patients.firstName,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patientId, labTest.patientId));

  const testTypeLabel = testTypeArray.join(', ');

  // ── Auto-billing: add a bill item for this lab test ──────────────────────
  if (labTest.admissionId || labTest.visitId) {
    try {
      const labPrice = await billingService.getServicePrice("Lab Test");
      await billingService.addItem({
        admissionId: labTest.admissionId ? Number(labTest.admissionId) : null,
        visitId: labTest.visitId ? Number(labTest.visitId) : null,
        description: `Lab Test: ${testTypeLabel}`,
        category: SERVICE_CATEGORIES.LAB,
        quantity: testTypeArray.length,
        unitPrice: labTest.unitPrice ? Number(labTest.unitPrice) : labPrice,
        billingType: "credit",
        createdBy: labTest.createdBy || null,
      });
    } catch (billingErr: unknown) {
      // Non-fatal: billing failure should not block lab test creation
      console.error("Billing error (lab test):", billingErr instanceof Error ? billingErr.message : String(billingErr));
    }
  }

  return {
    ...newTest,
    first_name: patient[0].first_name,
    surname: patient[0].surname,
    test_type_label: testTypeLabel,
  };
};

/**
 * Updates status, results, comments, and optionally replaces Cloudinary images for a lab test.
 * @param {number} id
 * @param {object} formRequest
 * @param {object[]} [files=[]] - Uploaded files (Cloudinary handles storage)
 * @returns {Promise<object>} The updated lab test enriched with patient name
 */
export const updateLabTest = async (id: number, formRequest: Record<string, unknown>, files: Express.Multer.File[] = []) => {
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
    const storageRow = (await getAllSettings()).storage as { folder_name?: string } | null;
    const baseFolder = storageRow?.folder_name;
    const uploadFolder = baseFolder ? `${baseFolder}/${UPLOAD_SUBFOLDERS.LAB_DOCS}` : UPLOAD_SUBFOLDERS.LAB_DOCS;
    for (const file of files) {
      try {
        const uploadedUrl = await uploadToCloudinary(file.buffer, uploadFolder, 'lab-doc');
        imageUrls.push(uploadedUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error('Failed to upload image');
      }
    }
  }

  // Update lab test in db
  const updateData = {
    status: formRequest.status as string,
    results: formRequest.results as string,
    images: imageUrls,
    updatedAt: new Date().toISOString()
  };

  const [updated] = await db.update(labTests)
    .set(updateData)
    .where(eq(labTests.id, id))
    .returning();

  // ── Auto-billing: when test is marked done, bill each test type ──────────
  const DONE_STATUSES = ["done"];
  if (DONE_STATUSES.includes(updated.status) && !DONE_STATUSES.includes(existingLabTest.status)) {
    try {
      const billingContext = await billingService.getPatientBillingContext(updated.patientId);
      const admissionId = billingContext.admissionId;
      const visitId = billingContext.visitId ?? (updated.visitId ? updated.visitId : null);

      if (admissionId || visitId) {
        const testTypes = Array.isArray(updated.testType) ? updated.testType : [updated.testType];
        for (const typeName of testTypes) {
          try {
            const svc = await billingService.getServiceByName(typeName);
            if (svc) {
              await billingService.addItem({
                admissionId: admissionId || null,
                visitId: visitId || null,
                serviceId: svc.id,
                description: `Lab: ${svc.name}`,
                category: SERVICE_CATEGORIES.LAB,
                quantity: 1,
                unitPrice: parseFloat(svc.price),
                billingType: "credit",
              });
            }
          } catch (err: unknown) {
            console.error(`Billing error for test type "${typeName}":`, err instanceof Error ? err.message : String(err));
          }
        }
      }
    } catch (billingErr: unknown) {
      console.error("Billing error (lab test update):", billingErr instanceof Error ? billingErr.message : String(billingErr));
    }
  }

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
export const deleteLabTest = async (id: number) => {
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
  { firstName, surname, hospitalNumber, testType, status, startDate, endDate }: {
    firstName?: string; surname?: string; hospitalNumber?: string;
    testType?: string; status?: string; startDate?: string; endDate?: string;
  } = {}
) => {
  const pageNumber = Number(page);
  const pageSizeNumber = Number(pageSize);
  const offset = (pageNumber - 1) * pageSizeNumber;

  const normalize = (val: unknown): string | null =>
    typeof val === "string" && val.trim() !== "" && val !== "undefined" ? val.trim() : null;

  const filters = [];

  if (normalize(firstName)) {
    filters.push(ilike(patients.firstName, `%${normalize(firstName)}%`));
  }
  if (normalize(surname)) {
    filters.push(ilike(patients.surname, `%${normalize(surname)}%`));
  }
  if (normalize(hospitalNumber)) {
    filters.push(sql`CAST(${patients.hospitalNumber} AS TEXT) ILIKE ${'%' + normalize(hospitalNumber) + '%'}`);
  }
  if (normalize(testType)) {
    filters.push(sql`array_to_string(${labTests.testType}, ',') ILIKE ${'%' + normalize(testType) + '%'}`);
  }
  if (normalize(status)) {
    filters.push(ilike(labTests.status, `%${normalize(status)}%`));
  }
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      filters.push(between(labTests.createdAt, start.toISOString(), end.toISOString()));
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





// ─── Lab Test Types (now stored in services table, category = 'lab') ─────────

/** Returns all lab-category services (replaces the old lab_test_types table). */
export const getLabTestTypes = async () => {
  return billingService.listServices({ category: 'lab' });
};

/** Creates a new lab test type as a services row (category='lab', variable price). */
export const createLabTestType = async ({ name }: { name: string }) => {
  return billingService.upsertService({ name, category: 'lab', price: 0, isVariablePrice: true });
};

/** Updates a lab test type (name) by its service ID. */
export const updateLabTestType = async (id: number | string, { name }: { name: string }) => {
  return billingService.upsertService({ id: Number(id), name, category: 'lab', price: 0, isVariablePrice: true });
};

/** Deletes a lab test type by its service ID. */
export const deleteLabTestType = async (id: number | string) => {
  return billingService.deleteService(Number(id));
};
