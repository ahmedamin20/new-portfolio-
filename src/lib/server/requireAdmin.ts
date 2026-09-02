import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import '@/lib/server/firebaseAdmin';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { sendErrorResponse } from '@/lib/apiResponse';

const ADMIN_EMAIL = 'tc.supply6@gmail.com';

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return sendErrorResponse(HTTP_STATUS.UNAUTHORIZED, 'Missing authorization token');
    }

    try {
        const decoded = await getAuth().verifyIdToken(token);
        if (decoded.email !== ADMIN_EMAIL) {
            return sendErrorResponse(HTTP_STATUS.FORBIDDEN, 'Not authorized');
        }
        return null;
    } catch {
        return sendErrorResponse(HTTP_STATUS.UNAUTHORIZED, 'Invalid authorization token');
    }
}
