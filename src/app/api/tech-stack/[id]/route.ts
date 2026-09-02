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
        const { name, iconUrl } = body;

        const item = await prisma.techStackItem.update({
            where: { id },
            data: {
                ...(typeof name === "string" ? { name } : {}),
                ...(typeof iconUrl === "string" ? { iconUrl } : {}),
            },
        });
        return sendApiResponse(item);
    } catch (error) {
        console.error("Tech stack PUT error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update tech stack item");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        await prisma.techStackItem.delete({ where: { id } });
        return sendApiResponse(null);
    } catch (error) {
        console.error("Tech stack DELETE error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to delete tech stack item");
    }
}
