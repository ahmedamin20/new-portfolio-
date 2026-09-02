import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

export async function GET() {
    try {
        const items = await prisma.techStackItem.findMany({ orderBy: { sortOrder: "asc" } });
        return sendApiResponse(items);
    } catch (error) {
        console.error("Tech stack GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch tech stack");
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { name, iconUrl } = body;

        if (typeof name !== "string" || !name.trim() || typeof iconUrl !== "string" || !iconUrl) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing name or iconUrl");
        }

        const count = await prisma.techStackItem.count();
        const item = await prisma.techStackItem.create({
            data: { name, iconUrl, sortOrder: count },
        });
        return sendApiResponse(item, HTTP_STATUS.CREATED);
    } catch (error) {
        console.error("Tech stack POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to create tech stack item");
    }
}
