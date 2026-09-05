import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

export async function GET(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

        return sendApiResponse(
            messages.map((m) => ({
                id: String(m.id),
                name: m.name,
                email: m.email,
                message: m.message,
                number: m.number,
                whatsapp: m.whatsapp,
                timestamp: m.createdAt.getTime(),
                filesAttached: m.filesAttached ? JSON.parse(m.filesAttached) : [],
            }))
        );
    } catch (error) {
        console.error("Admin/ContactMessages GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch contact messages");
    }
}
