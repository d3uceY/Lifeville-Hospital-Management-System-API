import cloudinary from '../lib/cloudinary-config.js';
import { extractPublicId } from './extractCloudinaryPublicId';

/**
 * Deletes an image from Cloudinary storage
 * 
 * @async
 * @function deleteImage
 * @param {string} image - The image URL or path containing the public ID to be deleted
 * @returns {Promise<{success: boolean}>} A promise that resolves to an object with success status
 * @throws {Error} Throws an error if the deletion fails
 * @author d3uceY <https://github.com/d3uceY>
 * @example
 * const result = await deleteImage('https://cloudinary.com/sample/image.jpg');
 * // Returns: { success: true }
 */
const deleteImage = async (image) => {
    try {
        const publicId = extractPublicId(image);
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
        return { success: true };
    } catch (error) {
        console.error('Error deleting image:', error);
        throw error;
    }
};

export default deleteImage;