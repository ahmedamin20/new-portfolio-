import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

export async function GET() {
    try {
        const availability = await prisma.settingsAvailability.findUnique({ where: { id: 1 } });
        const handlingProjects = await prisma.handlingProject.findMany({ orderBy: { id: "asc" } });
        return sendApiResponse({
            availabilityPercent: availability?.availabilityPercent ?? 0,
            timezoneOffset: availability?.timezoneOffset ?? 0,
            handlingProjects,
        });
    } catch (error) {
        console.error("Settings/Availability GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch availability settings");
    }
}

export async function PUT(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const { availabilityPercent, timezoneOffset, handlingProjects } = body;

        await prisma.settingsAvailability.upsert({
            where: { id: 1 },
            create: {
                id: 1,
                availabilityPercent: Number(availabilityPercent) || 0,
                timezoneOffset: Number(timezoneOffset) || 0,
            },
            update: {
                availabilityPercent: Number(availabilityPercent) || 0,
                timezoneOffset: Number(timezoneOffset) || 0,
            },
        });

        if (Array.isArray(handlingProjects)) {
            await prisma.$transaction([
                prisma.handlingProject.deleteMany({}),
                ...handlingProjects.map((p: { name: string; description?: string; status: string }) =>
                    prisma.handlingProject.create({
                        data: { name: p.name, description: p.description ?? null, status: p.status },
                    })
                ),
            ]);
        }

        return sendApiResponse(null);
    } catch (error) {
        console.error("Settings/Availability PUT error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update availability settings");
    }
}
