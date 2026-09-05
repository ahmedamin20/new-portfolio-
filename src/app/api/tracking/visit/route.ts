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
        const isNewUnique = Boolean(body?.isNewUnique);
        const today = todayUtcDate();

        await prisma.$transaction([
            prisma.analyticsSummary.upsert({
                where: { id: 1 },
                create: { id: 1, totalReach: 1, reachPerDevice: isNewUnique ? 1 : 0 },
                update: {
                    totalReach: { increment: 1 },
                    ...(isNewUnique ? { reachPerDevice: { increment: 1 } } : {}),
                },
            }),
            prisma.analyticsDaily.upsert({
                where: { date: today },
                create: { date: today, total: 1, unique: isNewUnique ? 1 : 0 },
                update: {
                    total: { increment: 1 },
                    ...(isNewUnique ? { unique: { increment: 1 } } : {}),
                },
            }),
        ]);

        return sendApiResponse(null);
    } catch (error) {
        console.error("Tracking/Visit POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to record visit");
    }
}
