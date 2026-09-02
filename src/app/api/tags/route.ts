import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

export async function GET() {
    try {
        const tags = await prisma.tag.findMany({ orderBy: { id: "asc" } });
        return sendApiResponse(tags);
    } catch (error) {
        console.error("Tags GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch tags");
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { name, color, iconUrl } = body;

        if (typeof name !== "string" || !name.trim() || typeof color !== "string") {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing name or color");
        }

        const tag = await prisma.tag.create({
            data: { name, color, iconUrl: iconUrl ?? null },
        });
        return sendApiResponse(tag, HTTP_STATUS.CREATED);
    } catch (error) {
        console.error("Tags POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to create tag");
    }
}
