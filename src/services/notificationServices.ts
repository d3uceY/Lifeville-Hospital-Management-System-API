import { db } from "../../drizzle-db.js";
import { users, notifications as notificationsTable, notificationReads } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql, and, isNull, gte } from "drizzle-orm";
import { timeAgo } from "../utils/getTimeAgo.js";

// ─── Shared WHERE condition for a user's notifications ──────────────────────
// Matches: direct recipient OR user's role string is in the recipient_roles array
function userNotificationWhere(userId: number, role: string, userCreatedAt: string | Date) {
    return and(
        gte(notificationsTable.createdAt, String(userCreatedAt)),
        or(
            eq(notificationsTable.recipientId, userId),
            sql`${role} = ANY(${notificationsTable.recipientRoles})`
        )
    );
}

/**
 * Returns the 5 most-recent notifications visible to a user (direct or role-based), with computed
 * read status and a human-readable relative time string.
 * @param {{ id: number, role: string, userCreatedAt: Date }} userData
 * @returns {Promise<object[]>}
 */
export const getNotificationsByUserData = async (userData: { id: number; role: string; userCreatedAt: string | Date }) => {
    const { role, id: userId, userCreatedAt } = userData;

    const notificationsList = await db.select(
        {
            ...(notificationsTable as unknown as Parameters<typeof db.select>[0]),
            is_read: sql`CASE WHEN ${notificationReads.id} IS NULL THEN false ELSE true END`,
        } as Parameters<typeof db.select>[0]
    )
        .from(notificationsTable)
        .leftJoin(
            notificationReads,
            and(
                eq(notificationsTable.id, notificationReads.notificationId),
                eq(notificationReads.userId, userId)
            )
        )
        .where(userNotificationWhere(userId, role, userCreatedAt))
        .orderBy(desc(notificationsTable.createdAt))
        .limit(5);

    return notificationsList.map(notification => ({
        ...notification,
        time: timeAgo((notification as unknown as Record<string, unknown>).createdAt as string),
    }));
}


/**
 * Returns the 5 most-recent **unread** notifications for a user plus a total unread count.
 * @param {{ id: number, role: string, userCreatedAt: Date }} userData
 * @returns {Promise<{ unreadNotifications: object[], totalUnread: number }>}
 */
export const getUnreadNotifications = async (userData: { id: number; role: string; userCreatedAt: string | Date }) => {
    const { role, id: userId, userCreatedAt } = userData;
    const where = userNotificationWhere(userId, role, userCreatedAt);

    const unreadNotifications = await db
        .select({
            ...(notificationsTable as unknown as Parameters<typeof db.select>[0]),
            is_read: sql`CASE WHEN ${notificationReads.id} IS NULL THEN false ELSE true END`,
        } as Parameters<typeof db.select>[0])
        .from(notificationsTable)
        .leftJoin(
            notificationReads,
            and(
                eq(notificationsTable.id, notificationReads.notificationId),
                eq(notificationReads.userId, userId)
            )
        )
        .where(where)
        .orderBy(desc(notificationsTable.createdAt))
        .limit(5);

    const [totalUnread] = await db
        .select({ count: sql`count(*)` })
        .from(notificationsTable)
        .leftJoin(
            notificationReads,
            and(
                eq(notificationsTable.id, notificationReads.notificationId),
                eq(notificationReads.userId, userId)
            )
        )
        .where(and(where, isNull(notificationReads.id)));

    return {
        unreadNotifications: unreadNotifications
            .filter(notification => !notification.is_read)
            .map(notification => ({
                ...notification,
                time: timeAgo((notification as unknown as Record<string, unknown>).createdAt as string),
            })),
        totalUnread: Number(totalUnread.count),
    };
};



/**
 * Returns a paginated list of notifications visible to a user with read status and relative timestamps.
 * @param {{ id: number, role: string, userCreatedAt: Date }} userData
 * @param {number} [page=1]
 * @param {number} [pageSize=10]
 * @returns {Promise<{ data: object[], totalItems: number, totalPages: number, currentPage: number, pageSize: number, skipped: number }>}
 */
export const getPaginatedNotificationsByUserData = async (
    userData: { id: number; role: string; userCreatedAt: string | Date },
    page: number = 1,
    pageSize: number = 10
) => {
    const { role, id: userId, userCreatedAt } = userData;
    const pageNumber = Number(page);
    const pageSizeNumber = Number(pageSize);
    const offset = (pageNumber - 1) * pageSizeNumber;
    const where = userNotificationWhere(userId, role, userCreatedAt);

    const notificationsWithRead = await db
        .select({
            id: notificationsTable.id,
            recipientId: notificationsTable.recipientId,
            recipientRoles: notificationsTable.recipientRoles,
            type: notificationsTable.type,
            title: notificationsTable.title,
            message: notificationsTable.message,
            data: notificationsTable.data,
            createdAt: notificationsTable.createdAt,
            is_read: sql`CASE WHEN ${notificationReads.id} IS NULL THEN false ELSE true END`,
        })
        .from(notificationsTable)
        .leftJoin(
            notificationReads,
            and(
                eq(notificationsTable.id, notificationReads.notificationId),
                eq(notificationReads.userId, userId)
            )
        )
        .where(where)
        .orderBy(desc(notificationsTable.createdAt))
        .limit(pageSizeNumber)
        .offset(offset);

    const [totalItems] = await db
        .select({ count: sql`count(*)` })
        .from(notificationsTable)
        .where(where);

    return {
        data: notificationsWithRead.map(notification => ({
            ...notification,
            time: timeAgo(notification.createdAt as string),
        })),
        totalItems: Number(totalItems.count),
        totalPages: Math.ceil(Number(totalItems.count) / pageSizeNumber),
        currentPage: pageNumber,
        pageSize: pageSizeNumber,
        skipped: offset,
    };
};

/**
 * Inserts a read-receipt row for a notification/user pair, marking it as read for that user.
 * @param {number} notificationId
 * @param {{ id: number }} userData
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId: number, userData: { id: number }) => {
    const { id } = userData;
    await db.insert(notificationReads)
        .values({
            notificationId: notificationId,
            userId: id,
            readAt: new Date() as unknown as string,
        })
}

/**
 * addNotification
 * Creates ONE notification row that targets multiple roles.
 *
 * @param {{ recipientRoles: string[], type: string, title: string, message: string, data?: object, recipientId?: number }} opts
 */
export const addNotification = async ({ recipientRoles, type, title, message, data, recipientId = null }: { recipientRoles?: readonly string[] | string[]; type: string; title?: string; message?: string; data?: Record<string, unknown>; recipientId?: number | null }) => {
    try {
        await db.insert(notificationsTable).values({
            recipientRoles: (recipientRoles ?? []) as string[],
            recipientId,
            type,
            title,
            message,
            data: data ?? null,
            createdAt: new Date() as unknown as string,
        });
    } catch (error) {
        console.error("addNotification error:", error);
    }
}