import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { sendApiResponse, sendErrorResponse } from '@/lib/apiResponse';
import { AUTH_COOKIE_NAME, signAdminToken } from '@/lib/server/jwt';

export async function POST(request: NextRequest) {
    const { email, password } = await request.json().catch(() => ({}));

    if (typeof email !== 'string' || typeof password !== 'string') {
        return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Email and password are required');
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;

    if (!adminEmail || !adminPasswordHash) {
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Admin credentials are not configured');
    }

    const emailMatches = email.toLowerCase() === adminEmail.toLowerCase();
    const passwordMatches = await bcrypt.compare(password, adminPasswordHash);

    if (!emailMatches || !passwordMatches) {
        return sendErrorResponse(HTTP_STATUS.UNAUTHORIZED, 'Invalid email or password');
    }

    const token = signAdminToken(adminEmail);

    const response = sendApiResponse({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    });

    return response;
}
