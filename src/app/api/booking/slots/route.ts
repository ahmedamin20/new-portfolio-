import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import prisma from "@/lib/server/prisma";

function parseDateOnly(value: string): Date | null {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export async function GET(request: NextRequest) {
    try {
        const dateParam = request.nextUrl.searchParams.get("date");
        const monthParam = request.nextUrl.searchParams.get("month");

        if (dateParam) {
            const date = parseDateOnly(dateParam);
            if (!date) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid date");

            const meetings = await prisma.meeting.findMany({ where: { date }, select: { time: true } });
            return sendApiResponse({ bookedTimes: meetings.map((m) => m.time) });
        }

        if (monthParam) {
            const m = monthParam.match(/^(\d{4})-(\d{2})$/);
            if (!m) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid month");
            const year = Number(m[1]);
            const month = Number(m[2]) - 1;
            const start = new Date(Date.UTC(year, month, 1));
            const end = new Date(Date.UTC(year, month + 1, 1));

            const meetings = await prisma.meeting.findMany({
                where: { date: { gte: start, lt: end } },
                select: { date: true, time: true },
            });

            const byDate: Record<string, string[]> = {};
            for (const m of meetings) {
                const key = m.date.toISOString().split("T")[0];
                if (!byDate[key]) byDate[key] = [];
                byDate[key].push(m.time);
            }

            return sendApiResponse(byDate);
        }

        return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing date or month query param");
    } catch (error) {
        console.error("Booking/Slots GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch booked slots");
    }
}
