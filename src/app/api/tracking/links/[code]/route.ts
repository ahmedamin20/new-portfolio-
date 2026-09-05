import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import prisma from "@/lib/server/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;

    try {
        const existing = await prisma.trackingLink.findUnique({ where: { code } });
        if (!existing) return sendErrorResponse(HTTP_STATUS.NOT_FOUND, "Link not found");

        const link = await prisma.trackingLink.update({
            where: { code },
            data: { views: { increment: 1 } },
            include: { projectStats: true, socialStats: true },
        });

        return sendApiResponse({
            id: link.id,
            interviewer: link.interviewer,
            totalSessionSeconds: link.totalSessionSeconds,
            stackSeconds: link.stackSeconds,
            contactOpens: link.contactOpens,
            projects: link.projectStats.map((p) => ({ projectId: p.projectId, seconds: p.seconds, views: p.views })),
            socials: link.socialStats.map((s) => ({ platform: s.platform, seconds: s.seconds, views: s.views })),
        });
    } catch (error) {
        console.error("Tracking/Links[code] GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch link");
    }
}
