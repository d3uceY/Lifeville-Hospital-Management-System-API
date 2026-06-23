import { db } from "../../drizzle-db.js";
import { activityLogs } from "../../drizzle/migrations/schema.js";
import { ACTIVITY_TYPE_VALUES } from "../constants/activityTypes.js";

const FLUSH_INTERVAL_MS = 10_000; // 10s

const queue = [];
let flushTimer = null;

async function flush() {
    clearTimeout(flushTimer);
    flushTimer = null;

    if (!queue.length) return;

    const batch = queue.splice(0, queue.length);
    try {
        await db.insert(activityLogs).values(batch);
    } catch (err) {
        console.error("[activityQueue] Flush failed:", err, "Dropped entries:", batch.length);
    }
}

function scheduleFlush() {
    if (flushTimer) return;
    flushTimer = setTimeout(flush, FLUSH_INTERVAL_MS);
}

process.on("SIGTERM", flush);
process.on("SIGINT", flush);

/**
 * Enqueues a single activity log entry for batched persistence.
 *
 * @param {{ activityType: string, userId?: number|null, metadata?: object }} params
 */
export function logActivity({ activityType, userId = null, metadata = {} }) {
    if (!ACTIVITY_TYPE_VALUES.has(activityType)) {
        console.warn(`[activityLog] Unknown activity type: "${activityType}"`);
    }

    queue.push({
        activityType,
        userId: userId ?? null,
        metadata: metadata ?? {},
    });

    scheduleFlush();
}

/**
 * Retrieves paginated activity logs.
 *
 * @param {{ page?: number, pageSize?: number, userId?: number, activityType?: string }} options
 */
export async function getActivityLogs({ page = 1, pageSize = 50, userId, activityType } = {}) {
    const { sql, and, eq, desc } = await import("drizzle-orm");

    const conditions = [];
    if (userId != null) conditions.push(eq(activityLogs.userId, userId));
    if (activityType) conditions.push(eq(activityLogs.activityType, activityType));

    const offset = (page - 1) * pageSize;

    const rows = await db
        .select()
        .from(activityLogs)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(activityLogs.createdAt))
        .limit(pageSize)
        .offset(offset);

    return rows;
}
