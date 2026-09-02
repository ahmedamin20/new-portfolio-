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
        const { name, color, iconUrl } = body;

        const tag = await prisma.tag.update({
            where: { id },
            data: {
                ...(typeof name === "string" ? { name } : {}),
                ...(typeof color === "string" ? { color } : {}),
                ...(iconUrl !== undefined ? { iconUrl } : {}),
            },
        });
        return sendApiResponse(tag);
    } catch (error) {
        console.error("Tags PUT error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update tag");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        await prisma.tag.delete({ where: { id } });
        return sendApiResponse(null);
    } catch (error) {
        console.error("Tags DELETE error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to delete tag");
    }
}
