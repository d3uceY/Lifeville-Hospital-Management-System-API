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

// ─── All settings (combined GET) ─────────────────────────────────────────────

export async function getAllSettings() {
  const [hospitalInfo, contact, prefixes, billing, documents] = await Promise.all([
    getHospitalInfo(),
    getContact(),
    getPrefixes(),
    getBilling(),
    getDocuments(),
  ]);
  return { hospitalInfo, contact, prefixes, billing, documents };
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

  await Promise.all(tasks);
  return results;
}
