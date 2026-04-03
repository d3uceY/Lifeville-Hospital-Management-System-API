import cron from "node-cron";
import { db } from "../../drizzle-db.js";
import { appointments, patients, users } from "../../drizzle/migrations/schema.js";
import { eq, and, gte, lte, or } from "drizzle-orm";
import { addNotification } from "../services/notificationServices.js";
import { NOTIFICATION_TYPES, priorityLevels } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import { formatDate } from "../utils/formatDate.js";

// ─── Config ────────────────────────────────────────────────────────────────────

/**
 * How often the job runs.
 * "* * * * *"  = every minute  (60 lightweight DB queries/hour — fine for HMS scale)
 * "5 * * * *"  = every 5 minutes  (if you want to reduce the frequency of checks)
 */
const CRON_SCHEDULE = "* * * * *";

/** 
 * The look-ahead window in minutes.
 * Appointments within this many minutes from now will trigger a reminder.
 */
const REMINDER_WINDOW_MINUTES = 30;

/**
 * Map of appointmentId → appointmentDate (ISO string) for appointments already
 * notified this session. Storing the date lets us prune entries once the
 * appointment has passed, keeping memory bounded.
 */
const notifiedIds = new Map();

// ─── Query ─────────────────────────────────────────────────────────────────────

/**
 * Fetches upcoming appointments that fall within the reminder window and
 * whose status is 'scheduled' or 'confirmed'.
 */
async function getUpcomingAppointments() {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60_000);

    return db
        .select({
            appointmentId: appointments.appointmentId,
            appointmentDate: appointments.appointmentDate,
            status: appointments.status,
            patientId: patients.patientId,
            patientFirstName: patients.firstName,
            patientSurname: patients.surname,
            doctorName: users.name,
        })
        .from(appointments)
        .leftJoin(patients, eq(appointments.patientId, patients.patientId))
        .leftJoin(users, eq(appointments.doctorId, users.id))
        .where(
            and(
                gte(appointments.appointmentDate, now.toISOString()),
                lte(appointments.appointmentDate, windowEnd.toISOString()),
                or(
                    eq(appointments.status, "scheduled"),
                    eq(appointments.status, "confirmed")
                )
            )
        );
}

// ─── Notification sender ───────────────────────────────────────────────────────

/**
 * Persists a notification to the DB and emits a real-time socket event.
 * @param {object} appt  - appointment row from getUpcomingAppointments
 * @param {import("socket.io").Server} io - Socket.IO server instance
 */
async function sendReminder(appt, io) {
    const patientName = `${appt.patientFirstName} ${appt.patientSurname}`;
    const dateLabel = formatDate(appt.appointmentDate);

    await addNotification({
        recipientRoles: NOTIFICATION_ROLES.APPOINTMENT,
        type: NOTIFICATION_TYPES.APPOINTMENT,
        title: "Upcoming Appointment Reminder",
        message: `Appointment with ${patientName} is in ${REMINDER_WINDOW_MINUTES} minutes (${dateLabel})`,
        data: {
            patientId: appt.patientId,
            first_name: appt.patientFirstName,
            surname: appt.patientSurname,
            priority: priorityLevels.high,
        },
    });

    io?.emit("notification", {
        recipientRoles: NOTIFICATION_ROLES.APPOINTMENT,
        message: `Upcoming appointment at ${dateLabel}`,
        description: `Patient: ${patientName}${appt.doctorName ? ` · Dr. ${appt.doctorName}` : ""}`,
    });
}

/**
 * Removes entries from notifiedIds whose appointment time is now in the past.
 * Called at the start of each tick so the map stays small.
 */
function pruneNotifiedIds() {
    const now = new Date();
    for (const [id, appointmentDate] of notifiedIds) {
        if (new Date(appointmentDate) < now) {
            notifiedIds.delete(id);
        }
    }
}

// ─── Job handler ───────────────────────────────────────────────────────────────

/**
 * Core tick function — called on every cron interval.
 * Skips appointments that have already been notified this session.
 * @param {import("socket.io").Server} io
 */
async function runAppointmentReminderJob(io) {
    pruneNotifiedIds();
    const upcoming = await getUpcomingAppointments();

    for (const appt of upcoming) {
        if (notifiedIds.has(appt.appointmentId)) continue;

        await sendReminder(appt, io);
        notifiedIds.set(appt.appointmentId, appt.appointmentDate);

        console.log(
            `[Appointment Reminder] Sent for #${appt.appointmentId} ` +
            `(${appt.patientFirstName} ${appt.patientSurname} @ ${formatDate(appt.appointmentDate)})`
        );
    }
}

// ─── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Registers the appointment reminder cron job.
 * Call this once at server startup, passing the Socket.IO instance.
 * @param {import("socket.io").Server} io
 */
export function scheduleAppointmentReminders(io) {
    cron.schedule(CRON_SCHEDULE, async () => {
        try {
            await runAppointmentReminderJob(io);
        } catch (err) {
            console.error("[Appointment Reminder Job] Unexpected error:", err);
        }
    });

    console.log(`[Jobs] Appointment reminders scheduled — runs: "${CRON_SCHEDULE}", window: ${REMINDER_WINDOW_MINUTES}min`);
}
