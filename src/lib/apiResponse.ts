import { NextResponse } from "next/server";
import { HTTP_STATUS, HTTP_MESSAGES } from "@/constants/httpStatus";

export interface ApiResponse<T = unknown> {
    data: T | null;
    code: number;
    message: string;
}

export function createApiResponse<T>(
    data: T | null,
    code: number = HTTP_STATUS.OK,
    message?: string
): ApiResponse<T> {
    return {
        data,
        code,
        message: message || HTTP_MESSAGES[code] || "Unknown status",
    };
}

export function sendApiResponse<T>(
    data: T | null,
    code: number = HTTP_STATUS.OK,
    message?: string
): NextResponse {
    const response = createApiResponse(data, code, message);
    return NextResponse.json(response, { status: code });
}

export function sendErrorResponse(
    code: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    message?: string
): NextResponse {
    return sendApiResponse(null, code, message);
}
