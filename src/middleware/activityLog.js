import { logActivity } from "../services/activityLogService.js";

/**
 * Attaches an `activityLogger` helper to every request object so controllers
 * can record activity log entries without importing the service themselves.
 *
 * Usage in a controller:
 * ```js
 * req.activityLogger(ACTIVITY_TYPES.LAB_TEST_UPDATED, {
 *   labTestId: labTest.id,
 *   status:    labTest.status,
 * });
 * ```
 *
 * The middleware never throws — a failed log write is only printed to the
 * console so it never breaks the main request flow.
 */
export function activityLogMiddleware(req, _res, next) {
    /**
     * @param {string} activityType - One of the ACTIVITY_TYPES constants
     * @param {object} [metadata]   - Any extra context to store with the log
     * @returns {Promise<void>}
     */
    req.activityLogger = async (activityType, metadata = {}) => {
        try {
            const userId = req.userId ?? null;
            logActivity({ activityType, userId, metadata });
        } catch (err) {
            // Non-fatal: log and continue
            console.error("[activityLog] Failed to write activity log:", err);
        }
    };

    next();
}
