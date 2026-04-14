import { db } from "../../drizzle-db.js";
import { patients } from "../../drizzle/migrations/schema.js";
import { eq } from "drizzle-orm";
import { uploadToCloudinary } from "../utils/uploadImage.js";
import deleteImage from "../utils/deleteImage.js";
import { extractPublicId } from "../utils/extractCloudinaryPublicId.js";
import * as mediaContentService from "./mediaContentService.js";
import { getAllSettings } from "./settingsService.js";
import { UPLOAD_SUBFOLDERS } from "../constants/domain.js";
import { invalidatePatientsCache } from "./patientServices.js";

/**
 * Uploads a new patient profile image to Cloudinary and upserts the media_content record.
 * If the patient already has a profile image, the old image is removed from Cloudinary
 * and the media_content row is updated in-place. Otherwise a new row is inserted and
 * linked to the patient via mediaId.
 *
 * @param {number} patientId
 * @param {Buffer} fileBuffer - The image file buffer from multer
 * @param {string} contentType - The MIME type of the uploaded file
 * @returns {Promise<object>} The upserted media_content record
 */
export const upsertPatientProfileImage = async (patientId, fileBuffer, contentType) => {
  const settings = await getAllSettings();
  const uploadFolder = `${settings.storage.folder_name}/${UPLOAD_SUBFOLDERS.PATIENT_PROFILE}`;

  const [patient] = await db
    .select({ mediaId: patients.mediaId })
    .from(patients)
    .where(eq(patients.patientId, patientId));

  if (!patient) {
    const err = new Error("Patient not found");
    err.code = "PATIENT_NOT_FOUND";
    throw err;
  }

  // Upload the new image to Cloudinary
  const imageUrl = await uploadToCloudinary(fileBuffer, uploadFolder, "patient-photo");
  const publicKey = extractPublicId(imageUrl);

  let mediaRecord;

  if (patient.mediaId) {
    const existingMedia = await mediaContentService.getMediaContentById(patient.mediaId);

    if (existingMedia) {
      // Delete the old Cloudinary image and update the existing media_content row
      await deleteImage(existingMedia.url);
      mediaRecord = await mediaContentService.updateMediaContent(patient.mediaId, {
        key: publicKey,
        url: imageUrl,
        contentType,
      });
    } else {
      // The mediaId reference is dangling — insert a fresh record and relink
      mediaRecord = await mediaContentService.insertMediaContent({ key: publicKey, url: imageUrl, contentType });
      await db
        .update(patients)
        .set({ mediaId: mediaRecord.id })
        .where(eq(patients.patientId, patientId));
    }
  } else {
    // No existing profile image — insert and link
    mediaRecord = await mediaContentService.insertMediaContent({ key: publicKey, url: imageUrl, contentType });
    await db
      .update(patients)
      .set({ mediaId: mediaRecord.id })
      .where(eq(patients.patientId, patientId));
  }

  invalidatePatientsCache();
  return mediaRecord;
};

/**
 * Deletes a patient's profile image from Cloudinary and removes the media_content record.
 * The FK ON DELETE SET NULL constraint automatically nullifies patients.mediaId.
 *
 * @param {number} patientId
 * @returns {Promise<void>}
 */
export const deletePatientProfileImage = async (patientId) => {
  const [patient] = await db
    .select({ mediaId: patients.mediaId })
    .from(patients)
    .where(eq(patients.patientId, patientId));

  if (!patient) {
    const err = new Error("Patient not found");
    err.code = "PATIENT_NOT_FOUND";
    throw err;
  }

  if (!patient.mediaId) {
    const err = new Error("This patient has no profile image");
    err.code = "NO_PROFILE_IMAGE";
    throw err;
  }

  const mediaRecord = await mediaContentService.getMediaContentById(patient.mediaId);

  if (mediaRecord) {
    await deleteImage(mediaRecord.url);
    await mediaContentService.deleteMediaContentById(mediaRecord.id);
    // FK ON DELETE SET NULL handles nullifying patients.mediaId
  }

  invalidatePatientsCache();
};
