/**
 * Extracts the public ID from a Cloudinary URL.
 * 
 * @param {string} url - The Cloudinary URL to extract the public ID from.
 * @returns {string} The extracted public ID without version and file extension.
 * 
 * @example
 * // Returns "folder/image"
 * extractPublicId("https://res.cloudinary.com/demo/image/upload/v1234567890/folder/image.jpg")
 * 
 * @example
 * // Returns "sample"
 * extractPublicId("https://res.cloudinary.com/demo/image/upload/v1/sample.png")
 */
export const extractPublicId = (url) => {
    const parts = url.split('/upload/').pop()?.split('/') ?? [];
    const withoutVersion = parts.slice(1).join('/');
    return withoutVersion.split('.').slice(0, -1).join('.');
}
