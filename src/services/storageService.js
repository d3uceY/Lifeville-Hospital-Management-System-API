import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import sharp from "sharp";
import { getR2Client } from "../lib/r2Client.js";

// ─── Upload preset types — use these constants, never magic strings ──────────
export const UPLOAD_PRESETS = Object.freeze({
  LAB_DOC:        "lab-doc",        // no resize, keeps original (PDFs too)
  AVATAR:         "avatar",         // 256×256 cover
  PATIENT_PHOTO:  "patient-photo",  // 400×400 cover
  DEFAULT:        "default",        // 1200×800 inside
  LOGO:           "logo",           // 600px max, preserves alpha transparency
});

// ─── Sharp resize presets (same specs as previous Cloudinary uploads) ──────────
const RESIZE_PRESETS = {
  [UPLOAD_PRESETS.LAB_DOC]:       null,
  [UPLOAD_PRESETS.AVATAR]:        { width: 256, height: 256, fit: "cover" },
  [UPLOAD_PRESETS.PATIENT_PHOTO]: { width: 400, height: 400, fit: "cover" },
  [UPLOAD_PRESETS.DEFAULT]:       { width: 1200, height: 800, fit: "inside" },
  [UPLOAD_PRESETS.LOGO]:          { width: 94, height: 94, fit: "inside" },
};

const QUALITY = {
  [UPLOAD_PRESETS.LAB_DOC]:       80,
  [UPLOAD_PRESETS.AVATAR]:        70,
  [UPLOAD_PRESETS.PATIENT_PHOTO]: 70,
  [UPLOAD_PRESETS.DEFAULT]:       80,
  [UPLOAD_PRESETS.LOGO]:          90,
};

/** MIME → file extension */
const EXT_MAP = {
  "image/jpeg":     "jpg",
  "image/png":      "png",
  "image/webp":     "webp",
  "image/svg+xml":  "svg",
  "application/pdf": "pdf",
};

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Builds a deterministic object key: `{folder}/{uuid}.{ext}`.
 * @param {string} folder - e.g. "lifeville/patient-profiles"
 * @param {string} mimeType - e.g. "image/jpeg"
 * @returns {string}
 */
export function buildObjectKey(folder, mimeType) {
  const ext = EXT_MAP[mimeType] || "bin";
  return `${folder}/${crypto.randomUUID()}.${ext}`;
}

/**
 * Resizes, optimizes, and uploads a file buffer to R2.
 * Returns the object key (not a URL).
 *
 * @param {Buffer} fileBuffer
 * @param {string} objectKey - full object key in the bucket
 * @param {"lab-doc"|"avatar"|"patient-photo"|"default"} [type="default"]
 * @param {string} [mimeType="image/jpeg"]
 * @returns {Promise<string>} the object key
 */
export async function uploadObject(fileBuffer, objectKey, type = "default", mimeType = "image/jpeg") {
  const { client, bucket } = await getR2Client();

  // Only run Sharp for image types — skip for SVGs, PDFs, and other non-raster files
  const isImage = mimeType.startsWith("image/") && mimeType !== "image/svg+xml";
  let body = fileBuffer;

  if (isImage) {
    const preset = RESIZE_PRESETS[type] !== undefined ? RESIZE_PRESETS[type] : RESIZE_PRESETS.default;
    const quality = QUALITY[type] !== undefined ? QUALITY[type] : QUALITY.default;

    const sharpPipeline = sharp(fileBuffer);
    if (preset) sharpPipeline.resize(preset);

    // Preserve alpha transparency for logos — use PNG output
    if (type === UPLOAD_PRESETS.LOGO) {
      body = await sharpPipeline.png({ quality }).toBuffer();
      mimeType = "image/png";
    } else {
      body = await sharpPipeline.jpeg({ quality }).toBuffer();
    }
  }

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: body,
    ContentType: mimeType,
  }));

  return objectKey;
}

/**
 * Generates a short-lived presigned GET URL for a private R2 object.
 * @param {string} key - object key in the bucket
 * @param {number} [expiresInSeconds=900] - 15 min default
 * @returns {Promise<string>} signed URL
 */
export async function generateDownloadUrl(key, expiresInSeconds = 900) {
  const { client, bucket } = await getR2Client();
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  }), { expiresIn: expiresInSeconds });
}

/**
 * Deletes an object from R2 by key.
 * @param {string} key
 * @returns {Promise<void>}
 */
export async function deleteObject(key) {
  const { client, bucket } = await getR2Client();
  await client.send(new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  }));
}
