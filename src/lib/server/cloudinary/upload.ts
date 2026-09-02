import cloudinary from "./config";

/**
 * Uploads a file to Cloudinary
 * @param folderName - The folder to upload to
 * @param imageFile - The file to upload
 * @returns Cloudinary upload response
 */
const cloudinaryUpload = async ({
    folderName,
    imageFile,
}: {
    folderName: string;
    imageFile: File;
}) => {
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const base64String = `data:${imageFile.type};base64,${buffer.toString(
        "base64"
    )}`;

    // SVGs (and other images) must use resource_type "image" explicitly —
    // "auto" routes SVGs to "raw", which Cloudinary force-downloads instead of rendering inline.
    const resourceType = imageFile.type.startsWith("image/") ? "image" : "auto";

    const res = await cloudinary.uploader.upload(base64String, {
        folder: folderName,
        resource_type: resourceType,
    });

    return {
        public_id: res.public_id,
        url: res.secure_url,
    };
};

export default cloudinaryUpload;
