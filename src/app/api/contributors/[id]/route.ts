import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

function parseId(idParam: string): number | null {
    const id = Number(idParam);
    return Number.isInteger(id) ? id : null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        const body = await request.json();
        const { name, role, imageUrl, github, linkedin, facebook, instagram, portfolio } = body;

        const contributor = await prisma.contributor.update({
            where: { id },
            data: {
                ...(typeof name === "string" ? { name } : {}),
                ...(role !== undefined ? { role } : {}),
                ...(imageUrl !== undefined ? { imageUrl } : {}),
                ...(github !== undefined ? { github } : {}),
                ...(linkedin !== undefined ? { linkedin } : {}),
                ...(facebook !== undefined ? { facebook } : {}),
                ...(instagram !== undefined ? { instagram } : {}),
                ...(portfolio !== undefined ? { portfolio } : {}),
            },
        });
        return sendApiResponse(contributor);
    } catch (error) {
        console.error("Contributors PUT error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update contributor");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        await prisma.contributor.delete({ where: { id } });
        return sendApiResponse(null);
    } catch (error) {
        console.error("Contributors DELETE error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to delete contributor");
    }
}
