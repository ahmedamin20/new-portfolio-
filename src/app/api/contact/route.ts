import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import prisma from "@/lib/server/prisma";

interface FileAttachment {
    name: string;
    url: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        const email = typeof body?.email === "string" ? body.email.trim() : "";
        const message = typeof body?.message === "string" ? body.message.trim() : "";

        if (!name || !email || !message) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing required contact fields");
        }

        const filesAttached: FileAttachment[] = Array.isArray(body?.filesAttached) ? body.filesAttached : [];

        const contactMessage = await prisma.contactMessage.create({
            data: {
                name,
                email,
                message,
                number: typeof body?.number === "string" ? body.number : null,
                whatsapp: Boolean(body?.whatsapp),
                filesAttached: filesAttached.length ? JSON.stringify(filesAttached) : null,
            },
        });

        return sendApiResponse({ id: contactMessage.id }, HTTP_STATUS.CREATED);
    } catch (error) {
        console.error("Contact POST error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to submit contact message");
    }
}
