/** Parameters accepted by the activity log queue */
export interface ActivityLogParams {
  activityType: string;
  userId?: number | null;
  metadata?: Record<string, unknown>;
}

/** A single queued activity log entry before it's flushed */
export interface ActivityLogEntry {
  activityType: string;
  userId: number | null;
  metadata: Record<string, unknown>;
}

/** Options for the getActivityLogs service */
export interface ActivityLogOptions {
  page?: number;
  pageSize?: number;
  userId?: number;
  activityType?: string;
  startDate?: string;
  endDate?: string;
}

/** A typed error with a custom HTTP status */
export interface HttpError extends Error {
  status?: number;
  code?: string;
}

/** Shape returned by notification queries */
export interface NotificationRow {
  id: number;
  recipientId: number | null;
  recipientRole: string | null;
  recipientRoles: string[] | null;
  type: string;
  title: string | null;
  message: string | null;
  data: unknown;
  createdAt: string | null;
  is_read?: boolean;
  time?: string;
}

/** Params for addNotification */
export interface AddNotificationParams {
  recipientRoles?: string[];
  recipientId?: number;
  type: string;
  title?: string;
  message?: string;
  data?: Record<string, unknown>;
}
