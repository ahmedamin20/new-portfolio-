import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

export async function GET(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const days = Number(request.nextUrl.searchParams.get("days")) || 365;

        const [summary, dailyRows] = await Promise.all([
            prisma.analyticsSummary.findUnique({ where: { id: 1 } }),
            prisma.analyticsDaily.findMany({
                orderBy: { date: "desc" },
                take: days,
            }),
        ]);

        const daily = dailyRows
            .map((row) => ({
                date: row.date.toISOString().split("T")[0],
                total: row.total,
                unique: row.unique,
                projectViews: row.projectViews,
                socialClicks: row.socialClicks,
            }))
            .reverse();

        return sendApiResponse({
            summary: {
                totalReach: summary?.totalReach ?? 0,
                reachPerDevice: summary?.reachPerDevice ?? 0,
                totalProjectViews: summary?.totalProjectViews ?? 0,
                totalSocialClicks: summary?.totalSocialClicks ?? 0,
            },
            daily,
        });
    } catch (error) {
        console.error("Settings/Analytics GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch analytics");
    }
}
