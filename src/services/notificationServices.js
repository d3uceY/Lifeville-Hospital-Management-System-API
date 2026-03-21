import { db } from "../../drizzle-db.js";
import { users, notifications as notificationsTable, notificationReads } from "../../drizzle/migrations/schema.js";
import { eq, ilike, desc, asc, count, or, sql, and, isNull, gte } from "drizzle-orm";
import { timeAgo } from "../utils/getTimeAgo.js";

// ─── Shared WHERE condition for a user's notifications ──────────────────────
// Matches: direct recipient OR user's role string is in the recipient_roles array
function userNotificationWhere(userId, role, userCreatedAt) {
    return and(
        gte(notificationsTable.createdAt, userCreatedAt),
        or(
            eq(notificationsTable.recipientId, userId),
            sql`${role} = ANY(${notificationsTable.recipientRoles})`
        )
    );
}

export const getNotificationsByUserData = async (userData) => {
    const { role, id: userId, userCreatedAt } = userData;

    const notificationsList = await db.select(
        {
            ...notificationsTable,
            is_read: sql`CASE WHEN ${notificationReads.id} IS NULL THEN false ELSE true END`,
        }
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
        time: timeAgo(notification.createdAt),
    }));
}


export const getUnreadNotifications = async (userData) => {
    const { role, id: userId, userCreatedAt } = userData;
    const where = userNotificationWhere(userId, role, userCreatedAt);

    const unreadNotifications = await db
        .select({
            ...notificationsTable,
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
                time: timeAgo(notification.createdAt),
            })),
        totalUnread: Number(totalUnread.count),
    };
};



export const getPaginatedNotificationsByUserData = async (
    userData,
    page = 1,
    pageSize = 10
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
            time: timeAgo(notification.createdAt),
        })),
        totalItems: Number(totalItems.count),
        totalPages: Math.ceil(Number(totalItems.count) / pageSizeNumber),
        currentPage: pageNumber,
        pageSize: pageSizeNumber,
        skipped: offset,
    };
};

export const markNotificationAsRead = async (notificationId, userData) => {
    const { id } = userData;
    await db.insert(notificationReads)
        .values({
            notificationId: notificationId,
            userId: id,
            readAt: new Date(),
        })
}

/**
 * addNotification
 * Creates ONE notification row that targets multiple roles.
 *
 * @param {{ recipientRoles: string[], type: string, title: string, message: string, data?: object, recipientId?: number }} opts
 */
export const addNotification = async ({ recipientRoles, type, title, message, data, recipientId = null }) => {
    try {
        await db.insert(notificationsTable).values({
            recipientRoles: recipientRoles ?? [],
            recipientId,
            type,
            title,
            message,
            data: data ?? null,
            createdAt: new Date(),
        });
    } catch (error) {
        console.error("addNotification error:", error);
    }
}