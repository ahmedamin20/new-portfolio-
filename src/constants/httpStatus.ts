export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
} as const;

export const HTTP_MESSAGES: Record<number, string> = {
    [HTTP_STATUS.OK]: "OK",
    [HTTP_STATUS.CREATED]: "Created",
    [HTTP_STATUS.NO_CONTENT]: "No Content",
    [HTTP_STATUS.BAD_REQUEST]: "Bad Request",
    [HTTP_STATUS.UNAUTHORIZED]: "Unauthorized",
    [HTTP_STATUS.FORBIDDEN]: "Forbidden",
    [HTTP_STATUS.NOT_FOUND]: "Not Found",
    [HTTP_STATUS.CONFLICT]: "Conflict",
    [HTTP_STATUS.INTERNAL_SERVER_ERROR]: "Internal Server Error",
};
