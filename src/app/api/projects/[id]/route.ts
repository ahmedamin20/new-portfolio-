import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import { requireAdmin } from "@/lib/server/requireAdmin";
import prisma from "@/lib/server/prisma";
import { Prisma } from "@prisma/client";

const projectInclude = {
    tags: { include: { tag: true } },
    contributors: { include: { contributor: true } },
    images: { orderBy: { sortOrder: "asc" as const } },
};

function parseId(idParam: string): number | null {
    const id = Number(idParam);
    return Number.isInteger(id) ? id : null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        const project = await prisma.project.findUnique({ where: { id }, include: projectInclude });
        if (!project) return sendErrorResponse(HTTP_STATUS.NOT_FOUND, "Project not found");
        return sendApiResponse(project);
    } catch (error) {
        console.error("Project GET error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to fetch project");
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

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

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            await tx.project.update({
                where: { id },
                data: {
                    ...(typeof name === "string" ? { name } : {}),
                    ...(description !== undefined ? { description } : {}),
                    ...(liveLink !== undefined ? { liveLink } : {}),
                    ...(repoLink !== undefined ? { repoLink } : {}),
                    ...(downloadLink !== undefined ? { downloadLink } : {}),
                    ...(iconUrl !== undefined ? { iconUrl } : {}),
                    ...(listing !== undefined ? { listing: Number(listing) || 0 } : {}),
                },
            });

            if (Array.isArray(images)) {
                await tx.projectImage.deleteMany({ where: { projectId: id } });
                await tx.projectImage.createMany({
                    data: images.map((url: string, i: number) => ({ projectId: id, url, sortOrder: i })),
                });
            }

            if (Array.isArray(tagIds)) {
                await tx.projectTag.deleteMany({ where: { projectId: id } });
                await tx.projectTag.createMany({
                    data: tagIds.map((tagId: number) => ({ projectId: id, tagId })),
                });
            }

            if (Array.isArray(contributors)) {
                await tx.projectContributor.deleteMany({ where: { projectId: id } });
                await tx.projectContributor.createMany({
                    data: contributors.map((c: { contributorId: number; roleAtProject?: string }) => ({
                        projectId: id,
                        contributorId: c.contributorId,
                        roleAtProject: c.roleAtProject,
                    })),
                });
            }
        });

        const project = await prisma.project.findUnique({ where: { id }, include: projectInclude });
        return sendApiResponse(project);
    } catch (error) {
        console.error("Project PUT error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to update project");
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Invalid id");

    try {
        await prisma.project.delete({ where: { id } });
        return sendApiResponse(null);
    } catch (error) {
        console.error("Project DELETE error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to delete project");
    }
}
