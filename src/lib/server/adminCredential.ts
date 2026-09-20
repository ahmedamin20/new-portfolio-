import prisma from '@/lib/server/prisma';

export async function getAdminPasswordHash(): Promise<string | null> {
    const existing = await prisma.adminCredential.findUnique({ where: { id: 1 } });
    if (existing) return existing.passwordHash;

    const envHash = process.env.ADMIN_PASSWORD_HASH;
    if (!envHash) return null;

    const seeded = await prisma.adminCredential.create({ data: { id: 1, passwordHash: envHash } });
    return seeded.passwordHash;
}

export async function setAdminPasswordHash(passwordHash: string): Promise<void> {
    await prisma.adminCredential.upsert({
        where: { id: 1 },
        create: { id: 1, passwordHash },
        update: { passwordHash },
    });
}
