import { db } from "../../drizzle-db.js";
import { labTests, labTestTypes, patients } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql } from "drizzle-orm";

export const getLabTests = async () => {
  return db.select().from(labTests);
};

export const getLabTestsByPatientId = async (patientId) => {
  return db
    .select({
      ...labTests,
      first_name: patients.first_name,
      surname: patients.surname,
      hospital_number: patients.hospital_number,
    })
    .from(labTests)
    .innerJoin(patients, eq(patients.patient_id, labTests.patient_id))
    .where(eq(labTests.patient_id, patientId))
    .orderBy(desc(labTests.created_at));
};

export const getLabTestById = async (id) => {
  return db
    .select()
    .from(labTests)
    .where(eq(labTests.id, id))
    .then(res => res[0]);
};

export const createLabTest = async (labTest) => {
  const [newTest] = await db.insert(labTests).values({
    patient_id: labTest.patientId,
    test_type: labTest.testType,
    comments: labTest.comments,
    prescribed_by: labTest.prescribedBy,
    status: 'to do',
  }).returning();

  // get patient details for notification
  const patient = await db.select({
    first_name: patients.first_name,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patient_id, labTest.patientId));

  return {
    ...newTest,
    first_name: patient[0].first_name,
    surname: patient[0].surname,
  };
};



export const updateLabTest = async (id, formRequest) => {
  return console.log(id, formRequest.body, formRequest.file);
  const [updated] = await db.update(labTests)
    .set({ status, results, updated_at: new Date() })
    .where(eq(labTests.id, id))
    .returning();

  const patient = await db.select({
    first_name: patients.first_name,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patient_id, updated.patient_id));

  return {
    ...updated,
    first_name: patient[0].first_name,
    surname: patient[0].surname,
  };
};


export const deleteLabTest = async (id) => {
  const [deleted] = await db.delete(labTests)
    .where(eq(labTests.id, id))
    .returning();

  return deleted;
};





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
    filters.push(ilike(patients.first_name, `%${normalize(firstName)}%`));
  }
  if (normalize(surname)) {
    filters.push(ilike(patients.surname, `%${normalize(surname)}%`));
  }
  if (normalize(hospitalNumber)) {
    filters.push(ilike(patients.hospital_number, `%${normalize(hospitalNumber)}%`));
  }
  if (normalize(testType)) {
    filters.push(ilike(labTests.test_type, `%${normalize(testType)}%`));
  }
  if (normalize(status)) {
    filters.push(ilike(labTests.status, `%${normalize(status)}%`));
  }
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (!isNaN(start) && !isNaN(end)) {
      filters.push(between(labTests.created_at, start, end));
    }
  }

  const where = filters.length > 0 ? and(...filters) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(labTests)
    .innerJoin(patients, eq(labTests.patient_id, patients.patient_id))
    .where(where ?? sql`true`);

  const totalItems = Number(total);
  const totalPages = Math.ceil(totalItems / pageSizeNumber);

  const rows = await db
    .select({
      lab_test_id: labTests.id,
      patient_id: labTests.patient_id,
      test_type: labTests.test_type,
      status: labTests.status,
      results: labTests.results,
      comments: labTests.comments,
      prescribed_by: labTests.prescribed_by,
      created_at: labTests.created_at,
      updated_at: labTests.updated_at,
      first_name: patients.first_name,
      surname: patients.surname,
      hospital_number: patients.hospital_number,
    })
    .from(labTests)
    .innerJoin(patients, eq(labTests.patient_id, patients.patient_id))
    .where(where ?? sql`true`)
    .orderBy(desc(labTests.created_at))
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
export const getLabTestTypes = async () => db.select().from(labTestTypes);

export const createLabTestType = async (labTestType) => {
  const [newType] = await db.insert(labTestTypes).values(labTestType).returning();
  return newType;
};

export const updateLabTestType = async (id, labTestType) => {
  const [updated] = await db.update(labTestTypes)
    .set(labTestType)
    .where(eq(labTestTypes.id, id))
    .returning();

  return updated;
};

export const deleteLabTestType = async (id) => {
  const [deleted] = await db.delete(labTestTypes)
    .where(eq(labTestTypes.id, id))
    .returning();

  return deleted;
};
