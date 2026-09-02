import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";

const projectInclude = {
    tags: { include: { tag: true } },
    contributors: { include: { contributor: true } },
    images: { orderBy: { sortOrder: "asc" as const } },
};

export async function GET() {
    try {
        const projects = await prisma.project.findMany({
            include: projectInclude,
            orderBy: { listing: "asc" },
        });
        return sendApiResponse(projects);
    } catch (error) {
        console.error("Projects GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch projects");
    }
}

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const {
            name,
            description,
            liveLink,
            repoLink,
            downloadLink,
            iconUrl,
            images,
            tagIds,
            contributors,
            listing,
        } = body;

        if (typeof name !== "string" || !name.trim()) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing project name");
        }

        const project = await prisma.project.create({
            data: {
                name,
                description,
                liveLink,
                repoLink,
                downloadLink,
                iconUrl,
                listing: Number(listing) || 0,
                images: {
                    create: (images ?? []).map((url: string, i: number) => ({ url, sortOrder: i })),
                },
                tags: {
                    create: (tagIds ?? []).map((tagId: number) => ({ tagId })),
                },
                contributors: {
                    create: (contributors ?? []).map((c: { contributorId: number; roleAtProject?: string }) => ({
                        contributorId: c.contributorId,
                        roleAtProject: c.roleAtProject,
                    })),
                },
            },
            include: projectInclude,
        });

        return sendApiResponse(project, HTTP_STATUS.CREATED);
    } catch (error) {
        console.error("Projects POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to create project");
    }
}
