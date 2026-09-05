import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

export async function GET(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const meetings = await prisma.meeting.findMany({ orderBy: { date: "asc" } });

        return sendApiResponse(
            meetings.map((m) => ({
                id: String(m.id),
                name: m.name,
                time: m.time,
                date: m.date.toISOString().split("T")[0],
                email: m.email,
                meetingLink: m.meetingLink,
                reason: m.reason,
                userTimezone: m.userTimezone,
                userLocalTime: m.userLocalTime,
                googleEventId: m.googleEventId,
                timestamp: m.createdAt.getTime(),
            }))
        );
    } catch (error) {
        console.error("Admin/Meetings GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch meetings");
    }
}
