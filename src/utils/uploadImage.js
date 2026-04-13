import cloudinary from "../lib/cloudinary-config.js";
import sharp from "sharp";

/**
 * Uploads an image to Cloudinary after optimizing it with Sharp.
 * @async
 * @param {Buffer} fileBuffer - The buffer containing the image file data
 * @param {string} folder - The Cloudinary folder path where the image will be uploaded
 * @param {'lab-doc'|'avatar'|'patient-photo'|'default'} [type='default'] - The upload type, determines resize dimensions:
 *   - `'lab-doc'`:      no resize (original dimensions preserved)
 *   - `'avatar'`:       256×256 px, cover (user profile photos)
 *   - `'patient-photo'`: 400×400 px, cover (patient profile pictures)
 *   - `'default'`:      1200×800 px, inside (general purpose)
 * @returns {Promise<string>} The secure URL of the uploaded image on Cloudinary
 * @throws {Error} If the upload to Cloudinary fails
 */
export async function uploadToCloudinary(fileBuffer, folder, type = 'default') {
    let imageSpec = {};

    switch (type) {
        case "lab-doc":
            imageSpec = null;
            break;
        case "avatar":
            imageSpec = { width: 256, height: 256, fit: "cover" };
            break;
        case "patient-photo":
            imageSpec = { width: 400, height: 400, fit: "cover" };
            break;
        default:
            imageSpec = { width: 1200, height: 800, fit: "inside" };
            break;
    }

    const sharpPipeline = sharp(fileBuffer).jpeg({ quality: 80 });
    if (imageSpec) sharpPipeline.resize(imageSpec);
    const optimizedBuffer = await sharpPipeline.toBuffer();

    const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
            .upload_stream({ folder }, (err, res) =>
                err ? reject(err) : resolve(res)
            )
            .end(optimizedBuffer);
    });
    return result.secure_url;

}
