const httpStatusCodes = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500,
} as const;

export type HttpStatusCode = typeof httpStatusCodes[keyof typeof httpStatusCodes];

export { httpStatusCodes };