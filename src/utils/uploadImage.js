import cloudinary from "../lib/cloudinary-config.js";
import sharp from "sharp";

/**
 * Uploads an image to Cloudinary after optimizing it with Sharp
 * @async
 * @param {Buffer} fileBuffer - The buffer containing the image file data
 * @param {string} folder - The Cloudinary folder name where the image will be uploaded (e.g., "lab-test-docs")
 * @returns {Promise<string>} The secure URL of the uploaded image on Cloudinary
 * @throws {Error} If the upload to Cloudinary fails
 * @description
 * This function processes an image buffer by:
 * 1. Resizing based on folder-specific specifications
 * 2. Converting to JPEG format with 70% quality
 * 3. Uploading the optimized image to Cloudinary
 * 
 * Image specifications by folder:
 * - "lab-test-docs": 400x400 pixels
 * - default: 1200x800 pixels
 */
export async function uploadToCloudinary(fileBuffer, folder) {
    let imageSpec = {};

    switch (folder) {
        case "lab-test-docs":
            imageSpec = {
                width: 400,
                height: 400,
                fit: "inside",
            };
            break;
        default:
            imageSpec = {
                width: 1200,
                height: 800,
                fit: "inside",
            };
            break;
    }

    const optimizedBuffer = await sharp(fileBuffer)
        .resize(imageSpec)
        .jpeg({ quality: 70 })
        .toBuffer();

    const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ folder }, (err, res) =>
                err ? reject(err) : resolve(res)
            )
            .end(optimizedBuffer);
    });
    return result.secure_url;

}
