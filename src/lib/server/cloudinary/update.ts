import cloudinaryDelete from "./delete";
import cloudinaryUpload from "./upload";

/**
 * Updates a file in Cloudinary (essentially delete + upload)
 * @param oldPublicId - The public ID of the file to replace
 * @param newFile - The new file to upload
 * @param folderName - The folder to upload to
 * @returns Cloudinary upload response for the new file
 */
const cloudinaryUpdate = async ({
    oldPublicId,
    newFile,
    folderName,
}: {
    oldPublicId: string;
    newFile: File;
    folderName: string;
}) => {
    try {
        if (oldPublicId) {
            await cloudinaryDelete(oldPublicId);
        }
        return await cloudinaryUpload({ folderName, imageFile: newFile });
    } catch (error) {
        console.error('Cloudinary update error:', error);
        throw new Error('Failed to update image in Cloudinary');
    }
};

export default cloudinaryUpdate;
