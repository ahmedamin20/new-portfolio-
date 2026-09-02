import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import prisma from "@/lib/server/prisma";

const FIELD_MAP = {
    project: "viewsProject",
    github: "viewsGithub",
    live: "viewsLive",
    download: "viewsDownload",
} as const;

type ViewField = keyof typeof FIELD_MAP;

function parseId(idParam: string): number | null {
    const id = Number(idParam);
    return Number.isInteger(id) ? id : null;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        const body = await request.json();
        const field: ViewField = body?.field;

        if (!(field in FIELD_MAP)) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid field");
        }

        const column = FIELD_MAP[field];
        const project = await prisma.project.update({
            where: { id },
            data: { [column]: { increment: 1 } },
        });

        return sendApiResponse({ [column]: project[column] });
    } catch (error) {
        console.error("Project view increment error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to record view");
    }
}
