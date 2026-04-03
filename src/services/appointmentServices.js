// import query connection
import { db } from "../../drizzle-db.js";
import { appointments, patients, users } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql } from "drizzle-orm";


/**
 * Returns paginated appointments joined with patient and doctor info, with optional text search.
 * @param {number} [page=1]
 * @param {number} [pageSize=10]
 * @param {string} [searchTerm=""]
 * @returns {Promise<{ data: object[], totalItems: number, totalPages: number, currentPage: number, pageSize: number, skipped: number }>}
 */
export const getPaginatedAppointments = async (
  page = 1,
  pageSize = 10,
  searchTerm = ""
) => {

  try {
    const pageNumber = Number(page);
    const pageSizeNumber = Number(pageSize);
    const offset = (pageNumber - 1) * pageSizeNumber;
    const q = searchTerm.trim();
    const term = `%${q}%`;

    // 1. Build the base query for fetching the paginated data
    let dataQuery = db
      .select({
        ...appointments, // selects all columns from appointments
        patient_first_name: patients.firstName,
        patient_surname: patients.surname,
        hospital_number: patients.hospitalNumber,
        patient_phone_number: patients.phoneNumber,
        doctor_name: users.name,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.patientId))
      .leftJoin(users, eq(appointments.doctorId, users.id));

    // 2. Build the base query for counting the total items
    let countQuery = db
      .select({ count: sql`count(*)` })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.patientId))
      .leftJoin(users, eq(appointments.doctorId, users.id));

    // 3. Apply the search filter to BOTH queries if a search term exists
    if (q) {
      const whereClause = or(
        ilike(patients.firstName, term),
        ilike(patients.surname, term),
        ilike(patients.hospitalNumber, term),
        ilike(users.name, term), // Search by doctor's name
        ilike(appointments.status, term) // Search by appointment status
      );
      dataQuery.where(whereClause);
      countQuery.where(whereClause);
    }

    // 4. Execute both queries
    const data = await dataQuery
      .orderBy(desc(appointments.createdAt))
      .limit(pageSizeNumber)
      .offset(offset);

    const totalCountResult = await countQuery;
    const totalItems = Number(totalCountResult[0].count);

    // 5. Calculate total pages
    const totalPages = Math.ceil(totalItems / pageSize);

    // 6. Return the data in the specified structured format
    return {
      data,
      totalItems,
      totalPages,
      currentPage: pageNumber,
      pageSize: pageSizeNumber,
      skipped: offset,
    };
  } catch (error) {
    console.error("Error fetching paginated appointments:", error);
    // Return a default structure on error to prevent frontend crashes
    return {
      data: [],
      totalItems: 0,
      totalPages: 0,
      currentPage: page,
      pageSize,
      skipped: offset,
    };
  }
};


/** Returns all appointments for a patient with doctor name, ordered by newest first.
 * @param {number} patientId
 * @returns {Promise<object[]>}
 */
export const getAppointmentsByPatientId = async (patientId) => {
  try {
    const rows = await db
      .select({
        ...appointments, // selects all columns from appointments
        patient_first_name: patients.firstName,
        patient_surname: patients.surname,
        hospital_number: patients.hospitalNumber,
        patient_phone_number: patients.phoneNumber,
        doctor_name: users.name,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.patientId))
      .innerJoin(users, eq(appointments.doctorId, users.id))
      .where(eq(appointments.patientId, patientId))
      .orderBy(desc(appointments.createdAt));
    return rows;
  } catch (error) {
    console.error(error);
    return null;
  }
};



// View a specific appointment
/** Fetches a single appointment by ID.
 * @param {number} appointmentId
 * @returns {Promise<object>}
 */
export const viewAppointment = async (appointmentId) => {
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.appointmentId, appointmentId));
  return rows[0];
};

// Create a new appointment
/** Inserts a new appointment with status `"scheduled"` and returns the row enriched with patient and doctor names.
 * @param {object} appointmentData
 * @returns {Promise<object>}
 */
export const createAppointment = async (appointmentData) => {
  const { patientId, doctorId, appointmentDate, notes } = appointmentData;

  const rows = await db.insert(appointments).values({
    patientId: patientId,
    doctorId: doctorId,
    appointmentDate: appointmentDate,
    notes,
    status: "scheduled",
  }).returning();

  const patient = await db.select({
    first_name: patients.firstName,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patientId, rows[0].patientId));

  const doctor = await db.select({
    name: users.name,
  }).from(users).where(eq(users.id, rows[0].doctorId));

  return {
    ...rows[0],
    first_name: patient[0].first_name,
    surname: patient[0].surname,
    doctor_name: doctor[0].name,
  };
};

// Update an existing appointment
/** Updates all mutable fields of an appointment and returns the updated row enriched with patient name.
 * @param {number} appointment_id
 * @param {object} appointmentData
 * @returns {Promise<object>}
 */
export const updateAppointment = async (appointment_id, appointmentData) => {
  const { appointmentDate, notes } = appointmentData;

  const rows = await db.update(appointments)
    .set({
      appointmentDate: appointmentDate,
      notes,
      updatedAt: new Date(),
    })
    .where(eq(appointments.appointmentId, appointment_id))
    .returning();

  const patient = await db.select({
    first_name: patients.firstName,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patientId, rows[0].patientId));

  return {
    ...rows[0],
    first_name: patient[0].first_name,
    surname: patient[0].surname,
  };
};

/** Updates only the status field of an appointment and returns the updated row with patient name.
 * @param {number} appointmentId
 * @param {string} status
 * @returns {Promise<object>}
 */
export const updateAppointmentStatus = async (appointmentId, status) => {
  const rows = await db.update(appointments)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(appointments.appointmentId, appointmentId))
    .returning();

  const patient = await db.select({
    first_name: patients.firstName,
    surname: patients.surname,
  }).from(patients).where(eq(patients.patientId, rows[0].patientId));

  return {
    ...rows[0],
    first_name: patient[0].first_name,
    surname: patient[0].surname,
  };
};


// Delete an appointment
/** Deletes an appointment by ID and returns the deleted row.
 * @param {number} appointmentId
 * @returns {Promise<object>}
 */
export const deleteAppointment = async (appointmentId) => {
  const rows = await db.delete(appointments)
    .where(eq(appointments.appointmentId, appointmentId))
    .returning();

  return rows[0];
};
