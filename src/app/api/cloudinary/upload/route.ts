import { NextRequest } from "next/server";
import { HTTP_STATUS } from "@/constants/httpStatus";
import { sendApiResponse, sendErrorResponse } from "@/lib/apiResponse";
import cloudinaryUpload from "@/lib/server/cloudinary/upload";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file");
        const folder = formData.get("folder");

        if (!(file instanceof File)) {
            return sendErrorResponse(HTTP_STATUS.BAD_REQUEST, "Missing file");
        }

        const result = await cloudinaryUpload({
            folderName: typeof folder === "string" ? folder : "misc",
            imageFile: file,
        });

        return sendApiResponse({ publicId: result.public_id, url: result.url });
    } catch (error) {
        console.error("Upload route error:", error);
        return sendErrorResponse(HTTP_STATUS.INTERNAL_SERVER_ERROR, "Failed to upload file");
    }
}
