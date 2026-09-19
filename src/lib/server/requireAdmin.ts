import { NextRequest, NextResponse } from 'next/server';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { sendErrorResponse } from '@/lib/apiResponse';
import { AUTH_COOKIE_NAME, verifyAdminToken } from '@/lib/server/jwt';

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
        return sendErrorResponse(HTTP_STATUS.UNAUTHORIZED, 'Missing authorization token');
    }

    const payload = verifyAdminToken(token);
    if (!payload || payload.email.toLowerCase() !== process.env.ADMIN_EMAIL?.toLowerCase()) {
        return sendErrorResponse(HTTP_STATUS.UNAUTHORIZED, 'Invalid authorization token');
    }

    return null;
}
