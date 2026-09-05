import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import prisma from "@/lib/server/prisma";

interface ProjectDelta {
    projectId: number;
    seconds: number;
    views: number;
}

interface SocialDelta {
    platform: string;
    seconds: number;
    views: number;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    try {
        const body = await request.json().catch(() => ({}));
        const sessionSeconds = Math.max(0, Math.round(Number(body?.sessionSeconds) || 0));
        const stackSeconds = Math.max(0, Math.round(Number(body?.stackSeconds) || 0));
        const contactOpens = Math.max(0, Math.round(Number(body?.contactOpens) || 0));
        const projects: ProjectDelta[] = Array.isArray(body?.projects) ? body.projects : [];
        const socials: SocialDelta[] = Array.isArray(body?.socials) ? body.socials : [];

        const link = await prisma.trackingLink.findUnique({ where: { code } });
        if (!link) return sendErrorResponse(HTTP_STATUS.NOT_FOUND, "Link not found");

        await prisma.trackingLink.update({
            where: { code },
            data: {
                totalSessionSeconds: { increment: sessionSeconds },
                stackSeconds: { increment: stackSeconds },
                contactOpens: { increment: contactOpens },
            },
        });

        for (const p of projects) {
            const projectId = Number(p?.projectId);
            if (!Number.isInteger(projectId)) continue;
            const seconds = Math.max(0, Math.round(Number(p?.seconds) || 0));
            const views = Math.max(0, Math.round(Number(p?.views) || 0));
            try {
                await prisma.linkProjectStat.upsert({
                    where: { linkId_projectId: { linkId: link.id, projectId } },
                    create: { linkId: link.id, projectId, seconds, views },
                    update: { seconds: { increment: seconds }, views: { increment: views } },
                });
            } catch (e) {
                console.error("Tracking/Links[code]/Sync project stat error:", e);
            }
        }

        for (const s of socials) {
            const platform = typeof s?.platform === "string" ? s.platform : null;
            if (!platform) continue;
            const seconds = Math.max(0, Math.round(Number(s?.seconds) || 0));
            const views = Math.max(0, Math.round(Number(s?.views) || 0));
            try {
                await prisma.linkSocialStat.upsert({
                    where: { linkId_platform: { linkId: link.id, platform } },
                    create: { linkId: link.id, platform, seconds, views },
                    update: { seconds: { increment: seconds }, views: { increment: views } },
                });
            } catch (e) {
                console.error("Tracking/Links[code]/Sync social stat error:", e);
            }
        }

        return sendApiResponse(null);
    } catch (error) {
        console.error("Tracking/Links[code]/Sync PATCH error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to sync link session");
    }
}
