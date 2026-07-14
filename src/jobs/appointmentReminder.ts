import cron from "node-cron";
import type { Server } from "socket.io";
import { addNotification } from "../services/notificationServices.js";
import { NOTIFICATION_TYPES, priorityLevels } from "../constants/notification.js";
import { NOTIFICATION_ROLES } from "../constants/domain.js";
import { formatDate } from "../utils/formatDate.js";
import {
    getAppointmentsInWindow,
    pruneAppointmentCache,
} from "../lib/appointmentCache.js";

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
const notifiedIds = new Map<number, string>();

// ─── Cache-backed query ────────────────────────────────────────────────────────

/**
 * Returns upcoming appointments within the reminder window, read purely
 * from the in-process cache. The cache is always pre-populated at startup
 * by startJobs(), so no DB call is ever needed here.
 */
function getUpcomingAppointments() {
    return getAppointmentsInWindow(REMINDER_WINDOW_MINUTES);
}

// ─── Notification sender ───────────────────────────────────────────────────────

/**
 * Persists a notification to the DB and emits a real-time socket event.
 * @param {object} appt  - appointment row from getUpcomingAppointments
 * @param {import("socket.io").Server} io - Socket.IO server instance
 */
import type { CachedAppointment } from "../lib/appointmentCache.js";

async function sendReminder(appt: CachedAppointment, io: Server | null) {
    const patientName = `${appt.patientFirstName} ${appt.patientSurname}`;
    const dateLabel = formatDate(appt.appointmentDate);

    await addNotification({
        recipientRoles: [...NOTIFICATION_ROLES.APPOINTMENT],
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
        recipientRoles: [...NOTIFICATION_ROLES.APPOINTMENT],
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
 * 1. Prunes the shared appointment cache (evicts past entries).
 * 2. Prunes the local notifiedIds map (evicts past entries).
 * 3. Reads the reminder window from the cache (zero DB calls after first tick).
 * 4. Sends notifications for any appointment not yet notified this session.
 * @param {import("socket.io").Server} io
 */
async function runAppointmentReminderJob(io: Server | null) {
    pruneAppointmentCache();
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
export function scheduleAppointmentReminders(io: Server | null) {
    cron.schedule(CRON_SCHEDULE, async () => {
        try {
            await runAppointmentReminderJob(io);
        } catch (err) {
            console.error("[Appointment Reminder Job] Unexpected error:", err);
        }
    });

    console.log(`[Jobs] Appointment reminders scheduled — runs: "${CRON_SCHEDULE}", window: ${REMINDER_WINDOW_MINUTES}min`);
}
