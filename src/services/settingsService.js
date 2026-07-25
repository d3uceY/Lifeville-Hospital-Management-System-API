import { query } from "../../drizzle-db.js";
import { CURRENCIES } from "../constants/currencies.js";

// ─── Currencies ───────────────────────────────────────────────────────────────

/** Returns all currencies as an array — used to populate the frontend dropdown */
export function listCurrencies() {
  return Object.values(CURRENCIES);
}

/** Returns one currency by code, or null */
export function getCurrencyByCode(code) {
  return CURRENCIES[code?.toUpperCase()] ?? null;
}

// ─── Hospital Info ────────────────────────────────────────────────────────────

export async function getHospitalInfo() {
  const { rows } = await query(`SELECT * FROM settings_hospital_info WHERE id = 1`);
  return rows[0] ?? null;
}

export async function upsertHospitalInfo({ hospitalName, hospitalShortName, licenseNumber }) {
  const { rows } = await query(
    `INSERT INTO settings_hospital_info (id, hospital_name, hospital_short_name, license_number, updated_at)
     VALUES (1, $1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE SET
       hospital_name     = EXCLUDED.hospital_name,
       hospital_short_name = EXCLUDED.hospital_short_name,
       license_number    = EXCLUDED.license_number,
       updated_at        = NOW()
     RETURNING *`,
    [hospitalName, hospitalShortName, licenseNumber]
  );
  return rows[0];
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export async function getContact() {
  const { rows } = await query(`SELECT * FROM settings_contact WHERE id = 1`);
  return rows[0] ?? null;
}

export async function upsertContact({ address, city, country, phone, email, website }) {
  const { rows } = await query(
    `INSERT INTO settings_contact (id, address, city, country, phone, email, website, updated_at)
     VALUES (1, $1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (id) DO UPDATE SET
       address    = EXCLUDED.address,
       city       = EXCLUDED.city,
       country    = EXCLUDED.country,
       phone      = EXCLUDED.phone,
       email      = EXCLUDED.email,
       website    = EXCLUDED.website,
       updated_at = NOW()
     RETURNING *`,
    [address, city, country, phone, email, website]
  );
  return rows[0];
}

// ─── Prefixes ─────────────────────────────────────────────────────────────────

export async function getPrefixes() {
  const { rows } = await query(`SELECT * FROM settings_prefixes WHERE id = 1`);
  return rows[0] ?? null;
}

export async function upsertPrefixes({
  billNumberPrefix, patientIdPrefix, labIdPrefix, admissionIdPrefix,
  birthIdPrefix, deathIdPrefix, appointmentIdPrefix, invoiceIdPrefix,
}) {
  const { rows } = await query(
    `INSERT INTO settings_prefixes
       (id, bill_number_prefix, patient_id_prefix, lab_id_prefix, admission_id_prefix,
        birth_id_prefix, death_id_prefix, appointment_id_prefix, invoice_id_prefix, updated_at)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, NOW())
     ON CONFLICT (id) DO UPDATE SET
       bill_number_prefix    = EXCLUDED.bill_number_prefix,
       patient_id_prefix     = EXCLUDED.patient_id_prefix,
       lab_id_prefix         = EXCLUDED.lab_id_prefix,
       admission_id_prefix   = EXCLUDED.admission_id_prefix,
       birth_id_prefix       = EXCLUDED.birth_id_prefix,
       death_id_prefix       = EXCLUDED.death_id_prefix,
       appointment_id_prefix = EXCLUDED.appointment_id_prefix,
       invoice_id_prefix     = EXCLUDED.invoice_id_prefix,
       updated_at            = NOW()
     RETURNING *`,
    [billNumberPrefix, patientIdPrefix, labIdPrefix, admissionIdPrefix,
     birthIdPrefix, deathIdPrefix, appointmentIdPrefix, invoiceIdPrefix]
  );
  return rows[0];
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export async function getBilling() {
  const { rows } = await query(`SELECT * FROM settings_billing WHERE id = 1`);
  if (!rows[0]) return null;
  // Enrich with full currency info from the map
  const currency = getCurrencyByCode(rows[0].currency_code);
  return { ...rows[0], currency };
}

export async function upsertBilling({ currencyCode, currencySymbolPosition }) {
  // Validate the code exists in our map
  if (!CURRENCIES[currencyCode?.toUpperCase()]) {
    throw new Error(`Unknown currency code: ${currencyCode}`);
  }
  const { rows } = await query(
    `INSERT INTO settings_billing (id, currency_code, currency_symbol_position, updated_at)
     VALUES (1, $1, $2, NOW())
     ON CONFLICT (id) DO UPDATE SET
       currency_code             = EXCLUDED.currency_code,
       currency_symbol_position  = EXCLUDED.currency_symbol_position,
       updated_at                = NOW()
     RETURNING *`,
    [currencyCode.toUpperCase(), currencySymbolPosition ?? "before"]
  );
  const currency = getCurrencyByCode(rows[0].currency_code);
  return { ...rows[0], currency };
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getDocuments() {
  const { rows } = await query(`SELECT * FROM settings_documents WHERE id = 1`);
  return rows[0] ?? null;
}

export async function upsertDocuments({ labReportFooter, printFooterText, showHospitalHeader }) {
  const { rows } = await query(
    `INSERT INTO settings_documents (id, lab_report_footer, print_footer_text, show_hospital_header, updated_at)
     VALUES (1, $1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE SET
       lab_report_footer    = EXCLUDED.lab_report_footer,
       print_footer_text    = EXCLUDED.print_footer_text,
       show_hospital_header = EXCLUDED.show_hospital_header,
       updated_at           = NOW()
     RETURNING *`,
    [labReportFooter, printFooterText, showHospitalHeader ?? true]
  );
  return rows[0];
}

// ─── Email (SMTP) ─────────────────────────────────────────────────────────────

/** Internal — returns the full row including smtp_pass (never expose to API). */
export async function getEmailRaw() {
  const { rows } = await query(`SELECT * FROM settings_email WHERE id = 1`);
  return rows[0] ?? null;
}

/** Public — returns smtp settings with smtp_pass replaced by a boolean. */
export async function getEmail() {
  const row = await getEmailRaw();
  if (!row) return null;
  const { smtp_pass, ...rest } = row;
  return { ...rest, has_smtp_pass: !!(smtp_pass) };
}

export async function upsertEmail({ smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFrom }) {
  const { rows } = await query(
    `INSERT INTO settings_email (id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from, updated_at)
     VALUES (1, $1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (id) DO UPDATE SET
       smtp_host   = EXCLUDED.smtp_host,
       smtp_port   = EXCLUDED.smtp_port,
       smtp_secure = EXCLUDED.smtp_secure,
       smtp_user   = EXCLUDED.smtp_user,
       smtp_pass   = COALESCE(EXCLUDED.smtp_pass, settings_email.smtp_pass),
       smtp_from   = EXCLUDED.smtp_from,
       updated_at  = NOW()
     RETURNING id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_from, updated_at,
               (smtp_pass IS NOT NULL AND smtp_pass <> '') AS has_smtp_pass`,
    [smtpHost ?? null, parseInt(smtpPort) || 587, smtpSecure ?? false, smtpUser ?? null, smtpPass ?? null, smtpFrom ?? null]
  );
  return rows[0];
}

// ─── Storage (Cloudflare R2) ──────────────────────────────────────────────────

/** Internal — returns the full row including access_key_id/secret_access_key (never expose to API). */
export async function getStorageRaw() {
  const { rows } = await query(`SELECT * FROM settings_storage WHERE id = 1`);
  return rows[0] ?? null;
}

/** Public — returns storage settings with secrets replaced by booleans. */
export async function getStorage() {
  const row = await getStorageRaw();
  if (!row) return null;
  const { access_key_id, secret_access_key, ...rest } = row;
  return { ...rest, has_access_key_id: !!(access_key_id), has_secret_access_key: !!(secret_access_key) };
}

export async function upsertStorage({ accountId, accessKeyId, secretAccessKey, bucket, folderName }) {
  const { rows } = await query(
    `INSERT INTO settings_storage (id, provider, account_id, access_key_id, secret_access_key, bucket, folder_name, updated_at)
     VALUES (1, 'r2', $1, $2, $3, $4, $5, NOW())
     ON CONFLICT (id) DO UPDATE SET
       provider         = 'r2',
       account_id       = EXCLUDED.account_id,
       access_key_id    = COALESCE(EXCLUDED.access_key_id, settings_storage.access_key_id),
       secret_access_key = COALESCE(EXCLUDED.secret_access_key, settings_storage.secret_access_key),
       bucket           = EXCLUDED.bucket,
       folder_name      = EXCLUDED.folder_name,
       updated_at       = NOW()
     RETURNING id, provider, account_id, bucket, folder_name, updated_at,
               (access_key_id IS NOT NULL AND access_key_id <> '') AS has_access_key_id,
               (secret_access_key IS NOT NULL AND secret_access_key <> '') AS has_secret_access_key`,
    [accountId ?? null, accessKeyId ?? null, secretAccessKey ?? null, bucket ?? null, folderName ?? null]
  );
  return rows[0];
}

// ─── All settings (combined GET) ─────────────────────────────────────────────

let settingsCache = null;

export const invalidateSettingsCache = () => { settingsCache = null; };

export async function getAllSettings() {
  if (settingsCache) return settingsCache;

  const [hospitalInfo, contact, prefixes, billing, documents, email, storage] = await Promise.all([
    getHospitalInfo(),
    getContact(),
    getPrefixes(),
    getBilling(),
    getDocuments(),
    getEmail(),
    getStorage(),
  ]);
  settingsCache = { hospitalInfo, contact, prefixes, billing, documents, email, storage };
  return settingsCache;
}

// ─── Unified update — routes each field to the correct table ─────────────────
// Only tables whose fields appear in `payload` are updated.

const HOSPITAL_INFO_KEYS = new Set(["hospitalName", "hospitalShortName", "licenseNumber"]);
const CONTACT_KEYS       = new Set(["address", "city", "country", "phone", "email", "website"]);
const PREFIXES_KEYS      = new Set([
  "billNumberPrefix", "patientIdPrefix", "labIdPrefix", "admissionIdPrefix",
  "birthIdPrefix", "deathIdPrefix", "appointmentIdPrefix", "invoiceIdPrefix",
]);
const BILLING_KEYS       = new Set(["currencyCode", "currencySymbolPosition"]);
const DOCUMENTS_KEYS     = new Set(["labReportFooter", "printFooterText", "showHospitalHeader"]);
const EMAIL_KEYS         = new Set(["smtpHost", "smtpPort", "smtpSecure", "smtpUser", "smtpPass", "smtpFrom"]);
const STORAGE_KEYS       = new Set(["accountId", "accessKeyId", "secretAccessKey", "bucket", "folderName"]);

function pickKeys(payload, keySet) {
  const picked = {};
  for (const k of keySet) {
    if (Object.prototype.hasOwnProperty.call(payload, k)) picked[k] = payload[k];
  }
  return Object.keys(picked).length ? picked : null;
}

export async function updateAllSettings(payload) {
  const tasks = [];
  const results = {};

  const hospitalInfoData = pickKeys(payload, HOSPITAL_INFO_KEYS);
  if (hospitalInfoData) {
    // Merge with existing values so upsert keeps unchanged fields
    const existing = await getHospitalInfo();
    tasks.push(
      upsertHospitalInfo({ ...existing, ...hospitalInfoData })
        .then(r => { results.hospitalInfo = r; })
    );
  }

  const contactData = pickKeys(payload, CONTACT_KEYS);
  if (contactData) {
    const existing = await getContact();
    tasks.push(
      upsertContact({ ...existing, ...contactData })
        .then(r => { results.contact = r; })
    );
  }

  const prefixesData = pickKeys(payload, PREFIXES_KEYS);
  if (prefixesData) {
    const existing = await getPrefixes();
    tasks.push(
      upsertPrefixes({ ...existing, ...prefixesData })
        .then(r => { results.prefixes = r; })
    );
  }

  const billingData = pickKeys(payload, BILLING_KEYS);
  if (billingData) {
    const existing = await getBilling();
    tasks.push(
      upsertBilling({ ...existing, ...billingData })
        .then(r => { results.billing = r; })
    );
  }

  const documentsData = pickKeys(payload, DOCUMENTS_KEYS);
  if (documentsData) {
    const existing = await getDocuments();
    tasks.push(
      upsertDocuments({ ...existing, ...documentsData })
        .then(r => { results.documents = r; })
    );
  }

  const emailData = pickKeys(payload, EMAIL_KEYS);
  if (emailData) {
    const existing = await getEmail();
    tasks.push(
      upsertEmail({ ...existing, ...emailData })
        .then(r => { results.email = r; })
    );
  }

  const storageData = pickKeys(payload, STORAGE_KEYS);
  if (storageData) {
    const existing = await getStorage();
    tasks.push(
      upsertStorage({ ...existing, ...storageData })
        .then(r => { results.storage = r; })
    );
  }

  await Promise.all(tasks);
  invalidateSettingsCache();
  return results;
}
