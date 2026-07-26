import { db } from "../../drizzle-db.js";
import { settingsDocuments } from "../../drizzle/migrations/schema.js";
import { eq } from "drizzle-orm";
import * as storageService from "./storageService.js";
import * as mediaContentService from "./mediaContentService.js";
import { getAllSettings } from "./settingsService.js";
import { invalidateSettingsCache } from "./settingsService.js";
import { UPLOAD_SUBFOLDERS } from "../constants/domain.js";

/**
 * Uploads a hospital logo to R2 and links it to settings_documents.
 * If a logo already exists, the old R2 object and media_content row are replaced.
 *
 * @param {Buffer} fileBuffer
 * @param {string} contentType
 * @returns {Promise<{mediaContentId: number, url: string}>}
 */
export const upsertHospitalLogo = async (fileBuffer, contentType) => {
  const settings = await getAllSettings();

  if (!settings.storage?.folder_name) {
    const err = new Error(
      "Storage is not configured. Go to Settings -> Storage to set up R2 credentials and folder name before uploading a logo."
    );
    err.code = "STORAGE_NOT_CONFIGURED";
    throw err;
  }

  const uploadFolder = `${settings.storage.folder_name}/${UPLOAD_SUBFOLDERS.HOSPITAL_LOGO}`;

  // Store logo as PNG to preserve alpha transparency
  const pngContentType = "image/png";
  const objectKey = storageService.buildObjectKey(uploadFolder, pngContentType);
  await storageService.uploadObject(fileBuffer, objectKey, storageService.UPLOAD_PRESETS.LOGO, pngContentType);

  const mediaRecord = await mediaContentService.insertMediaContent({ key: objectKey, contentType: pngContentType });

  // Link to settings_documents (id=1), clean up old logo if any
  const [current] = await db
    .select({ mediaId: settingsDocuments.hospitalLogoMediaId })
    .from(settingsDocuments)
    .where(eq(settingsDocuments.id, 1));

  if (current?.mediaId) {
    const oldMedia = await mediaContentService.getMediaContentById(current.mediaId);
    if (oldMedia?.key) await storageService.deleteObject(oldMedia.key).catch(() => {});
    await mediaContentService.deleteMediaContentById(current.mediaId);
  }

  await db
    .update(settingsDocuments)
    .set({ hospitalLogoMediaId: mediaRecord.id })
    .where(eq(settingsDocuments.id, 1));

  invalidateSettingsCache();

  const url = await storageService.generateDownloadUrl(objectKey, 604800);
  return { mediaContentId: mediaRecord.id, url };
};

/**
 * Deletes the hospital logo from R2 and clears the reference in settings_documents.
 */
export const deleteHospitalLogo = async () => {
  const [current] = await db
    .select({ mediaId: settingsDocuments.hospitalLogoMediaId })
    .from(settingsDocuments)
    .where(eq(settingsDocuments.id, 1));

  if (!current?.mediaId) {
    const err = new Error("No hospital logo to delete");
    err.code = "NO_LOGO";
    throw err;
  }

  const media = await mediaContentService.getMediaContentById(current.mediaId);
  if (media?.key) await storageService.deleteObject(media.key).catch(() => {});
  await mediaContentService.deleteMediaContentById(current.mediaId);

  await db
    .update(settingsDocuments)
    .set({ hospitalLogoMediaId: null })
    .where(eq(settingsDocuments.id, 1));

  invalidateSettingsCache();
};
