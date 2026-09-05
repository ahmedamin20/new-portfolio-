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

        if (body?.reset === true) {
            await prisma.$transaction([
                prisma.trackingLink.update({
                    where: { id },
                    data: { views: 0, totalSessionSeconds: 0, stackSeconds: 0, contactOpens: 0 },
                }),
                prisma.linkProjectStat.deleteMany({ where: { linkId: id } }),
                prisma.linkSocialStat.deleteMany({ where: { linkId: id } }),
            ]);
            return sendApiResponse(null);
        }

        const data: { name?: string; forField?: string; interviewer?: boolean } = {};
        if (typeof body?.name === "string") data.name = body.name.trim();
        if (typeof body?.forField === "string") data.forField = body.forField.trim();
        if (typeof body?.interviewer === "boolean") data.interviewer = body.interviewer;

        await prisma.trackingLink.update({ where: { id }, data });
        return sendApiResponse(null);
    } catch (error) {
        console.error("Settings/Links[id] PUT error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update link");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        await prisma.trackingLink.delete({ where: { id } });
        return sendApiResponse(null);
    } catch (error) {
        console.error("Settings/Links[id] DELETE error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to delete link");
    }
}
