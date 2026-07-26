import { db } from "../../drizzle-db.js";
import { labTests, labTestFiles, mediaContent, patients, patientVisits } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql, and, between, isNull, inArray } from "drizzle-orm";
import * as storageService from "./storageService.js";
import * as billingService from "./billingService.js";
import { SERVICE_CATEGORIES, UPLOAD_SUBFOLDERS } from "../constants/domain.js";
import { getAllSettings } from "./settingsService.js";
import { getOrCreateVisit } from "../utils/visitGuard.js";

// ─── File resolution helper ───────────────────────────────────────────────────

/**
 * Queries the lab_test_files junction + media_content for a lab test,
 * resolves all stored keys to presigned download URLs.
 * @param {number} labTestId
 * @returns {Promise<Array<{url: string, mediaContentId: number}>>}
 */
async function resolveFiles(labTestId) {
  const rows = await db
    .select({ key: mediaContent.key, mediaContentId: mediaContent.id, contentType: mediaContent.contentType })
    .from(labTestFiles)
    .innerJoin(mediaContent, eq(labTestFiles.mediaContentId, mediaContent.id))
    .where(eq(labTestFiles.labTestId, labTestId));

  const files = await Promise.all(
    rows.map(async r => ({
      url: await storageService.generateDownloadUrl(r.key).catch(() => null),
      mediaContentId: r.mediaContentId,
      contentType: r.contentType,
    }))
  );
  return files.filter(f => f.url);
}

/** Attaches `files` (presigned URLs + IDs) to a single lab test result object. */
async function attachFiles(row) {
  if (!row) return row;
  const id = row.id ?? row.lab_test_id;
  if (!id) return row;
  return { ...row, files: await resolveFiles(id) };
}

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
  const rows = await db
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
  return rows;
};

/** Fetches one lab test by ID.
 * @param {number} id
 * @returns {Promise<object>}
 */
export const getLabTestById = async (id) => {
  const row = await db
    .select()
    .from(labTests)
    .where(eq(labTests.id, id))
    .then(res => res[0]);
  return attachFiles(row);
};

/**
 * Creates a lab test with status `"to do"` and auto-bills if an `admissionId` or `visitId` is provided.
 * @param {object} labTest
 * @returns {Promise<object>} The new lab test enriched with patient name
 */
export const createLabTest = async (labTest) => {
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
    } catch (billingErr) {
      // Non-fatal: billing failure should not block lab test creation
      console.error("Billing error (lab test):", billingErr.message);
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
 * Updates status, results, comments, and optionally replaces attached files for a lab test.
 * New files are uploaded to R2, stored in media_content, and linked via lab_test_files.
 * Old files are deleted from R2 and their media_content rows are removed (cascade).
 * @param {number} id
 * @param {object} formRequest
 * @param {object[]} [files=[]] - Uploaded files (multer buffers)
 * @returns {Promise<object>} The updated lab test enriched with patient name
 */
export const updateLabTest = async (id, formRequest, files = []) => {
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

  // Handle file upload if user uploaded new files
  if (files && files.length > 0) {
    const settings = await getAllSettings();
    const baseFolder = settings?.storage?.folder_name;
    const uploadFolder = baseFolder ? `${baseFolder}/${UPLOAD_SUBFOLDERS.LAB_DOCS}` : UPLOAD_SUBFOLDERS.LAB_DOCS;

    for (const file of files) {
      try {
        const objectKey = storageService.buildObjectKey(uploadFolder, file.mimetype);
        await storageService.uploadObject(file.buffer, objectKey, storageService.UPLOAD_PRESETS.LAB_DOC, file.mimetype);
        const [mc] = await db.insert(mediaContent)
          .values({ key: objectKey, contentType: file.mimetype, type: 'cloud' })
          .returning();
        await db.insert(labTestFiles).values({ labTestId: id, mediaContentId: mc.id });
      } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('Failed to upload file');
      }
    }
  }

  // Update lab test in db
  const updateData = {
    status: formRequest.status,
    results: formRequest.results,
    updatedAt: new Date()
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
          } catch (err) {
            console.error(`Billing error for test type "${typeName}":`, err.message);
          }
        }
      }
    } catch (billingErr) {
      console.error("Billing error (lab test update):", billingErr.message);
    }
  }

  // Get patient details for response
  const patient = await db.select({
    first_name: patients.firstName,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patientId, updated.patientId));

  const result = {
    ...updated,
    first_name: patient[0].first_name,
    surname: patient[0].surname,
  };
  return attachFiles(result);
};


/** Deletes a lab test by ID and removes associated R2 files + media_content rows.
 * Junction rows are cascade-deleted; we clean up R2 objects first.
 * @param {number} id
 * @returns {Promise<object>} The deleted lab test row
 */
export const deleteLabTest = async (id) => {
  const existingLabTest = await db
    .select()
    .from(labTests)
    .where(eq(labTests.id, id))
    .then(res => res[0]);

  // Delete R2 objects before removing DB rows
  const oldFiles = await db
    .select({ key: mediaContent.key, mediaId: mediaContent.id })
    .from(labTestFiles)
    .innerJoin(mediaContent, eq(labTestFiles.mediaContentId, mediaContent.id))
    .where(eq(labTestFiles.labTestId, id));

  for (const f of oldFiles) {
    try { await storageService.deleteObject(f.key); } catch (e) { console.error('Error deleting file:', e); }
  }

  const [deleted] = await db.delete(labTests)
    .where(eq(labTests.id, id))
    .returning();

  // Clean up orphaned media_content rows (junction rows cascade-delete with labTests)
  if (oldFiles.length > 0) {
    await db.delete(mediaContent).where(inArray(mediaContent.id, oldFiles.map(f => f.mediaId)));
  }

  return deleted;
};





/** Deletes a single file attachment from a lab test (R2 object + junction + media_content).
 * @param {number} labTestId
 * @param {number} mediaContentId
 * @returns {Promise<void>}
 */
export const deleteLabTestFile = async (labTestId, mediaContentId) => {
  const [file] = await db
    .select({ key: mediaContent.key })
    .from(labTestFiles)
    .innerJoin(mediaContent, eq(labTestFiles.mediaContentId, mediaContent.id))
    .where(and(
      eq(labTestFiles.labTestId, labTestId),
      eq(labTestFiles.mediaContentId, mediaContentId),
    ));

  if (!file) throw new Error('File not found');

  try { await storageService.deleteObject(file.key); } catch (e) { console.error('Error deleting R2 object:', e); }
  await db.delete(labTestFiles).where(and(
    eq(labTestFiles.labTestId, labTestId),
    eq(labTestFiles.mediaContentId, mediaContentId),
  ));
  await db.delete(mediaContent).where(eq(mediaContent.id, mediaContentId));
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
export const createLabTestType = async ({ name }) => {
  return billingService.upsertService({ name, category: 'lab', price: 0, isVariablePrice: true });
};

/** Updates a lab test type (name) by its service ID. */
export const updateLabTestType = async (id, { name }) => {
  return billingService.upsertService({ id: Number(id), name, category: 'lab', price: 0, isVariablePrice: true });
};

/** Deletes a lab test type by its service ID. */
export const deleteLabTestType = async (id) => {
  return billingService.deleteService(Number(id));
};
