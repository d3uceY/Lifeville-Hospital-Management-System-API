import { S3Client } from "@aws-sdk/client-s3";
import { getStorageRaw } from "../services/settingsService.js";

let cached = null;

/**
 * Builds (or returns) a cached S3Client pointed at Cloudflare R2.
 * Credentials are read from settings_storage on the first call after a refresh,
 * then the cached client + bucket is reused.
 */
export async function getR2Client() {
  if (cached) return cached;

  const row = await getStorageRaw();
  if (!row?.account_id || !row?.access_key_id || !row?.secret_access_key || !row?.bucket) {
    const err = new Error("R2 storage is not configured. Set Cloudflare R2 credentials in Settings → Storage.");
    err.status = 400;
    throw err;
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${row.account_id}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: row.access_key_id,
      secretAccessKey: row.secret_access_key,
    },
  });

  cached = { client, bucket: row.bucket };
  return cached;
}

/** Invalidates cached client so the next call re-reads credentials from DB. */
export function refreshR2Client() {
  cached = null;
}
