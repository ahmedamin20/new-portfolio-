import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import prisma from "@/lib/server/prisma";

function parseId(idParam: string): number | null {
    const id = Number(idParam);
    return Number.isInteger(id) ? id : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        const body = await request.json().catch(() => ({}));
        const durationSeconds = Number(body?.durationSeconds);
        if (!Number.isFinite(durationSeconds)) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid durationSeconds");
        }

        await prisma.socialClick.update({
            where: { id },
            data: { durationSeconds },
        });

        return sendApiResponse(null);
    } catch (error) {
        console.error("Tracking/SocialClick PATCH error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update social click duration");
    }
}
