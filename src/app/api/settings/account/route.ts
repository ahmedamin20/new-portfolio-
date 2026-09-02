import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

export async function GET() {
    try {
        const account = await prisma.settingsAccount.findUnique({ where: { id: 1 } });
        const socialLinks = await prisma.socialLink.findMany({ orderBy: { id: "asc" } });
        const education = await prisma.educationEntry.findMany({ orderBy: { sortOrder: "asc" } });
        const impact = await prisma.impactEntry.findMany({ orderBy: { sortOrder: "asc" } });
        const languages = await prisma.languageEntry.findMany({ orderBy: { sortOrder: "asc" } });
        return sendApiResponse({
            name: account?.name ?? null,
            title: account?.title ?? null,
            heroImageUrl: account?.heroImageUrl ?? null,
            imageUrl: account?.imageUrl ?? null,
            bio: account?.bio ?? null,
            email: account?.email ?? null,
            phone: account?.phone ?? null,
            location: account?.location ?? null,
            socialLinks,
            education,
            impact,
            languages,
        });
    } catch (error) {
        console.error("Settings/Account GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch account settings");
    }
}

export async function PUT(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { name, title, heroImageUrl, imageUrl, bio, email, phone, location, socialLinks, education, impact, languages } = body;

        const data: Record<string, string> = {};
        if (typeof name === "string") data.name = name;
        if (typeof title === "string") data.title = title;
        if (typeof heroImageUrl === "string") data.heroImageUrl = heroImageUrl;
        if (typeof imageUrl === "string") data.imageUrl = imageUrl;
        if (typeof bio === "string") data.bio = bio;
        if (typeof email === "string") data.email = email;
        if (typeof phone === "string") data.phone = phone;
        if (typeof location === "string") data.location = location;

        if (Object.keys(data).length > 0) {
            await prisma.settingsAccount.upsert({
                where: { id: 1 },
                create: { id: 1, ...data },
                update: data,
            });
        }

        if (Array.isArray(socialLinks)) {
            await prisma.$transaction([
                prisma.socialLink.deleteMany({}),
                ...socialLinks.map((link: { platform: string; url: string }) =>
                    prisma.socialLink.create({ data: { platform: link.platform, url: link.url } })
                ),
            ]);
        }

        if (Array.isArray(education)) {
            await prisma.$transaction([
                prisma.educationEntry.deleteMany({}),
                ...education.map((e: { degree: string; institution: string; period?: string }, i: number) =>
                    prisma.educationEntry.create({
                        data: { degree: e.degree, institution: e.institution, period: e.period || null, sortOrder: i },
                    })
                ),
            ]);
        }

        if (Array.isArray(impact)) {
            await prisma.$transaction([
                prisma.impactEntry.deleteMany({}),
                ...impact.map((e: { text: string }, i: number) =>
                    prisma.impactEntry.create({ data: { text: e.text, sortOrder: i } })
                ),
            ]);
        }

        if (Array.isArray(languages)) {
            await prisma.$transaction([
                prisma.languageEntry.deleteMany({}),
                ...languages.map((e: { name: string; level: string }, i: number) =>
                    prisma.languageEntry.create({ data: { name: e.name, level: e.level, sortOrder: i } })
                ),
            ]);
        }

        return sendApiResponse(null);
    } catch (error) {
        console.error("Settings/Account PUT error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update account settings");
    }
}
