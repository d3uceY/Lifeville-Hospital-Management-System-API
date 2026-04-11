import cron from "node-cron";
import { db } from "../../drizzle-db.js";
import { notifications } from "../../drizzle/migrations/schema.js";
import { sql } from "drizzle-orm";

// ─── Config ────────────────────────────────────────────────────────────────────

/**
 * Runs once a day at midnight.
 */
const CRON_SCHEDULE = "0 0 * * *";

const RETENTION_WEEKS = 3;

// ─── Job handler ───────────────────────────────────────────────────────────────

async function runNotificationCleanupJob() {
    // notificationReads rows are automatically cascade-deleted via FK
    const deleted = await db
        .delete(notifications)

        .where(sql`${notifications.createdAt} < (NOW() AT TIME ZONE 'Africa/Lagos') - INTERVAL '${sql.raw(String(RETENTION_WEEKS * 7))} days'`)
        .returning({ id: notifications.id });

    console.log(
        `[Notification Cleanup] Deleted ${deleted.length} notification(s) older than ${RETENTION_WEEKS} weeks`
    );
}

// ─── Scheduler ─────────────────────────────────────────────────────────────────

/**
 * Registers the notification cleanup cron job.
 * Call once at server startup.
 */
export function scheduleNotificationCleanup() {
    cron.schedule(CRON_SCHEDULE, async () => {
        try {
            await runNotificationCleanupJob();
        } catch (err) {
            console.error("[Notification Cleanup Job] Unexpected error:", err);
        }
    });

    console.log(`[Jobs] Notification cleanup scheduled — runs: "${CRON_SCHEDULE}", retention: ${RETENTION_WEEKS} weeks`);
}
