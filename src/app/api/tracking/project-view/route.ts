import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import prisma from "@/lib/server/prisma";

function todayUtcDate(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function POST() {
    try {
        const today = todayUtcDate();

        await prisma.$transaction([
            prisma.analyticsSummary.upsert({
                where: { id: 1 },
                create: { id: 1, totalProjectViews: 1 },
                update: { totalProjectViews: { increment: 1 } },
            }),
            prisma.analyticsDaily.upsert({
                where: { date: today },
                create: { date: today, projectViews: 1 },
                update: { projectViews: { increment: 1 } },
            }),
        ]);

        return sendApiResponse(null);
    } catch (error) {
        console.error("Tracking/ProjectView POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to record project view");
    }
}
