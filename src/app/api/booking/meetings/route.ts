import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import prisma from "@/lib/server/prisma";

function parseDateDDMMYYYY(value: string): Date | null {
    const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const dateStr = typeof body?.date === "string" ? body.date : "";
        const time = typeof body?.time === "string" ? body.time : "";
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        const email = typeof body?.email === "string" ? body.email.trim() : "";

        const date = parseDateDDMMYYYY(dateStr);
        if (!date || !time || !name || !email) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing required booking fields");
        }
        if (date.getUTCDay() === 6) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Saturdays are unavailable for booking");
        }

        const existing = await prisma.meeting.findFirst({ where: { date, time } });
        if (existing) return sendErrorResponse(HTTP_STATUS.CONFLICT, "This time slot is already booked");

        const meeting = await prisma.meeting.create({
            data: {
                date,
                time,
                name,
                email,
                reason: typeof body?.reason === "string" ? body.reason : null,
                meetingLink: typeof body?.meetingLink === "string" ? body.meetingLink : null,
                googleEventId: typeof body?.googleEventId === "string" ? body.googleEventId : null,
                userTimezone: typeof body?.userTimezone === "number" ? body.userTimezone : null,
                userLocalTime: typeof body?.userLocalTime === "string" ? body.userLocalTime : null,
            },
        });

        return sendApiResponse({ id: meeting.id }, HTTP_STATUS.CREATED);
    } catch (error: unknown) {
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
            return sendErrorResponse(HTTP_STATUS.CONFLICT, "This time slot is already booked");
        }
        console.error("Booking/Meetings POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to create booking");
    }
}
