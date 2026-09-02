import cloudinary from "./config";

/**
 * Deletes a file from Cloudinary
 * @param publicId - The public ID of the file to delete
 * @returns Cloudinary delete response
 */
const cloudinaryDelete = async (publicId: string) => {
    try {
        const res = await cloudinary.uploader.destroy(publicId);
        return res;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw new Error('Failed to delete image from Cloudinary');
    }
};

export default cloudinaryDelete;
