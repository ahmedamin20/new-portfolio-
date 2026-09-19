import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = '7d';

export const AUTH_COOKIE_NAME = 'admin_token';

interface AdminTokenPayload {
    email: string;
}

export function signAdminToken(email: string): string {
    if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    return jwt.sign({ email } satisfies AdminTokenPayload, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
    if (!JWT_SECRET) return null;
    try {
        return jwt.verify(token, JWT_SECRET) as AdminTokenPayload;
    } catch {
        return null;
    }
}
