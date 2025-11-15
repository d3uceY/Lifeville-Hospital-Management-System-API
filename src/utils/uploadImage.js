import cloudinary from "../lib/cloudinary-config.js";
import sharp from "sharp";

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
