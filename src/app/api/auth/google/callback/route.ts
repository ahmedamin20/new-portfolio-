import { NextRequest, NextResponse } from "next/server";
import { getOAuth2Client } from "@/lib/server/googleOAuth";

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");
    const error = request.nextUrl.searchParams.get("error");

    if (error) {
        return new NextResponse(`<pre>OAuth error: ${error}</pre>`, {
            status: 400,
            headers: { "Content-Type": "text/html" },
        });
    }

    if (!code) {
        return new NextResponse("<pre>Missing code param</pre>", {
            status: 400,
            headers: { "Content-Type": "text/html" },
        });
    }

    try {
        const client = getOAuth2Client();
        const { tokens } = await client.getToken(code);

        if (!tokens.refresh_token) {
            return new NextResponse(
                `<pre>No refresh_token returned. This usually means you already authorized this app before.
Go to https://myaccount.google.com/permissions, remove access for this app's OAuth client, then visit /api/auth/google/start again.</pre>`,
                { status: 400, headers: { "Content-Type": "text/html" } }
            );
        }

        return new NextResponse(
            `<pre>Authorization successful.

Copy this value into .env.local as GOOGLE_OAUTH_REFRESH_TOKEN, then restart the dev server:

${tokens.refresh_token}
</pre>`,
            { status: 200, headers: { "Content-Type": "text/html" } }
        );
    } catch (err) {
        return new NextResponse(`<pre>Token exchange failed: ${err instanceof Error ? err.message : String(err)}</pre>`, {
            status: 500,
            headers: { "Content-Type": "text/html" },
        });
    }
}
