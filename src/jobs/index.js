import { scheduleAppointmentReminders } from "./appointmentReminder.js";

/**
 * Registers and starts all background cron jobs.
 * Call once at server startup, after Socket.IO is initialised.
 *
 * @param {import("socket.io").Server} io - Socket.IO server instance (used for real-time pushes)
 */
export function startJobs(io) {
    scheduleAppointmentReminders(io);

    console.log("[Jobs] All background jobs started");
}
