import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function generateCode(): string {
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
    }
    return code;
}

function serializeLink(link: {
    id: number;
    code: string;
    name: string;
    forField: string;
    interviewer: boolean;
    views: number;
    totalSessionSeconds: number;
    stackSeconds: number;
    contactOpens: number;
    createdAt: Date;
    projectStats: { projectId: number; seconds: number; views: number }[];
    socialStats: { platform: string; seconds: number; views: number }[];
}) {
    return {
        id: link.id,
        code: link.code,
        name: link.name,
        forField: link.forField,
        interviewer: link.interviewer,
        views: link.views,
        totalSessionSeconds: link.totalSessionSeconds,
        stackSeconds: link.stackSeconds,
        contactOpens: link.contactOpens,
        createdAt: link.createdAt.toISOString(),
        projects: link.projectStats.map((p) => ({ projectId: p.projectId, seconds: p.seconds, views: p.views })),
        socials: link.socialStats.map((s) => ({ platform: s.platform, seconds: s.seconds, views: s.views })),
    };
}

export async function GET(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const links = await prisma.trackingLink.findMany({
            orderBy: { id: "desc" },
            include: { projectStats: true, socialStats: true },
        });

        return sendApiResponse(links.map(serializeLink));
    } catch (error) {
        console.error("Settings/Links GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch links");
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        const forField = typeof body?.forField === "string" ? body.forField.trim() : "";
        if (!name || !forField) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing name or forField");
        }

        let link = null;
        for (let attempt = 0; attempt < 5 && !link; attempt++) {
            try {
                link = await prisma.trackingLink.create({
                    data: { code: generateCode(), name, forField },
                    include: { projectStats: true, socialStats: true },
                });
            } catch (e) {
                if (attempt === 4) throw e;
            }
        }

        if (!link) return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to generate unique code");

        return sendApiResponse(serializeLink(link), HTTP_STATUS.CREATED);
    } catch (error) {
        console.error("Settings/Links POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to create link");
    }
}
