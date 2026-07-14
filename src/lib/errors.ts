/** Narrows an unknown catch-clause value to a message string */
export function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Returns an Error from an unknown catch value */
export function toError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err));
}

/** An Error subclass that carries an HTTP status code and optional domain code */
export class HttpError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    if (code !== undefined) this.code = code;
  }
}

/**
 * Narrows to HttpError. Use this in catch clauses where services may throw
 * HttpError (e.g. login, visitGuard).
 */
export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}
