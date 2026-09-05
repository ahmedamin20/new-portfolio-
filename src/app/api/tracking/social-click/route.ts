import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import prisma from "@/lib/server/prisma";

function todayUtcDate(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        const platform = typeof body?.platform === "string" ? body.platform : null;
        if (!platform) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing platform");

        const today = todayUtcDate();

        const [, , socialClick] = await prisma.$transaction([
            prisma.analyticsSummary.upsert({
                where: { id: 1 },
                create: { id: 1, totalSocialClicks: 1 },
                update: { totalSocialClicks: { increment: 1 } },
            }),
            prisma.analyticsDaily.upsert({
                where: { date: today },
                create: { date: today, socialClicks: 1 },
                update: { socialClicks: { increment: 1 } },
            }),
            prisma.socialClick.create({ data: { platform } }),
        ]);

        return sendApiResponse({ socialClickId: socialClick.id });
    } catch (error) {
        console.error("Tracking/SocialClick POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to record social click");
    }
}
