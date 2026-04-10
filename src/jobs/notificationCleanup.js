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

        // (e.g. 2026-03-19T23:00:00.000Z). PostgreSQL strips the Z and compares it as-is against
        //  TIMESTAMP WITHOUT TIME ZONE values that are stored in WAT. At midnight WAT, 
        // this makes the effective cutoff 2026-03-19 23:00:00 — one hour short — so March 20 
        // afternoon notifications survive and 0 rows are deleted.
        
        .where(sql`${notifications.createdAt} < NOW() - INTERVAL '${sql.raw(String(RETENTION_WEEKS * 7))} days'`)
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
