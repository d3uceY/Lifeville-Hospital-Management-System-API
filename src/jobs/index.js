import { scheduleAppointmentReminders } from "./appointmentReminder.js";
import { scheduleNotificationCleanup } from "./notificationCleanup.js";
import { initializeCache } from "../lib/appointmentCache.js";

/**
 * Registers and starts all background cron jobs.
 * Call once at server startup, after Socket.IO is initialised.
 *
 * @param {import("socket.io").Server} io - Socket.IO server instance (used for real-time pushes)
 */
export async function startJobs(io) {
    // Eagerly populate the appointment cache from the DB once at startup.
    // The cron job then reads purely from memory on every tick.
    await initializeCache();

    scheduleAppointmentReminders(io);
    scheduleNotificationCleanup();

    console.log("[Jobs] All background jobs started");
}
