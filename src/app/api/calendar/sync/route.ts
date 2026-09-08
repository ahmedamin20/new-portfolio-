import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { getCalendarClient, CALENDAR_ID } from "@/lib/server/googleCalendar";

interface SyncBody {
    action?: "create" | "update" | "cancel";
    eventId?: string;
    name?: string;
    email?: string;
    reason?: string;
    startTime?: string;
    endTime?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: SyncBody = await request.json();
        const action = body.action || "create";
        const calendar = getCalendarClient();

        if (action === "create") {
            const { name, email, reason, startTime, endTime } = body;
            if (!email || !startTime || !endTime) {
                return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing required fields for create");
            }

            const res = await calendar.events.insert({
                calendarId: CALENDAR_ID,
                conferenceDataVersion: 1,
                requestBody: {
                    summary: `Meeting with ${name || email}`,
                    description: reason || "",
                    start: { dateTime: startTime },
                    end: { dateTime: endTime },
                    attendees: [{ email }],
                    conferenceData: {
                        createRequest: {
                            requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                            conferenceSolutionKey: { type: "hangoutsMeet" },
                        },
                    },
                },
            });

            const link =
                res.data.hangoutLink ||
                res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
                undefined;

            return sendApiResponse({ status: "success", link, id: res.data.id });
        }

        if (action === "update") {
            const { eventId, name, email, reason, startTime, endTime } = body;
            if (!eventId) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing eventId for update");

            await calendar.events.patch({
                calendarId: CALENDAR_ID,
                eventId,
                requestBody: {
                    summary: `Meeting with ${name || email}`,
                    description: reason ?? undefined,
                    start: startTime ? { dateTime: startTime } : undefined,
                    end: endTime ? { dateTime: endTime } : undefined,
                    attendees: email ? [{ email }] : undefined,
                },
            });

            return sendApiResponse({ status: "success" });
        }

        if (action === "cancel") {
            let targetId = body.eventId;

            if (!targetId && body.email && body.startTime) {
                const start = new Date(body.startTime);
                const timeMin = new Date(start.getTime() - 60000).toISOString();
                const timeMax = new Date(start.getTime() + 60000).toISOString();
                const list = await calendar.events.list({
                    calendarId: CALENDAR_ID,
                    timeMin,
                    timeMax,
                    q: body.email,
                    singleEvents: true,
                });
                targetId = list.data.items?.[0]?.id ?? undefined;
            }

            if (targetId) {
                await calendar.events.delete({ calendarId: CALENDAR_ID, eventId: targetId }).catch(() => {});
            }

            return sendApiResponse({ status: "success" });
        }

        return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Unknown action");
    } catch (error) {
        console.error("Calendar/Sync POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to sync calendar event");
    }
}
