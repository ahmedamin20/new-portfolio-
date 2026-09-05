import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

function parseId(idParam: string): number | null {
    const id = Number(idParam);
    return Number.isInteger(id) ? id : null;
}

function parseDate(value: string): Date | null {
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return new Date(Date.UTC(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])));
    const ddmmyyyy = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (ddmmyyyy) return new Date(Date.UTC(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1])));
    return null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        const body = await request.json();
        const data: { date?: Date; time?: string; name?: string; googleEventId?: string | null } = {};

        if (typeof body?.date === "string") {
            const date = parseDate(body.date);
            if (!date) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid date");
            data.date = date;
        }
        if (typeof body?.time === "string") data.time = body.time;
        if (typeof body?.name === "string") data.name = body.name;
        if (typeof body?.googleEventId === "string" || body?.googleEventId === null) {
            data.googleEventId = body.googleEventId;
        }

        await prisma.meeting.update({ where: { id }, data });
        return sendApiResponse(null);
    } catch (error) {
        console.error("Admin/Meetings[id] PUT error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update meeting");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        await prisma.meeting.delete({ where: { id } });
        return sendApiResponse(null);
    } catch (error) {
        console.error("Admin/Meetings[id] DELETE error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to delete meeting");
    }
}
