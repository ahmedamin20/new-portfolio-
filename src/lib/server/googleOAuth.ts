import { google } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getRedirectUri(): string {
    return process.env.GOOGLE_OAUTH_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";
}

export function getOAuth2Client() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET");
    }

    return new google.auth.OAuth2(clientId, clientSecret, getRedirectUri());
}

export function getAuthUrl(): string {
    const client = getOAuth2Client();
    return client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
    });
}

export function getAuthorizedCalendarClient() {
    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
    if (!refreshToken) {
        throw new Error(
            "Missing GOOGLE_OAUTH_REFRESH_TOKEN. Visit /api/auth/google/start once to authorize and obtain it."
        );
    }

    const client = getOAuth2Client();
    client.setCredentials({ refresh_token: refreshToken });

    return google.calendar({ version: "v3", auth: client });
}
