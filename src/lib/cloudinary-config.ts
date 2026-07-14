
import { v2 as cloudinary } from 'cloudinary';
import { getStorageRaw } from '../services/settingsService.js';

export async function applyStorageConfig() {
  try {
    const row = await getStorageRaw();
    if (row?.cloud_name && row?.api_key && row?.api_secret) {
      cloudinary.config({
        cloud_name: row.cloud_name,
        api_key: row.api_key,
        api_secret: row.api_secret,
      });
    }
  } catch (e: unknown) {
    console.error("Failed to load storage config from DB:", e instanceof Error ? e.message : String(e));
  }
}

export default cloudinary;
 