import type { ActivityLogParams } from "./common.js";

declare global {
  namespace Express {
    interface Request {
      /** Authenticated user's DB id, populated by `authenticate` middleware */
      userId?: number;
      /** Authenticated user's role string (e.g. "doctor"), populated by `authenticate` */
      userRole?: string;
      /** ISO timestamp of user account creation, used for notification scoping */
      userCreatedAt?: string;
      /**
       * Fire-and-forget activity logger attached by `activityLogMiddleware`.
       * Call AFTER res.json() so it never blocks the response.
       */
      activityLogger: (
        activityType: string,
        metadata?: Record<string, unknown>,
        overrideUserId?: number
      ) => void;
    }
  }
}

export {};
