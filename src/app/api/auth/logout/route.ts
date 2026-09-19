import { sendApiResponse } from '@/lib/apiResponse';
import { AUTH_COOKIE_NAME } from '@/lib/server/jwt';

export async function POST() {
    const response = sendApiResponse({ success: true });
    response.cookies.set(AUTH_COOKIE_NAME, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
    });
    return response;
}
