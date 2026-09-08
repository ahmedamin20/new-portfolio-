import { getAuthorizedCalendarClient } from "@/lib/server/googleOAuth";

export const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";

export function getCalendarClient() {
    return getAuthorizedCalendarClient();
}
