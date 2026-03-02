import { db } from "../../drizzle-db.js";
import { appointments, patients, users, labTests } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql } from "drizzle-orm";

export const getPatientStatusDistribution = async () => {
    const patientData = []

    const admittedCount = await db.select({ count: sql`count(*)` }).from(patients).where(eq(patients.patientType, "INPATIENT"));
    patientData.push({ name: "Admitted", value: Number(admittedCount[0].count), fill:"var(--color-chart-1)" });
    const dischargedCount = await db.select({ count: sql`count(*)` }).from(patients).where(eq(patients.patientType, "OUTPATIENT"));
    patientData.push({ name: "Discharged", value: Number(dischargedCount[0].count), fill:"var(--color-chart-2)" });

    return patientData
}

export const getStaffRolesDistribution = async () => {
    const staffRolesData = []

    const doctorCount = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "doctor"));
    staffRolesData.push({ role: "Doctors", count: Number(doctorCount[0].count), fill:"var(--color-chart-1)" });

    const nurseCount = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "nurse"));
    staffRolesData.push({ role: "Nurses", count: Number(nurseCount[0].count), fill:"var(--color-chart-2)" });

    const receptionistCount = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "receptionist"));
    staffRolesData.push({ role: "Receptionist", count: Number(receptionistCount[0].count), fill:"var(--color-chart-3)" });

    const labTechnicianCount = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "lab"));
    staffRolesData.push({ role: "Lab Technician", count: Number(labTechnicianCount[0].count), fill:"var(--color-chart-4)" });

    const accountantCount = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "accountant"));
    staffRolesData.push({ role: "Accountant", count: Number(accountantCount[0].count), fill:"var(--color-chart-5)" });

    const superadminCount = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "superadmin"));
    staffRolesData.push({ role: "Super Admin", count: Number(superadminCount[0].count), fill:"var(--color-chart-6)" });

    return staffRolesData
}


export const getAppointmentStatusDistribution = async () => {
    const appointmentData = []

    const scheduledCount = await db.select({ count: sql`count(*)` }).from(appointments).where(eq(appointments.status, "scheduled"));
    appointmentData.push({ status: "Scheduled", count: Number(scheduledCount[0].count), fill:"var(--color-chart-1)" });

    const completedCount = await db.select({ count: sql`count(*)` }).from(appointments).where(eq(appointments.status, "completed"));
    appointmentData.push({ status: "Completed", count: Number(completedCount[0].count), fill:"var(--color-chart-2)" });

    const cancelledCount = await db.select({ count: sql`count(*)` }).from(appointments).where(eq(appointments.status, "canceled"));
    appointmentData.push({ status: "Canceled", count: Number(cancelledCount[0].count), fill:"var(--color-chart-3)" });

    const confirmedCount = await db.select({ count: sql`count(*)` }).from(appointments).where(eq(appointments.status, "confirmed"));
    appointmentData.push({ status: "Confirmed", count: Number(confirmedCount[0].count), fill:"var(--color-chart-4)" });

    const pendingCount = await db.select({ count: sql`count(*)` }).from(appointments).where(eq(appointments.status, "pending"));
    appointmentData.push({ status: "Pending", count: Number(pendingCount[0].count), fill:"var(--color-chart-5)" });

    return appointmentData
}

export const getAppointmensToday = async () => {
    const [{ count: todayCount }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(appointments)
        .where(
            sql`${appointments.appointmentDate} >= CURRENT_DATE
        AND ${appointments.appointmentDate} < CURRENT_DATE + INTERVAL '1 day'`
        );

    return todayCount;
}

export const getLabTestPending = async () => {
    const pendingCount = await db.select({ count: sql`count(*)` }).from(labTests).where(eq(labTests.status, "to do"));
    return Number(pendingCount[0].count)
}