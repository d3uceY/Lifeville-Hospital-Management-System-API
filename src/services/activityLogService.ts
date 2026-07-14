import { db } from "../../drizzle-db.js";
import { activityLogs } from "../../drizzle/migrations/schema.js";
import { ACTIVITY_TYPE_VALUES } from "../constants/activityTypes.js";
import type { ActivityLogEntry, ActivityLogOptions } from "../types/common.js";

const FLUSH_INTERVAL_MS = 10_000; // 10s

const queue: ActivityLogEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
    if (flushTimer) clearTimeout(flushTimer);
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
export function logActivity({ activityType, userId = null, metadata = {} }: { activityType: string; userId?: number | null; metadata?: Record<string, unknown> }): void {
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
 * Retrieves paginated activity logs joined with user info.
 *
 * @param {{ page?: number, pageSize?: number, userId?: number, activityType?: string, startDate?: string, endDate?: string }} options
 */
export async function getActivityLogs({ page = 1, pageSize = 25, userId, activityType, startDate, endDate }: ActivityLogOptions = {}) {
    const { sql, and, eq, desc, gte, lte } = await import("drizzle-orm");
    const { users } = await import("../../drizzle/migrations/schema.js");

    const conditions = [];
    if (userId != null) conditions.push(eq(activityLogs.userId, userId));
    if (activityType) conditions.push(eq(activityLogs.activityType, activityType));
    if (startDate) conditions.push(gte(activityLogs.createdAt, startDate));
    if (endDate) conditions.push(lte(activityLogs.createdAt, `${endDate} 23:59:59`));

    const offset = (page - 1) * pageSize;
    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, countRows] = await Promise.all([
        db
            .select({
                id: activityLogs.id,
                activityType: activityLogs.activityType,
                userId: activityLogs.userId,
                metadata: activityLogs.metadata,
                createdAt: activityLogs.createdAt,
                userName: users.name,
                userEmail: users.email,
                userRole: users.role,
            })
            .from(activityLogs)
            .leftJoin(users, eq(activityLogs.userId, users.id))
            .where(where)
            .orderBy(desc(activityLogs.createdAt))
            .limit(pageSize)
            .offset(offset),
        db
            .select({ value: sql`cast(count(*) as int)` })
            .from(activityLogs)
            .where(where),
    ]);

    const total = Number(countRows[0]?.value ?? 0);

    return {
        data: rows,
        totalItems: total,
        totalPages: Math.ceil(total / pageSize),
        page,
        pageSize,
    };
}
