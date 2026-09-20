import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { HTTP_STATUS } from '@/constants/httpStatus';
import { sendApiResponse, sendErrorResponse } from '@/lib/apiResponse';
import { requireAdmin } from '@/lib/server/requireAdmin';
import { getAdminPasswordHash, setAdminPasswordHash } from '@/lib/server/adminCredential';

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { currentPassword, newPassword } = await request.json().catch(() => ({}));

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
        return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, 'Current and new password are required');
    }

    if (newPassword.length < 8) {
        return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, 'New password must be at least 8 characters');
    }

    const currentHash = await getAdminPasswordHash();
    if (!currentHash) {
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Admin credentials are not configured');
    }

    const matches = await bcrypt.compare(currentPassword, currentHash);
    if (!matches) {
        return sendErrorResponse(HTTP_STATUS.UNAUTHORIZED, 'Current password is incorrect');
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await setAdminPasswordHash(newHash);

    return sendApiResponse({ success: true });
}
