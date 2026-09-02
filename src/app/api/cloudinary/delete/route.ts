import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import cloudinaryDelete from "@/lib/server/cloudinary/delete";
import { requireAdmin } from "@/lib/server/requireAdmin";

export async function POST(request: NextRequest) {
    const authError = await requireAdmin(request);
    if (authError) return authError;

    try {
        const body = await request.json();
        const publicId = body?.publicId;

        if (typeof publicId !== "string" || !publicId) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing publicId");
        }

        const result = await cloudinaryDelete(publicId);
        return sendApiResponse(result);
    } catch (error) {
        console.error("Delete route error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to delete file");
    }
}
