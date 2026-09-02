import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

export async function GET() {
    try {
        const contributors = await prisma.contributor.findMany({ orderBy: { id: "asc" } });
        return sendApiResponse(contributors);
    } catch (error) {
        console.error("Contributors GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch contributors");
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { name, role, imageUrl, github, linkedin, facebook, instagram, portfolio } = body;

        if (typeof name !== "string" || !name.trim()) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing name");
        }

        const contributor = await prisma.contributor.create({
            data: { name, role, imageUrl, github, linkedin, facebook, instagram, portfolio },
        });
        return sendApiResponse(contributor, HTTP_STATUS.CREATED);
    } catch (error) {
        console.error("Contributors POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to create contributor");
    }
}
